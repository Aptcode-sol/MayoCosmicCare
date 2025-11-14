/**
 * Email service helper - stub for now.
 * In production, integrate with SendGrid, Mailgun, or AWS SES.
 */

async function sendVerificationEmail(email, token) {
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    console.log(`[EMAIL] Send verification to ${email}: ${verifyLink}`);
    // TODO: Integrate real email provider
    return { sent: true };
}

async function sendPasswordResetEmail(email, token) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    console.log(`[EMAIL] Send password reset to ${email}: ${resetLink}`);
    // TODO: Integrate real email provider
    return { sent: true };
}

async function sendReferralNotification(email, referredUsername) {
    console.log(`[EMAIL] Notify ${email}: ${referredUsername} joined under you`);
    // TODO: Integrate real email provider
    return { sent: true };
}

async function sendPayoutNotification(email, amount, type) {
    console.log(`[EMAIL] Notify ${email}: You received ${type} of ₹${amount}`);
    // TODO: Integrate real email provider
    return { sent: true };
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendReferralNotification,
    sendPayoutNotification
};
