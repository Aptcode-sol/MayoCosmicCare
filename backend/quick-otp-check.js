const { sendOtp } = require('./src/services/authService');
const { generateOtp, storeOtp, verifyOtp } = require('./src/services/otpService');

console.log('Modules loaded successfully');

try {
    const otp = generateOtp();
    console.log('Generated OTP:', otp);
    storeOtp('test@example.com', otp);
    const valid = verifyOtp('test@example.com', otp);
    console.log('Verification result:', valid);
} catch (e) {
    console.error(e);
}
