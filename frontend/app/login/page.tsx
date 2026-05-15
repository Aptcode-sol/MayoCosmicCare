"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { login as loginApi } from '../../lib/services/auth'
import { parseApiError } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import AuthLeftPanel from '../components/AuthLeftPanel'

export default function Login() {
    const router = useRouter()
    const { login } = useAuth()
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    })
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await loginApi({ email: formData.username, password: formData.password })

            // Use auth context login to properly update global state
            login(response.accessToken, response.refreshToken)

            toast.success('Welcome back!')

            // Check for return URL and redirect there, otherwise go to dashboard
            const returnUrl = typeof window !== 'undefined' ? localStorage.getItem('returnUrl') : null
            if (returnUrl) {
                localStorage.removeItem('returnUrl')
                router.push(returnUrl)
            } else {
                router.push('/dashboard')
            }
        } catch (error: unknown) {
            const { message } = parseApiError(error)
            toast.error(String(message || 'Invalid credentials'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row overflow-x-hidden">
            <header className="md:hidden fixed top-0 right-0 left-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <nav className="px-4 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 min-w-0">
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <Image src="/MCC_Light.png" alt="Mayo Cosmic Care" fill sizes="32px" className="object-contain" />
                        </div>
                        <span className="text-md font-semibold text-gray-900 whitespace-nowrap">Mayo Cosmic Care</span>
                    </Link>
                </nav>
            </header>

            <AuthLeftPanel
                variant="login"
                headline="Experience the Power of Bio Magnetic Wellness"
                description="Premium bio magnetic mattress technology designed for better health, deeper sleep, and lasting vitality."
                features={[
                    { icon: 'medical_services', text: 'Precision-engineered for holistic healing support.' },
                    { icon: 'bedtime', text: 'Deeper sleep cycles and body restoration overnight.' },
                ]}
            />

            {/* Right Panel: Login Form (50/50 Split) */}
            <main className="w-full md:w-1/2 bg-surface-container-lowest flex items-center justify-center px-6 pt-24 pb-4 sm:p-gutter sm:pt-24 md:p-container-margin md:pt-container-margin">
                <div className="w-full max-w-[440px] flex flex-col space-y-6 md:space-y-section-gap animate-fade-in">

                    <div className="space-y-stack-sm">
                        <h2 className="font-headline-lg text-3xl sm:text-headline-lg md:text-display-xl text-primary leading-tight">Welcome back</h2>
                        <p className="font-body-md text-body-md text-secondary">Enter your credentials to access your account</p>
                    </div>

                    {/* Form Container */}
                    <form onSubmit={handleSubmit} className="flex flex-col space-y-stack-md">
                        {/* Username Field */}
                        <div className="flex flex-col space-y-base">
                            <label className="font-label-sm text-label-sm text-primary" htmlFor="username">Username or Email</label>
                            <input
                                className="w-full px-stack-md py-3 border border-outline-variant rounded bg-surface focus:ring-0 focus:border-primary focus:outline-none text-on-surface text-base md:text-body-md placeholder:text-secondary-fixed-dim transition-all"
                                id="username"
                                placeholder="Enter your username or email"
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col space-y-base">
                            <div className="flex justify-between items-center">
                                <label className="font-label-sm text-label-sm text-primary" htmlFor="password">Password</label>
                                <Link className="font-label-sm text-label-sm text-secondary-fixed-dim hover:text-primary transition-colors" href="/forgot-password">Forgot Password?</Link>
                            </div>
                            <div className="relative">
                                <input
                                    className="w-full px-stack-md py-3 border border-outline-variant rounded bg-surface focus:ring-0 focus:border-primary focus:outline-none text-on-surface text-base md:text-body-md placeholder:text-secondary-fixed-dim transition-all"
                                    id="password"
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    className="absolute right-stack-md top-1/2 -translate-y-1/2 text-secondary-fixed-dim hover:text-primary transition-colors"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            className="w-full mt-stack-md min-h-12 py-stack-md bg-primary text-on-primary font-button-text text-button-text rounded hover:bg-on-tertiary-container transition-all active:opacity-80 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    {/* Bottom Navigation */}
                    <div className="text-center pt-stack-md border-t border-outline-variant">
                        <p className="font-label-sm text-label-sm text-secondary">
                            Don&apos;t have an account?{' '}
                            <Link className="font-bold text-primary hover:underline transition-all" href="/register">Sign up</Link>
                        </p>
                    </div>

                    {/* Mobile Support Links */}
                    <div className="flex justify-center gap-stack-md md:hidden pt-stack-md">
                        <Link className="font-label-sm text-label-sm text-secondary-fixed-dim" href="/support">Support</Link>
                        <Link className="font-label-sm text-label-sm text-secondary-fixed-dim" href="/privacy">Privacy</Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
