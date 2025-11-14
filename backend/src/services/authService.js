const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
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

async function register({ username, email, phone, password, sponsorId }) {
    if (!username || !email || !password) throw new Error('username/email/password required');

    // Check if this is the first user (admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Sponsor required unless first user
    if (!isFirstUser && !sponsorId) {
        throw new Error('Sponsor ID required for registration');
    }

    // Validate sponsor exists
    if (sponsorId) {
        const sponsor = await prisma.user.findUnique({ where: { id: sponsorId } });
        if (!sponsor) throw new Error('Invalid sponsor ID');
        if (sponsor.isBlocked) throw new Error('Sponsor account is blocked');
    }

    const hashed = await bcrypt.hash(password, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await prisma.user.create({
        data: {
            username,
            email,
            phone,
            password: hashed,
            sponsorId: sponsorId || null,
            emailVerifyToken,
            role: isFirstUser ? 'ADMIN' : 'USER'
        }
    });

    // Place user in binary tree (skip for first admin user)
    if (sponsorId) {
        await placeNewUser(user.id, sponsorId);
    }

    // Create wallet
    await prisma.wallet.create({ data: { userId: user.id } });

    // TODO: Send verification email with token
    console.log(`Email verification token for ${email}: ${emailVerifyToken}`);

    return { id: user.id, username: user.username, email: user.email };
}

async function login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    if (user.isBlocked) throw new Error('Account is blocked');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error('Invalid credentials');
    const accessToken = signAccessToken(user);
    const refresh = genRefreshToken();
    // store refresh token
    await prisma.refreshToken.create({ data: { userId: user.id, token: refresh } });
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
