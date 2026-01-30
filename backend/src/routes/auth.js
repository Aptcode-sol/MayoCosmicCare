const express = require('express');
const router = express.Router();
const {
    register, login, refreshToken, logoutRefresh, verifyEmail,
    requestPasswordReset, resetPassword, sendOtp, verifyOtpCode,
    sendForgotPasswordOtp, resetPasswordWithOtp,
    sendEmailChangeOtp, verifyEmailChange
} = require('../services/authService');
const { authenticate } = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../prismaClient');


router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('[SEND-OTP] Request for:', email);
        if (!email) return res.status(400).json({ ok: false, error: 'Email is required' });

        const result = await sendOtp(email);
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[SEND-OTP] Error:', err);
        res.status(400).json({ ok: false, error: err.message || 'Failed to send OTP' });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ ok: false, error: 'Email and OTP required' });

        const result = await verifyOtpCode(email, otp);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

// ===== FORGOT PASSWORD (OTP-based) =====
router.post('/forgot-password/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ ok: false, error: 'Email is required' });

        const result = await sendForgotPasswordOtp(email);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/forgot-password/reset', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ ok: false, error: 'Email, OTP, and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
        }

        const result = await resetPasswordWithOtp(email, otp, newPassword);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

// ===== EMAIL CHANGE (OTP-based, requires auth) =====
router.post('/email-change/send-otp', authenticate, async (req, res) => {
    try {
        const { newEmail } = req.body;
        if (!newEmail) return res.status(400).json({ ok: false, error: 'New email is required' });

        const result = await sendEmailChangeOtp(req.user.id, newEmail);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/email-change/verify', authenticate, async (req, res) => {
    try {
        const { newEmail, otp } = req.body;
        if (!newEmail || !otp) return res.status(400).json({ ok: false, error: 'New email and OTP are required' });

        const result = await verifyEmailChange(req.user.id, newEmail, otp);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/register', async (req, res) => {
    try {
        console.log('[REGISTER] Request body:', JSON.stringify(req.body, null, 2));
        const parsed = registerSchema.parse(req.body);
        console.log('[REGISTER] Parsed data:', JSON.stringify(parsed, null, 2));
        const result = await register(parsed);
        console.log('[REGISTER] Success:', result.id);
        // result may include emailVerifyToken in dev for simulation
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[REGISTER] ERROR:', err);
        console.error('[REGISTER] Error stack:', err.stack);
        if (err.name === 'ZodError') {
            const errors = {};
            for (const e of err.errors) {
                errors[e.path[0]] = e.message;
            }
            console.error('[REGISTER] Validation errors:', errors);
            res.status(400).json({ ok: false, errors });
            return;
        }
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const parsed = loginSchema.parse(req.body);
        const tokens = await login(parsed);
        res.json({ ok: true, tokens });
    } catch (err) {
        if (err.name === 'ZodError') {
            const errors = {};
            for (const e of err.errors) {
                errors[e.path[0]] = e.message;
            }
            res.status(400).json({ ok: false, errors });
            return;
        }
        res.status(400).json({ ok: false, error: err.message });
    }
});

// Admin-only login endpoint
router.post('/admin-login', async (req, res) => {
    try {
        const parsed = loginSchema.parse(req.body);
        const tokens = await login({ ...parsed, isAdminLogin: true });
        res.json({ ok: true, tokens });
    } catch (err) {
        if (err.name === 'ZodError') {
            const errors = {};
            for (const e of err.errors) {
                errors[e.path[0]] = e.message;
            }
            res.status(400).json({ ok: false, errors });
            return;
        }
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const { refresh } = req.body;
        const tokens = await refreshToken(refresh);
        res.json({ ok: true, tokens });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/logout', authenticate, async (req, res) => {
    try {
        const { refresh } = req.body;
        await logoutRefresh(refresh);
        res.json({ ok: true });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.get('/me', authenticate, async (req, res) => {
    try {
        const id = req.user?.id
        if (!id) return res.status(401).json({ ok: false, error: 'Not authenticated' })

        const userRec = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                phone: true,
                kycStatus: true,
                kycRefId: true,
                pan: true,
                aadhaar: true,
                role: true,
                hasPurchased: true,
                createdAt: true,
                leftBV: true,
                rightBV: true,
                leftCarryBV: true,
                rightCarryBV: true,
                leftCarryCount: true,
                rightCarryBV: true,
                leftCarryCount: true,
                rightCarryCount: true,
                rank: true,
                totalPairs: true,
                sponsorId: true,
                parentId: true,
                // Get sponsor details for "Referred By" display
                sponsor: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                },
                // Get immediate children to find left/right child
                children: {
                    select: { id: true, position: true }
                },
                wallet: {
                    select: { balance: true }
                }
            }
        })

        if (!userRec) return res.status(404).json({ ok: false, error: 'User not found' })

        // Helper function to count all descendants
        async function countDescendants(userId) {
            if (!userId) return 0;
            const children = await prisma.user.findMany({
                where: { parentId: userId },
                select: { id: true }
            });
            let count = children.length;
            for (const child of children) {
                count += await countDescendants(child.id);
            }
            return count;
        }

        // Find left and right child IDs
        const leftChild = userRec.children.find(c => c.position === 'LEFT');
        const rightChild = userRec.children.find(c => c.position === 'RIGHT');

        // Calculate member counts dynamically
        const leftMemberCount = leftChild ? 1 + await countDescendants(leftChild.id) : 0;
        const rightMemberCount = rightChild ? 1 + await countDescendants(rightChild.id) : 0;

        // Build response without children field (keep sponsor)
        const { children, ...userData } = userRec;
        const user = {
            ...userData,
            name: userRec.name || userData.username, // Use actual name if available, else username
            leftMemberCount,
            rightMemberCount
        };

        res.json({ ok: true, user })
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message })
    }
});

router.get('/verify-email/:token', async (req, res) => {
    try {
        const result = await verifyEmail(req.params.token);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/request-reset', async (req, res) => {
    try {
        const { email } = req.body;
        const result = await requestPasswordReset(email);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const result = await resetPassword(token, newPassword);
        res.json({ ok: true, ...result });
    } catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});

router.post('/update-profile', authenticate, async (req, res) => {
    try {
        const { updateProfileSchema } = require('../validators/authValidators');
        const { updateProfile } = require('../services/authService');

        console.log('[PROFILE_UPDATE] Request:', req.body);
        const parsed = updateProfileSchema.parse(req.body);
        const result = await updateProfile(req.user.id, parsed);
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[PROFILE_UPDATE] Error:', err);
        if (err.name === 'ZodError') {
            const errors = {};
            for (const e of err.errors) {
                errors[e.path[0]] = e.message;
            }
            res.status(400).json({ ok: false, errors });
            return;
        }
        res.status(400).json({ ok: false, error: err.message });
    }
});

module.exports = router;
