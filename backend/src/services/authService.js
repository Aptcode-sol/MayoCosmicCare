const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const { placeNewUser } = require('./placementService');
const { generateOtp, storeOtp, verifyOtp, peekOtp } = require('./otpService');
const { sendOtpEmail } = require('./emailService');


const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const crypto = require('crypto');

function signAccessToken(user) {
    return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
}

function genRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
}

async function register({ username, email, phone, password, sponsorId, leg, otp }) {
    if (!username || !email || !password) throw new Error('username/email/password required');

    // OTP Verification
    if (process.env.NODE_ENV !== 'test') { // Skip OTP in test environment if needed, or strictly enforce
        if (!otp) {
            throw new Error('OTP is required');
        }
        if (!verifyOtp(email, otp)) {
            throw new Error('Invalid or expired OTP');
        }
    }

    // Check if this is the first user (admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Sponsor optional as per new requirements
    // if (!isFirstUser && !sponsorId) {
    //    throw new Error('Sponsor ID required for registration');
    // }

    // Validate sponsor exists.
    // Logic: Sponsor ID ends with a digit?
    // If digit is EVEN (0, 2, 4...) -> Place LEFT
    // If digit is ODD (1, 3, 5...) -> Place RIGHT
    // We strip the last digit to find the actual sponsor.

    let resolvedSponsorId = null;
    let placementLeg = null;

    if (sponsorId) {
        // Check if the last character is a digit
        const lastChar = sponsorId.slice(-1);
        const isDigit = /^\d$/.test(lastChar);

        let searchIdentifier = sponsorId;

        if (isDigit) {
            const digit = parseInt(lastChar, 10);
            placementLeg = (digit % 2 === 0) ? 'left' : 'right';
            searchIdentifier = sponsorId.slice(0, -1);
        }

        console.log(`[AUTH] Sponsor Resolution. Input: ${sponsorId}. IsDigit: ${isDigit}. Stripped: ${searchIdentifier}. CalcLeg: ${placementLeg}`);

        // Find sponsor using the stripped identifier
        // try id first
        let sponsor = await prisma.user.findUnique({ where: { id: searchIdentifier } });
        if (!sponsor) {
            // try email
            sponsor = await prisma.user.findUnique({ where: { email: searchIdentifier } }).catch(() => null);
        }
        if (!sponsor) {
            // try username
            sponsor = await prisma.user.findFirst({ where: { username: searchIdentifier } }).catch(() => null);
        }

        console.log(`[AUTH] Found via stripped? ${!!sponsor ? sponsor.id : 'No'}`);

        // If not found with stripped ID, try the original ID (maybe the digit was part of the username/ID)
        if (!sponsor && isDigit) {
            console.log('[AUTH] Falling back to original ID search...');
            let originalSponsor = await prisma.user.findUnique({ where: { id: sponsorId } });
            if (!originalSponsor) {
                originalSponsor = await prisma.user.findUnique({ where: { email: sponsorId } }).catch(() => null);
            }
            if (!originalSponsor) {
                originalSponsor = await prisma.user.findFirst({ where: { username: sponsorId } }).catch(() => null);
            }

            if (originalSponsor) {
                sponsor = originalSponsor;
                placementLeg = null; // The digit was part of the ID, so we ignore it for placement
                console.log(`[AUTH] Found via original ID: ${sponsor.id}. Placement Leg reset to null.`);
            }
        }

        if (!sponsor) throw new Error('Invalid sponsor identifier');
        if (sponsor.isBlocked) throw new Error('Sponsor account is blocked');

        // Admin is always allowed to refer, but regular users must purchase first
        if (sponsor.role !== 'ADMIN' && !sponsor.hasPurchased) {
            throw new Error('Sponsor must purchase a product before referring others');
        }
        resolvedSponsorId = sponsor.id;
    }

    const hashed = await bcrypt.hash(password, 10);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    // Generate custom ID starting with 'mcc'
    const customId = 'mcc' + crypto.randomUUID().replace(/-/g, '');

    // Create user (handle unique constraint errors for friendlier messages)
    let user;
    try {
        user = await prisma.user.create({
            data: {
                id: customId,
                username,
                email,
                phone,
                password: hashed,
                sponsorId: resolvedSponsorId || null,
                emailVerifyToken,
                rank: 'Rookie',
                role: isFirstUser ? 'ADMIN' : 'USER',
                isEmailVerified: true, // Auto-verify since OTP was checked
                emailVerifyToken: null
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
        await placeNewUser(user.id, resolvedSponsorId, placementLeg || null);
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

// ===== OTP FUNCTIONS =====

// For Registration - OTP to new email (email must NOT exist)
async function sendOtp(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) throw new Error('Email already registered');

    const otp = generateOtp();
    storeOtp(email, otp);
    // await sendOtpEmail(email, otp);  

    return { message: 'OTP sent successfully' };
}

// For Forgot Password - OTP to existing email (email MUST exist)
async function sendForgotPasswordOtp(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('No account found with this email');

    const otp = generateOtp();
    storeOtp(`forgot:${email}`, otp); // Prefix to differentiate from registration OTP
    // await sendOtpEmail(email, otp);

    console.log(`[FORGOT-PWD] OTP for ${email}: ${otp}`);
    return { message: 'OTP sent to your email' };
}

// Verify Forgot Password OTP and reset password
async function resetPasswordWithOtp(email, otp, newPassword) {
    const valid = verifyOtp(`forgot:${email}`, otp);
    if (!valid) throw new Error('Invalid or expired OTP');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed }
    });

    return { message: 'Password reset successfully' };
}

// For Email Change - OTP to NEW email (verify ownership)
async function sendEmailChangeOtp(userId, newEmail) {
    // Check if new email is already taken
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) throw new Error('This email is already registered');

    const otp = generateOtp();
    storeOtp(`emailchange:${userId}:${newEmail}`, otp);
    // await sendOtpEmail(newEmail, otp);

    console.log(`[EMAIL-CHANGE] OTP for ${newEmail}: ${otp}`);
    return { message: 'OTP sent to new email' };
}

// Verify Email Change OTP and update email
async function verifyEmailChange(userId, newEmail, otp) {
    const valid = verifyOtp(`emailchange:${userId}:${newEmail}`, otp);
    if (!valid) throw new Error('Invalid or expired OTP');

    // Double-check email not taken
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) throw new Error('This email is already registered');

    await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail }
    });

    return { message: 'Email updated successfully' };
}

async function verifyOtpCode(email, otp) {
    const valid = peekOtp(email, otp);
    if (!valid) throw new Error('Invalid or expired OTP');

    return { message: 'OTP verified' };
}


// ===== UPDATE PROFILE FUNCTION =====
async function updateProfile(userId, { username, email, phone, password, currentPassword }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const updateData = {};

    if (username && username !== user.username) updateData.username = username;
    if (email && email !== user.email) updateData.email = email;
    if (phone && phone !== user.phone) updateData.phone = phone;

    // Change password logic
    if (password) {
        if (!currentPassword) {
            throw new Error('Current password required to set new password');
        }

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) throw new Error('Incorrect current password');

        updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
        return { message: 'No changes made' };
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                phone: true
            }
        });

        return {
            message: 'Profile updated successfully',
            user: updatedUser
        };
    } catch (e) {
        if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === 'P2002'
        ) {
            const target = (e.meta && e.meta.target) || [];
            const fields = Array.isArray(target) ? target : [target];

            if (fields.includes('email')) {
                throw new Error('Email already registered');
            }
            if (fields.includes('username')) {
                throw new Error('Username already taken');
            }

            throw new Error('Unique constraint failed');
        }
        throw e;
    }
}


// ===== COMBINED EXPORT =====
module.exports = {
    register,
    login,
    refreshToken,
    logoutRefresh,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    sendOtp,
    verifyOtpCode,
    updateProfile,
    // New OTP-based functions
    sendForgotPasswordOtp,
    resetPasswordWithOtp,
    sendEmailChangeOtp,
    verifyEmailChange
};

