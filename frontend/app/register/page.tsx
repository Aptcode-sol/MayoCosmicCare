"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '../../lib/services/auth'
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

export default function Register() {
    const router = useRouter()
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', sponsorId: '', phone: '' })
    const [leg, setLeg] = useState<'left' | 'right' | null>(null)
    const [loading, setLoading] = useState(false)
    const [sponsorQuery, setSponsorQuery] = useState('')
    const [sponsorSuggestions, setSponsorSuggestions] = useState<Array<{ id: string, username: string, email: string }>>([])
    const [selectedSponsor, setSelectedSponsor] = useState<{ id: string, username: string, email: string } | null>(null)
    const debouncedSponsor = useDebounce(sponsorQuery, 300)

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
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/users/search?q=${encodeURIComponent(val)}`)
                if (!res.ok) return
                const data = await res.json()
                const users: Array<{ id: string; username: string; email: string }> = (data.users || [])
                if (users.length === 1) {
                    const s = users[0]
                    setSelectedSponsor(s)
                    setForm(f => ({ ...f, sponsorId: s.id }))
                } else if (users.length > 1) {
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
                leg: leg || undefined
            }
            await register(payload)
            toast.success('Registration successful! Please login.')
            router.push('/login')
        } catch (error: unknown) {
            const { message } = parseApiError(error)
            toast.error(String(message || 'Registration failed'))
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
        <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-gray-50/50 pt-32">
            <Card className="w-full max-w-2xl shadow-xl border-gray-100 bg-white">
                <CardHeader className="text-center pb-8 pt-8">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    </div>
                    <CardTitle className="text-3xl font-light text-gray-900 tracking-tight mb-2">Create an account</CardTitle>
                    <CardDescription className="text-base text-gray-500">
                        Join the Mayo Cosmic Care network today and start your journey
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <LocalLabel htmlFor="username">Username</LocalLabel>
                                <Input
                                    id="username"
                                    type="text"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <LocalLabel htmlFor="email">Email</LocalLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <LocalLabel htmlFor="phone">Phone</LocalLabel>
                            <Input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <LocalLabel htmlFor="password">Password</LocalLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <LocalLabel htmlFor="confirmPassword">Confirm Password</LocalLabel>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

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

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
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
