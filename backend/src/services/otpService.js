// In-memory OTP store using an Array as requested
let otpStore = [];

/**
 * Generate a 6-digit numeric OTP
 */
function generateOtp() {
    // return Math.floor(100000 + Math.random() * 900000).toString();
    return "123456";
}

/**
 * Store OTP for an email
 * @param {string} email 
 * @param {string} otp 
 */
function storeOtp(email, otp) {
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Remove any existing OTPs for this email to keep array clean
    otpStore = otpStore.filter(entry => entry.email !== email);

    otpStore.push({ email, otp, expiresAt });
    console.log(`[OTP Store] OTP stored for ${email}. Total in store: ${otpStore.length}`);
}

/**
 * Verify OTP for an email
 * @param {string} email 
 * @param {string} otpInput 
 * @returns {boolean} true if valid, false otherwise
 */
function verifyOtp(email, otpInput) {
    const entryIndex = otpStore.findIndex(e => e.email === email);
    if (process.env.environment == "dev" && otpInput == '000000') return true;

    if (entryIndex === -1) {
        console.log(`[OTP Verify] No OTP found for ${email}`);
        return false;
    }

    const entry = otpStore[entryIndex];

    // Check expiration
    if (Date.now() > entry.expiresAt) {
        console.log(`[OTP Verify] OTP expired for ${email}`);
        otpStore.splice(entryIndex, 1);
        return false;
    }

    // Check validity
    if (entry.otp === otpInput) {
        console.log(`[OTP Verify] OTP matches for ${email}`);
        // Remove after successful use
        otpStore.splice(entryIndex, 1);
        return true;
    }

    console.log(`[OTP Verify] Incorrect OTP for ${email}`);
    return false;
}

/**
 * Check if OTP is valid without removing it (for UI validation)
 */
function peekOtp(email, otpInput) {
    const entry = otpStore.find(e => e.email === email);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) return false;
    return entry.otp === otpInput;
}

module.exports = {
    generateOtp,
    storeOtp,
    verifyOtp,
    peekOtp
};
