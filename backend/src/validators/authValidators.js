const { z } = require('zod');

const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    sponsorId: z.string().optional(),
    leg: z.enum(['left', 'right']).optional(),  // For leg-specific tail placement
    otp: z.string().optional() // OTP for email verification
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

module.exports = { registerSchema, loginSchema };
