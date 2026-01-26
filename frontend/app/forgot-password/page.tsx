"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendForgotPasswordOtp, resetPasswordWithOtp } from '@/lib/services/auth'
import { parseApiError } from '@/lib/api'
import toast from 'react-hot-toast'

type Step = 'email' | 'otp' | 'password' | 'success'

export default function ForgotPassword() {
    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await sendForgotPasswordOtp(email)
            toast.success('OTP sent to your email')
            setStep('otp')
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            toast.error(String(message))
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyAndReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        setLoading(true)
        try {
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

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-md w-full">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {['email', 'otp', 'password'].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                ${step === s || (step === 'success' && s === 'password')
                                    ? 'bg-indigo-600 text-white'
                                    : ['email', 'otp', 'password'].indexOf(step) > i || step === 'success'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                }`}>
                                {['email', 'otp', 'password'].indexOf(step) > i || step === 'success' ? '✓' : i + 1}
                            </div>
                            {i < 2 && <div className={`w-8 h-0.5 mx-1 ${['email', 'otp', 'password'].indexOf(step) > i || step === 'success' ? 'bg-green-500' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {step === 'email' && 'Forgot Password'}
                            {step === 'otp' && 'Verify OTP'}
                            {step === 'password' && 'Set New Password'}
                            {step === 'success' && 'Password Reset!'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-2">
                            {step === 'email' && 'Enter your email to receive a verification code'}
                            {step === 'otp' && `We sent a code to ${email}`}
                            {step === 'password' && 'Create a strong new password'}
                            {step === 'success' && 'Redirecting to login...'}
                        </p>
                    </div>

                    {/* Step 1: Email */}
                    {step === 'email' && (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP */}
                    {step === 'otp' && (
                        <form onSubmit={(e) => { e.preventDefault(); setStep('password') }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="000000"
                                />
                                <p className="text-xs text-gray-400 mt-2 text-center">Check your inbox for the 6-digit code</p>
                            </div>
                            <button
                                type="submit"
                                disabled={otp.length !== 6}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Continue
                            </button>
                            <button
                                type="button"
                                onClick={() => { setOtp(''); handleSendOtp({ preventDefault: () => { } } as React.FormEvent) }}
                                className="w-full text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                            >
                                Resend OTP
                            </button>
                        </form>
                    )}

                    {/* Step 3: New Password */}
                    {step === 'password' && (
                        <form onSubmit={handleVerifyAndReset} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-gray-600">Your password has been reset successfully.</p>
                        </div>
                    )}

                    {/* Back to Login */}
                    {step !== 'success' && (
                        <div className="mt-6 text-center">
                            <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                ← Back to Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
