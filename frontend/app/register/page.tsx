"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register, sendOtp, verifyOtp } from '../../lib/services/auth'
import { parseApiError } from '../../lib/api'
import toast from 'react-hot-toast'
import useDebounce from '@/lib/useDebounce'
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

// Validation helpers
function validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
}

function validatePassword(password: string): { valid: boolean; checks: { has8Chars: boolean; hasUppercase: boolean; hasLowercase: boolean; hasNumber: boolean; hasSpecial: boolean } } {
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

export default function Register() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1) // Step 1: Form, Step 2: OTP
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', sponsorId: '', phone: '', otp: '' })
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
    const [otpTimer, setOtpTimer] = useState(0)
    const [isOtpVerified, setIsOtpVerified] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [leg, setLeg] = useState<'left' | 'right' | null>(null)
    const [loading, setLoading] = useState(false)
    const [sponsorQuery, setSponsorQuery] = useState('')
    const [sponsorSuggestions, setSponsorSuggestions] = useState<Array<{ id: string, username: string, email: string }>>([])
    const [selectedSponsor, setSelectedSponsor] = useState<{ id: string, username: string, email: string } | null>(null)
    const debouncedSponsor = useDebounce(sponsorQuery, 300)

    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Password validation state
    const passwordValidation = validatePassword(form.password)
    const passwordStrength = getPasswordStrength(form.password)

    useEffect(() => {
        if (otpTimer > 0) {
            const timer = setTimeout(() => setOtpTimer(t => t - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [otpTimer])

    useEffect(() => {
        const tryPrefill = async () => {
            if (typeof window === 'undefined') return
            const sp = new URLSearchParams(window.location.search)
            const candidates = [
                sp.get('sponsor'),
                sp.get('sponsorId'),
                sp.get('ref'),
                sp.get('referrer')
            ].filter(Boolean)
            const legParam = sp.get('leg')
            if (legParam === 'left' || legParam === 'right') {
                setLeg(legParam)
            }
            if (candidates.length === 0) return
            const val = String(candidates[0])
            setSponsorQuery(val)
            setForm(f => ({ ...f, sponsorId: val }))
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/users/search?q=${encodeURIComponent(val)}`)
                if (!res.ok) return
                const data = await res.json()
                const users: Array<{ id: string; username: string; email: string }> = (data.users || [])
                if (users.length === 1) {
                    const s = users[0]
                    setSelectedSponsor(s)
                    setForm(f => ({ ...f, sponsorId: val }))
                } else if (users.length > 1) {
                    const exact = users.find(u =>
                        u.id === val ||
                        u.email === val ||
                        u.username === val ||
                        (val.match(/\d$/) && u.username === val.slice(0, -1)) ||
                        (val.match(/\d$/) && u.id === val.slice(0, -1))
                    )
                    if (exact) {
                        setSelectedSponsor(exact)
                        setForm(f => ({ ...f, sponsorId: val }))
                    }
                }
            } catch (err) {
                console.debug('Register prefill search error', err)
            }
        }
        tryPrefill()
    }, [])

    useEffect(() => {
        let mounted = true
        const run = async () => {
            if (!debouncedSponsor || debouncedSponsor.trim().length === 0) { setSponsorSuggestions([]); return }
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/users/search?q=${encodeURIComponent(debouncedSponsor)}`)
                if (!res.ok) return
                const data = await res.json()
                if (!mounted) return
                const users: Array<{ id: string; username: string; email: string }> = (data.users || [])
                setSponsorSuggestions(users)
            } catch (err) {
                console.error('Sponsor search error', err)
            }
        }
        run()
        return () => { mounted = false }
    }, [debouncedSponsor])

    const validateStep1 = (): boolean => {
        if (form.name.length < 8) {
            toast.error('Name must be at least 8 characters')
            return false
        }
        if (!validateEmail(form.email)) {
            toast.error('Please enter a valid email address')
            return false
        }
        if (!passwordValidation.valid) {
            toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
            return false
        }
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match')
            return false
        }
        return true
    }

    const handleProceedToOtp = async () => {
        if (!validateStep1()) return

        setLoading(true)
        try {
            await sendOtp(form.email)
            setOtpTimer(600) // 10 minutes (600 seconds)
            setStep(2)
            toast.success('OTP sent to your email')
        } catch (error: unknown) {
            const { message } = parseApiError(error)
            toast.error(message || 'Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return // Only allow digits

        const newOtpDigits = [...otpDigits]
        newOtpDigits[index] = value.slice(-1) // Only keep last digit
        setOtpDigits(newOtpDigits)

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus()
        }

        // Update form otp
        setForm(f => ({ ...f, otp: newOtpDigits.join('') }))
    }

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus()
        }
    }

    const handleVerifyAndRegister = async () => {
        const otp = otpDigits.join('')
        if (otp.length < 4) {
            toast.error('Please enter the complete verification code')
            return
        }

        setLoading(true)
        try {
            // Verify OTP first
            await verifyOtp(form.email, otp)
            setIsOtpVerified(true)

            // Then register
            const payload = {
                ...form,
                otp,
                sponsorId: form.sponsorId || selectedSponsor?.id,
                leg: leg || undefined
            }
            await register(payload)

            toast.success('Registration successful! Please login.')
            router.push('/login')
        } catch (error: unknown) {
            const { message } = parseApiError(error)
            toast.error(String(message || 'Verification failed'))
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (otpTimer > 0) return
        try {
            await sendOtp(form.email)
            setOtpTimer(600)
            setOtpDigits(['', '', '', '', '', ''])
            toast.success('OTP resent to your email')
        } catch (error: unknown) {
            const { message } = parseApiError(error)
            toast.error(message || 'Failed to resend OTP')
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const selectSponsor = (sponsor: { id: string, username: string, email: string }) => {
        setSelectedSponsor(sponsor)
        const q = sponsorQuery.trim();
        const isCode = /^\d$/.test(q.slice(-1));
        let finalId = sponsor.id;

        if (isCode) {
            const stripped = q.slice(0, -1);
            if (stripped === sponsor.username || stripped === sponsor.id || stripped === sponsor.email) {
                finalId = q;
            }
        }

        setForm({ ...form, sponsorId: finalId })
        setSponsorQuery('')
        setSponsorSuggestions([])
    }

    // Step 2: OTP Verification Page
    if (step === 2) {
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
                            We've sent a code to {form.email}
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
                            onClick={handleVerifyAndRegister}
                            disabled={loading || otpDigits.join('').length < 6}
                            className="w-full"
                        >
                            {loading ? 'Verifying...' : 'Verify Email'}
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
                            onClick={() => setStep(1)}
                            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            ← Change email address
                        </button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Step 1: Registration Form
    return (
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-gray-50/50 pt-32">
            <Card className="w-full max-w-lg shadow-xl border-gray-100 bg-white">
                <CardHeader className="text-center pb-6 pt-8">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    </div>
                    <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">Create an account</CardTitle>
                    <CardDescription className="text-gray-500">
                        Join the Mayo Cosmic Care network today
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <LocalLabel htmlFor="name">Full Name <span className="text-xs text-gray-500 font-normal">(As per PAN)</span></LocalLabel>
                        <Input
                            id="name"
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            placeholder="Full Name (min 8 characters)"
                        />
                        {form.name && form.name.length < 8 && (
                            <p className="text-xs text-red-500">Name must be at least 8 characters</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <LocalLabel htmlFor="email">Email</LocalLabel>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                            placeholder="your@email.com"
                        />
                        {form.email && !validateEmail(form.email) && (
                            <p className="text-xs text-red-500">Please enter a valid email address</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <LocalLabel htmlFor="password">Password</LocalLabel>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                        {form.password && (
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
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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
                        {form.confirmPassword && form.password !== form.confirmPassword && (
                            <p className="text-xs text-red-500">Passwords do not match</p>
                        )}
                        {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                <span className="text-green-600">Passwords match</span>
                            </div>
                        )}
                    </div>

                    {/* Sponsor (Optional) */}
                    <div className="space-y-2 relative">
                        <LocalLabel>Sponsor (Optional)</LocalLabel>
                        {selectedSponsor ? (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                    {selectedSponsor.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{selectedSponsor.username}</div>
                                    <div className="text-xs text-gray-500">{selectedSponsor.email}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSponsor(null)
                                        setForm({ ...form, sponsorId: '' })
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <>
                                <Input
                                    type="text"
                                    value={sponsorQuery}
                                    onChange={(e) => {
                                        const v = e.target.value
                                        setSponsorQuery(v)
                                        setForm(f => ({ ...f, sponsorId: v }))
                                    }}
                                    placeholder="Search by username or email..."
                                />
                                {sponsorSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                        {sponsorSuggestions.map((sponsor) => (
                                            <button
                                                key={sponsor.id}
                                                type="button"
                                                onClick={() => selectSponsor(sponsor)}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-50 last:border-b-0 flex items-center gap-2"
                                            >
                                                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600">
                                                    {sponsor.username.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{sponsor.username}</div>
                                                    <div className="text-xs text-gray-500">{sponsor.email}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="button"
                        onClick={handleProceedToOtp}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Sending OTP...' : 'Create Account'}
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center pb-8">
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-gray-900 hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
