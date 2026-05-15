"use client"
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { register, sendOtp, verifyOtp } from '../../lib/services/auth'
import { parseApiError } from '../../lib/api'
import toast from 'react-hot-toast'
import useDebounce from '@/lib/useDebounce'
import AuthLeftPanel from '../components/AuthLeftPanel'


// Password strength checker
function getPasswordStrength(password: string) {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { level: 'Weak', color: 'bg-error', percentage: 25 }
    if (score <= 3) return { level: 'Fair', color: 'bg-primary-fixed-dim', percentage: 50 }
    if (score <= 4) return { level: 'Good', color: 'bg-secondary', percentage: 75 }
    return { level: 'Strong', color: 'bg-primary', percentage: 100 }
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
            <div className="min-h-screen flex flex-col md:flex-row bg-surface-container-lowest text-on-surface font-body-md overflow-x-hidden selection:bg-primary-fixed selection:text-primary">
                <LeftPanel />
                <section className="w-full md:w-1/2 flex items-center justify-center p-gutter md:p-container-margin">
                    <div className="w-full max-w-[440px]">
                        {/* Mobile Logo */}
                        <div className="md:hidden mb-stack-md flex items-center gap-3">
                            <div className="relative w-8 h-8 flex-shrink-0">
                                <Image src="/MCC_Light.png" alt="Mayo Cosmic Care" fill sizes="32px" className="object-contain" />
                            </div>
                            <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Mayo Cosmic Care</span>
                        </div>

                        {/* Icon */}
                        <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-primary text-[28px]">mark_email_read</span>
                        </div>

                        <div className="mb-8">
                            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-base tracking-tight">Check your email</h1>
                            <p className="text-on-surface-variant font-body-md">We&apos;ve sent a 6-digit code to <span className="font-medium text-on-surface">{form.email}</span></p>
                        </div>

                        <div className="space-y-6">
                            {/* OTP Input Boxes */}
                            <div className="flex justify-between gap-2">
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
                                        className="w-12 h-14 text-center text-2xl font-display-xl font-bold bg-surface-container-lowest border border-outline-variant rounded focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all"
                                    />
                                ))}
                            </div>

                            {/* Timer */}
                            <p className="text-center text-label-sm font-label-sm text-secondary">
                                Code expires in{' '}
                                <span className="font-bold text-primary">{formatTime(otpTimer)}</span>
                            </p>

                            {/* Verify Button */}
                            <button
                                onClick={handleVerifyAndRegister}
                                disabled={loading || otpDigits.join('').length < 6}
                                className="w-full bg-primary text-on-primary py-4 px-base font-button-text text-button-text hover:bg-on-surface-variant rounded transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </>
                                ) : 'Verify & Create Account'}
                            </button>

                            {/* Resend Link */}
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={otpTimer > 0}
                                className={`w-full text-center text-label-sm font-label-sm transition-colors ${otpTimer > 0
                                    ? 'text-on-surface-variant opacity-60 cursor-not-allowed'
                                    : 'text-primary hover:underline underline-offset-4'
                                    }`}
                            >
                                Didn&apos;t receive it? Resend code
                            </button>

                            {/* Back Link */}
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-center text-label-sm font-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                                Change email address
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        )
    }

    // Step 1: Registration Form
    return (
        <div className="min-h-screen flex flex-col md:flex-row overflow-x-hidden">
            <AuthLeftPanel
                variant="register"
                headline="Join the Bio Magnetic Wellness Revolution"
                description="Discover premium bio magnetic wellness products and build a thriving essential wellness business with our global network."
                features={[
                    { icon: 'bed', text: 'Premium bio magnetic mattress for natural healing' },
                    { icon: 'diamond', text: 'Exclusive wellness products with high reward value' },
                ]}
            />
            <section className="w-full md:w-1/2 flex items-center justify-center p-gutter md:p-container-margin relative pb-16">
                <div className="w-full max-w-[440px] animate-fade-in">
                    {/* Mobile Logo */}
                    <div className="md:hidden mb-stack-md flex items-center gap-3">
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <Image src="/MCC_Light.png" alt="Mayo Cosmic Care" fill sizes="32px" className="object-contain" />
                        </div>
                        <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Mayo Cosmic Care</span>
                    </div>

                    <div className="mb-6">
                        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2 tracking-tight">Create an account</h1>
                        <p className="text-on-surface-variant font-body-md text-sm">Join the Mayo Cosmic Care network today</p>
                    </div>

                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleProceedToOtp(); }}>
                        <div className="space-y-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant flex justify-between" htmlFor="full-name">
                                <span>Full Name <span className="opacity-60">(As per PAN)</span></span>
                            </label>
                            <input
                                id="full-name"
                                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder="Full Name (min 8 characters)"
                            />
                            {form.name && form.name.length < 8 && (
                                <p className="text-xs text-error">Name must be at least 8 characters</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="email">Email</label>
                            <input
                                id="email"
                                className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                placeholder="your@email.com"
                            />
                            {form.email && !validateEmail(form.email) && (
                                <p className="text-xs text-error">Please enter a valid email address</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 pr-12"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                                </button>
                            </div>
                            
                            {/* Password Strength Indicator */}
                            {form.password && (
                                <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-between text-xs font-label-sm">
                                        <span className="text-on-surface-variant">Password Strength</span>
                                        <span className={`font-bold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                                            {passwordStrength.level}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength.percentage / 25 ? passwordStrength.color : 'bg-surface-variant'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        <div className="flex items-center gap-2 text-xs font-label-sm">
                                            <span className={`material-symbols-outlined text-[14px] ${passwordValidation.checks.has8Chars ? 'text-primary' : 'text-outline-variant'}`}>check</span>
                                            <span className={passwordValidation.checks.has8Chars ? 'text-on-surface' : 'text-on-surface-variant'}>At least 8 characters</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-label-sm">
                                            <span className={`material-symbols-outlined text-[14px] ${passwordValidation.checks.hasUppercase ? 'text-primary' : 'text-outline-variant'}`}>check</span>
                                            <span className={passwordValidation.checks.hasUppercase ? 'text-on-surface' : 'text-on-surface-variant'}>One uppercase letter</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-label-sm">
                                            <span className={`material-symbols-outlined text-[14px] ${passwordValidation.checks.hasLowercase ? 'text-primary' : 'text-outline-variant'}`}>check</span>
                                            <span className={passwordValidation.checks.hasLowercase ? 'text-on-surface' : 'text-on-surface-variant'}>One lowercase letter</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-label-sm">
                                            <span className={`material-symbols-outlined text-[14px] ${passwordValidation.checks.hasNumber ? 'text-primary' : 'text-outline-variant'}`}>check</span>
                                            <span className={passwordValidation.checks.hasNumber ? 'text-on-surface' : 'text-on-surface-variant'}>One number</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-label-sm">
                                            <span className={`material-symbols-outlined text-[14px] ${passwordValidation.checks.hasSpecial ? 'text-primary' : 'text-outline-variant'}`}>check</span>
                                            <span className={passwordValidation.checks.hasSpecial ? 'text-on-surface' : 'text-on-surface-variant'}>One special character</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="confirm-password">Confirm Password</label>
                            <div className="relative">
                                <input
                                    id="confirm-password"
                                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 pr-12"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                                </button>
                            </div>
                            {form.confirmPassword && form.password !== form.confirmPassword && (
                                <p className="text-xs text-error mt-1">Passwords do not match</p>
                            )}
                            {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
                                <div className="flex items-center gap-2 text-xs font-label-sm mt-1">
                                    <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>
                                    <span className="text-primary">Passwords match</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1 relative">
                            <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="sponsor">Sponsor (Optional)</label>
                            {selectedSponsor ? (
                                <div className="flex items-center gap-3 p-2 bg-surface-container-low border border-outline-variant rounded">
                                    <div className="h-8 w-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-medium text-on-surface">
                                        {selectedSponsor.username.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-on-surface">{selectedSponsor.username}</div>
                                        <div className="text-xs text-secondary">{selectedSponsor.email}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedSponsor(null)
                                            setForm({ ...form, sponsorId: '' })
                                        }}
                                        className="text-on-surface-variant hover:text-primary p-1 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        id="sponsor"
                                        className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
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
                                        <div className="absolute z-10 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded shadow-lg max-h-48 overflow-y-auto">
                                            {sponsorSuggestions.map((sponsor) => (
                                                <button
                                                    key={sponsor.id}
                                                    type="button"
                                                    onClick={() => selectSponsor(sponsor)}
                                                    className="w-full px-4 py-3 text-left hover:bg-surface-container-low text-sm border-b border-outline-variant last:border-b-0 flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-medium text-on-surface">
                                                        {sponsor.username.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-on-surface">{sponsor.username}</div>
                                                        <div className="text-xs text-secondary">{sponsor.email}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-on-primary py-3 px-base rounded font-button-text text-button-text hover:bg-on-surface-variant transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending OTP...
                                    </>
                                ) : 'Continue'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                            Already have an account?{' '}
                            <Link className="text-primary font-bold hover:underline" href="/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
