"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestReset } from '../../lib/services/auth'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [msg, setMsg] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMsg('')
        try {
            const res = await requestReset(email)
            setMsg(res.message || 'If the email exists, a reset token was sent.')
            setTimeout(() => router.push('/login'), 3000)
        } catch (err: any) {
            setMsg(err.response?.data?.error || err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
            <div className="max-w-md w-full bg-white shadow rounded p-6">
                <h1 className="text-xl font-semibold mb-4">Forgot Password</h1>
                <p className="text-sm text-gray-600 mb-4">Enter your email to receive a password reset link.</p>
                <form onSubmit={submit} className="space-y-4">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        placeholder="you@example.com"
                    />
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Sending...' : 'Send reset email'}</button>
                </form>
                {msg && <p className="mt-4 text-sm">{msg}</p>}
            </div>
        </main>
    )
}
