const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();
const { placeNewUser } = require('./placementService');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const crypto = require('crypto');

function signAccessToken(user) {
    return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
}

function genRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
}

async function register({ username, email, phone, password, sponsorId, leg }) {
    if (!username || !email || !password) throw new Error('username/email/password required');

    // Check if this is the first user (admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Sponsor required unless first user
    if (!isFirstUser && !sponsorId) {
        throw new Error('Sponsor ID required for registration');
    }

    // Validate sponsor exists. Accept sponsor identifier as id, email, or username.
    let resolvedSponsorId = null;
    if (sponsorId) {
        // try id first
        let sponsor = await prisma.user.findUnique({ where: { id: sponsorId } });
        if (!sponsor) {
            // try email
            sponsor = await prisma.user.findUnique({ where: { email: sponsorId } }).catch(() => null);
        }
        if (!sponsor) {
            // try username
            sponsor = await prisma.user.findFirst({ where: { username: sponsorId } }).catch(() => null);
        }
        if (!sponsor) throw new Error('Invalid sponsor identifier');
        if (sponsor.isBlocked) throw new Error('Sponsor account is blocked');
        resolvedSponsorId = sponsor.id;
    }

    const hashed = await bcrypt.hash(password, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    // Create user (handle unique constraint errors for friendlier messages)
    let user;
    try {
        user = await prisma.user.create({
            data: {
                username,
                email,
                phone,
                password: hashed,
                sponsorId: resolvedSponsorId || null,
                emailVerifyToken,
                role: isFirstUser ? 'ADMIN' : 'USER'
            }
        });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            // extract the target field(s) if available
            const target = (e.meta && e.meta.target) || []
            const fields = Array.isArray(target) ? target : [target]
            if (fields.includes('email')) throw new Error('Email already registered')
            if (fields.includes('username')) throw new Error('Username already taken')
            throw new Error('A unique constraint failed. Please check your input')
        }
        throw e
    }

    // Place user in binary tree with optional leg preference (skip for first admin user)
    if (resolvedSponsorId) {
        // leg can be 'left' or 'right' for forced tail placement
        await placeNewUser(user.id, resolvedSponsorId, leg || null);
    }

    // Create wallet
    await prisma.wallet.create({ data: { userId: user.id } });

    // TODO: Send verification email with token
    console.log(`Email verification token for ${email}: ${emailVerifyToken}`);

    const result = { id: user.id, username: user.username, email: user.email };
    if (process.env.NODE_ENV !== 'production') {
        result.emailVerifyToken = emailVerifyToken;
    }
    return result;
}

async function login({ email, password, isAdminLogin = false }) {
    console.log('[LOGIN] Attempting login for:', email, 'isAdminLogin:', isAdminLogin);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('[LOGIN] User not found:', email);
        throw new Error('Invalid credentials');
    }
    console.log('[LOGIN] User found:', user.id, 'email:', user.email, 'role:', user.role, 'blocked:', user.isBlocked);

    // Role-based login restrictions
    if (isAdminLogin && user.role !== 'ADMIN') {
        throw new Error('Admin access required');
    }
    if (!isAdminLogin && user.role === 'ADMIN') {
        throw new Error('Please use admin portal to login');
    }

    if (user.isBlocked) throw new Error('Account is blocked');

    console.log('[LOGIN] Comparing password...');
    console.log('[LOGIN] Input password length:', password?.length);
    console.log('[LOGIN] Stored hash:', user.password?.substring(0, 20) + '...');

    const ok = await bcrypt.compare(password, user.password);
    console.log('[LOGIN] Password match result:', ok);

    if (!ok) throw new Error('Invalid credentials');
    const accessToken = signAccessToken(user);
    const refresh = genRefreshToken();
    // store refresh token
    await prisma.refreshToken.create({ data: { userId: user.id, token: refresh } });
    console.log('[LOGIN] Login successful for:', email);
    return { accessToken, refreshToken: refresh };
}

async function refreshToken(oldRefresh) {
    const record = await prisma.refreshToken.findUnique({ where: { token: oldRefresh } });
    if (!record || record.revoked) throw new Error('Invalid refresh token');
    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) throw new Error('Invalid token user');
    // revoke old token
    await prisma.refreshToken.update({ where: { token: oldRefresh }, data: { revoked: true } });
    const newRefresh = genRefreshToken();
    await prisma.refreshToken.create({ data: { userId: user.id, token: newRefresh } });
    const accessToken = signAccessToken(user);
    return { accessToken, refreshToken: newRefresh };
}

async function logoutRefresh(oldRefresh) {
    await prisma.refreshToken.updateMany({ where: { token: oldRefresh }, data: { revoked: true } });
}

async function verifyEmail(token) {
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) throw new Error('Invalid verification token');

    await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, emailVerifyToken: null }
    });

    return { message: 'Email verified successfully' };
}

async function requestPasswordReset(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry }
    });

    // TODO: Send reset email with token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'Password reset email sent' };
}

async function resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: { gt: new Date() }
        }
    });

    if (!user) throw new Error('Invalid or expired reset token');

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashed,
            resetToken: null,
            resetTokenExpiry: null
        }
    });

    return { message: 'Password reset successfully' };
}

module.exports = { register, login, refreshToken, logoutRefresh, verifyEmail, requestPasswordReset, resetPassword };
