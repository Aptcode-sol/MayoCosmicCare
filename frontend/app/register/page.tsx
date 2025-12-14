"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '../../lib/services/auth'
import toast from 'react-hot-toast'
import useDebounce from '@/lib/useDebounce'

export default function Register() {
    const router = useRouter()
    // we read query params from window.location.search inside useEffect
    // to avoid next.js prerender/suspense issues with useSearchParams at build time
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', sponsorId: '', phone: '' })
    const [leg, setLeg] = useState<'left' | 'right' | null>(null)  // For leg-specific placement
    const [loading, setLoading] = useState(false)
    const [sponsorQuery, setSponsorQuery] = useState('')
    const [sponsorSuggestions, setSponsorSuggestions] = useState<Array<{ id: string, username: string, email: string }>>([])
    const [selectedSponsor, setSelectedSponsor] = useState<{ id: string, username: string, email: string } | null>(null)
    const debouncedSponsor = useDebounce(sponsorQuery, 300)

    // Try to prefill sponsor from query params: sponsor, sponsorId, ref, referrer
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
            // Read leg parameter for leg-specific placement
            const legParam = sp.get('leg')
            if (legParam === 'left' || legParam === 'right') {
                setLeg(legParam)
            }
            if (candidates.length === 0) return
            const val = String(candidates[0])
            console.debug('Register prefill candidates', candidates, 'using', val, 'leg', legParam)
            // Always set the input so pasted/raw ids show up and are submitted (backend resolves id)
            setSponsorQuery(val)
            setForm(f => ({ ...f, sponsorId: val }))
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/users/search?q=${encodeURIComponent(val)}`)
                if (!res.ok) return
                const data = await res.json()
                console.debug('Register prefill search result', data)
                const users: Array<{ id: string; username: string; email: string }> = (data.users || [])
                if (users.length === 1) {
                    const s = users[0]
                    setSelectedSponsor(s)
                    setForm(f => ({ ...f, sponsorId: s.id }))
                } else if (users.length > 1) {
                    // try to find exact match by id/email/username
                    const exact = users.find(u => u.id === val || u.email === val || u.username === val)
                    if (exact) {
                        setSelectedSponsor(exact)
                        setForm(f => ({ ...f, sponsorId: exact.id }))
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
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/users/search?q=${encodeURIComponent(debouncedSponsor)}`)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (form.password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        setLoading(true)
        try {
            const payload = {
                ...form,
                sponsorId: selectedSponsor?.id || form.sponsorId,
                leg: leg || undefined  // Include leg for leg-specific placement
            }
            console.debug('Register payload', payload)
            await register(payload)
            toast.success('Registration successful! Please login.')
            router.push('/login')
        } catch (error: any) {
            const msg = error.response?.data?.error || error.response?.data?.message || 'Registration failed'
            console.debug('Registration error', error.response?.data || error)
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    const selectSponsor = (sponsor: { id: string, username: string, email: string }) => {
        setSelectedSponsor(sponsor)
        setForm({ ...form, sponsorId: sponsor.id })
        setSponsorQuery('')
        setSponsorSuggestions([])
    }

    return (
        <div className="min-h-screen py-16 px-4">
            <div className="w-full max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Our Network</h1>
                    <p className="text-gray-600">Start your journey to success</p>
                </div>

                <div className="elegant-card rounded-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#f5f3f0] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355] focus:border-transparent transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#f5f3f0] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355] focus:border-transparent transition"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full px-4 py-3 bg-[#f5f3f0] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355] focus:border-transparent transition"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#f5f3f0] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355] focus:border-transparent transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#f5f3f0] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355] focus:border-transparent transition"
                                    required
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sponsor (Optional)
                            </label>

                            {selectedSponsor ? (
                                <div className="flex items-center gap-2 px-4 py-3 bg-[#8b7355]/10 border border-[#8b7355]/30 rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{selectedSponsor.username}</div>
                                        <div className="text-sm text-gray-600">{selectedSponsor.email}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedSponsor(null)
                                            setForm({ ...form, sponsorId: '' })
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={sponsorQuery}
                                        onChange={(e) => {
                                            const v = e.target.value
                                            setSponsorQuery(v)
                                            setForm(f => ({ ...f, sponsorId: v }))
                                        }}
                                        placeholder="Search by username or email..."
                                        className="w-full px-4 py-3 bg-[#f5f3f0] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b7355] focus:border-transparent transition"
                                    />

                                    {sponsorSuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {sponsorSuggestions.map((sponsor) => (
                                                <button
                                                    key={sponsor.id}
                                                    type="button"
                                                    onClick={() => selectSponsor(sponsor)}
                                                    className="w-full px-4 py-3 text-left hover:bg-[#f5f3f0] transition border-b border-gray-100 last:border-b-0"
                                                >
                                                    <div className="font-medium text-gray-900">{sponsor.username}</div>
                                                    <div className="text-sm text-gray-600">{sponsor.email}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {/* If user typed a sponsor but didn't pick a suggestion, show a note */}
                                    {sponsorQuery && !selectedSponsor && (
                                        <div className="mt-2 text-sm text-yellow-700">Using typed sponsor value — ensure this is a valid sponsor id, username, or email. If invalid, registration will fail.</div>
                                    )}
                                </>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-[#8b7355] font-medium hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
