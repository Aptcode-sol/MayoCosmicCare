"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendForgotPasswordOtp, resetPasswordWithOtp } from '@/lib/services/auth'
import { parseApiError } from '@/lib/api'
import toast from 'react-hot-toast'
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card"

// Minimal Label component inline
function LocalLabel({ children, ...props }: React.PropsWithChildren<React.LabelHTMLAttributes<HTMLLabelElement>>) {
    return <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>{children}</label>
}

// Password strength checker
function getPasswordStrength(password: string) {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { level: 'Weak', color: 'bg-red-500', percentage: 25 }
    if (score <= 3) return { level: 'Fair', color: 'bg-yellow-500', percentage: 50 }
    if (score <= 4) return { level: 'Good', color: 'bg-blue-500', percentage: 75 }
    return { level: 'Strong', color: 'bg-green-500', percentage: 100 }
}

function validatePassword(password: string) {
    const checks = {
        has8Chars: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[^A-Za-z0-9]/.test(password)
    }
    const valid = checks.has8Chars && checks.hasUppercase && checks.hasLowercase && checks.hasNumber && checks.hasSpecial
    return { valid, checks }
}

type Step = 'email' | 'otp' | 'password' | 'success'

export default function ForgotPassword() {
    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [otpTimer, setOtpTimer] = useState(0)
    const router = useRouter()
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

    const passwordValidation = validatePassword(newPassword)
    const passwordStrength = getPasswordStrength(newPassword)

    useEffect(() => {
        if (otpTimer > 0) {
            const timer = setTimeout(() => setOtpTimer(t => t - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [otpTimer])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleSendOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setLoading(true)
        try {
            await sendForgotPasswordOtp(email)
            toast.success('OTP sent to your email')
            setOtpTimer(600) // 10 minutes
            setStep('otp')
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            toast.error(String(message))
        } finally {
            setLoading(false)
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return
        const newOtpDigits = [...otpDigits]
        newOtpDigits[index] = value.slice(-1)
        setOtpDigits(newOtpDigits)
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus()
        }
    }

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        if (pasted.length > 0) {
            const newDigits = [...otpDigits]
            for (let i = 0; i < pasted.length; i++) {
                newDigits[i] = pasted[i]
            }
            setOtpDigits(newDigits)
            const nextIndex = Math.min(pasted.length, 5)
            otpInputRefs.current[nextIndex]?.focus()
        }
    }

    const handleVerifyOtp = () => {
        const otp = otpDigits.join('')
        if (otp.length < 6) {
            toast.error('Please enter the complete verification code')
            return
        }
        setStep('password')
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!passwordValidation.valid) {
            toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        setLoading(true)
        try {
            const otp = otpDigits.join('')
            await resetPasswordWithOtp(email, otp, newPassword)
            toast.success('Password reset successfully!')
            setStep('success')
            setTimeout(() => router.push('/login'), 2000)
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            toast.error(String(message))
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (otpTimer > 0) return
        try {
            await sendForgotPasswordOtp(email)
            setOtpTimer(600)
            setOtpDigits(['', '', '', '', '', ''])
            toast.success('OTP resent to your email')
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            toast.error(String(message))
        }
    }

    // Step 2: OTP Verification
    if (step === 'otp') {
        return (
            <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-gray-50/50 pt-32">
                <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white">
                    <CardHeader className="text-center pb-6 pt-8">
                        <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
                            Enter verification code
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            We&apos;ve sent a code to {email}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* OTP Input Boxes */}
                        <div className="flex justify-center gap-3">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <input
                                    key={index}
                                    ref={el => { otpInputRefs.current[index] = el }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={otpDigits[index]}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={index === 0 ? handleOtpPaste : undefined}
                                    className="w-14 h-14 text-center text-2xl font-semibold bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <p className="text-center text-gray-500">
                            Code expires in <span className="text-gray-900 font-medium">{formatTime(otpTimer)}</span>
                        </p>

                        {/* Verify Button */}
                        <Button
                            onClick={handleVerifyOtp}
                            disabled={otpDigits.join('').length < 6}
                            className="w-full"
                        >
                            Continue
                        </Button>

                        {/* Resend Link */}
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={otpTimer > 0}
                            className={`w-full text-center text-sm ${otpTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 hover:underline'} transition-colors`}
                        >
                            Resend verification code
                        </button>

                        {/* Back Link */}
                        <button
                            type="button"
                            onClick={() => { setStep('email'); setOtpDigits(['', '', '', '', '', '']) }}
                            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            ← Change email address
                        </button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Step 3: Set New Password
    if (step === 'password') {
        return (
            <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-gray-50/50 pt-32">
                <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white">
                    <CardHeader className="text-center pb-6 pt-8">
                        <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </div>
                        <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
                            Set new password
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Create a strong new password for your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            {/* New Password */}
                            <div className="space-y-2">
                                <LocalLabel htmlFor="newPassword">New Password</LocalLabel>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {newPassword && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">Password Strength</span>
                                            <span className={`font-medium ${passwordStrength.level === 'Strong' ? 'text-green-600' : passwordStrength.level === 'Good' ? 'text-blue-600' : passwordStrength.level === 'Fair' ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {passwordStrength.level}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength.percentage / 25 ? passwordStrength.color : 'bg-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-xs">
                                                <svg className={`w-4 h-4 ${passwordValidation.checks.has8Chars ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                <span className={passwordValidation.checks.has8Chars ? 'text-gray-700' : 'text-gray-400'}>At least 8 characters</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <svg className={`w-4 h-4 ${passwordValidation.checks.hasUppercase ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                <span className={passwordValidation.checks.hasUppercase ? 'text-gray-700' : 'text-gray-400'}>One uppercase letter</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <svg className={`w-4 h-4 ${passwordValidation.checks.hasLowercase ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                <span className={passwordValidation.checks.hasLowercase ? 'text-gray-700' : 'text-gray-400'}>One lowercase letter</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <svg className={`w-4 h-4 ${passwordValidation.checks.hasNumber ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                <span className={passwordValidation.checks.hasNumber ? 'text-gray-700' : 'text-gray-400'}>One number</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <svg className={`w-4 h-4 ${passwordValidation.checks.hasSpecial ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                <span className={passwordValidation.checks.hasSpecial ? 'text-gray-700' : 'text-gray-400'}>One special character</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <LocalLabel htmlFor="confirmPassword">Confirm Password</LocalLabel>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-xs text-red-500">Passwords do not match</p>
                                )}
                                {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        <span className="text-green-600">Passwords match</span>
                                    </div>
                                )}
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Step 4: Success
    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-gray-50/50 pt-32">
                <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white">
                    <CardHeader className="text-center pb-6 pt-8">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
                            Password Reset!
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Your password has been reset successfully. Redirecting to login...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Step 1: Email Input
    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-gray-50/50 pt-32">
            <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white">
                <CardHeader className="text-center pb-6 pt-8">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
                        Forgot Password
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                        Enter your email to receive a verification code
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-2">
                            <LocalLabel htmlFor="email">Email Address</LocalLabel>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Sending...' : 'Send OTP'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center pb-8">
                    <p className="text-sm text-gray-500">
                        Remember your password?{' '}
                        <Link href="/login" className="font-medium text-gray-900 hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
