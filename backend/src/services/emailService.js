const nodemailer = require('nodemailer');

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOtpEmail(email, otp) {
    try {
        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-weight: 300;">Mayo Cosmic Care</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
                <h2 style="color: #334155; margin-top: 0;">Verification Code</h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.5;">
                    Welcome to Mayo Cosmic Care! Please use the following One-Time Password (OTP) to verify your email address and complete your registration.
                </p>
                <div style="margin: 30px 0; text-align: center;">
                    <span style="background-color: #f1f5f9; color: #0f172a; padding: 12px 24px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 6px; border: 1px dashed #cbd5e1;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #94a3b8; font-size: 14px;">
                    This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
                </p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} Mayo Cosmic Care. All rights reserved.
                </p>
            </div>
        </div>
        `;

        const info = await transporter.sendMail({
            from: `"Mayo Cosmic Care" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your Signup Verification Code",
            text: `Your OTP code is: ${otp}`,
            html: htmlContent
        });
        console.log(`[EMAIL] OTP sent to ${email}: ${info.messageId} ${otp}`);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EMAIL] Error sending OTP to ${email}:`, error);
        throw new Error('Failed to send OTP email');
    }
}

/**
 * Email service helper - currently stubs or using log fallback if creds missing
 */
async function sendVerificationEmail(email, token) {
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    console.log(`[EMAIL] Send verification to ${email}: ${verifyLink}`);
    // For now, we are replacing link verification with OTP, but keeping this for legacy/other flows
    return { sent: true };
}

async function sendPasswordResetEmail(email, token) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    console.log(`[EMAIL] Send password reset to ${email}: ${resetLink}`);
    // TODO: Implement actual sending if needed
    return { sent: true };
}

async function sendReferralNotification(email, referredUsername) {
    console.log(`[EMAIL] Notify ${email}: ${referredUsername} joined under you`);
    return { sent: true };
}

async function sendPayoutNotification(email, amount, type) {
    console.log(`[EMAIL] Notify ${email}: You received ${type} of ₹${amount}`);
    return { sent: true };
}

module.exports = {
    sendOtpEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendReferralNotification,
    sendPayoutNotification
};
