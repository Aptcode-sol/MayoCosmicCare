const prisma = require('../prismaClient');

/**
 * Generate a 6-digit numeric OTP
 */
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP for an email
 * @param {string} email 
 * @param {string} otp 
 */
async function storeOtp(email, otp) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Remove any existing OTPs for this email to keep table clean
    await prisma.otpStore.deleteMany({
        where: { email }
    });

    await prisma.otpStore.create({
        data: { email, otp, expiresAt }
    });
}

/**
 * Verify OTP for an email
 * @param {string} email 
 * @param {string} otpInput 
 * @returns {Promise<boolean>}
 */
async function verifyOtp(email, otpInput) {
    const entry = await prisma.otpStore.findFirst({
        where: { email }
    });

    if (!entry) {
        return false;
    }

    // Check expiration
    if (new Date() > entry.expiresAt) {
        await prisma.otpStore.delete({ where: { id: entry.id } });
        return false;
    }

    // Check validity
    if (entry.otp === otpInput) {
        await prisma.otpStore.delete({ where: { id: entry.id } });
        return true;
    }

    return false;
}

/**
 * Check if OTP is valid without removing it (for UI validation)
 */
async function peekOtp(email, otpInput) {
    const entry = await prisma.otpStore.findFirst({
        where: { email }
    });
    if (!entry) return false;
    if (new Date() > entry.expiresAt) return false;
    return entry.otp === otpInput;
}

module.exports = {
    generateOtp,
    storeOtp,
    verifyOtp,
    peekOtp
};
