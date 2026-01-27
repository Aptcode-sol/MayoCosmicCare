const { z } = require('zod');

const registerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email(),
    password: z.string().min(6),
    sponsorId: z.string().optional(),
    leg: z.enum(['left', 'right']).optional(),  // For leg-specific tail placement
    otp: z.string().optional() // OTP for email verification
});

const loginSchema = z.object({
    email: z.string(), // Accepts email or username
    password: z.string().min(6)
});

const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(), // Adding phone as it is in the register function
    password: z.string().min(6).optional(), // New password
    currentPassword: z.string().optional() // Required if changing sensitive info
});

module.exports = { registerSchema, loginSchema, updateProfileSchema };
