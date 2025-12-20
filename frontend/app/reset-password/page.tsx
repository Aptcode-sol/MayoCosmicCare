"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '../../lib/services/auth'
import { parseApiError } from '../../lib/api'

export default function ResetPassword() {
    const router = useRouter()
    const [token, setToken] = useState('')
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search)
            setToken(params.get('token') || '')
        } catch (e) { }
    }, [])
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [msg, setMsg] = useState('')
    const [loading, setLoading] = useState(false)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirm) {
            setMsg('Passwords do not match')
            return
        }
        setLoading(true)
        setMsg('')
        try {
            const res = await resetPassword(token, password)
            setMsg(res.message || 'Password reset successful')
            setTimeout(() => router.push('/login'), 2000)
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            setMsg(String(message))
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
            <div className="max-w-md w-full bg-white shadow rounded p-6">
                <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
                <form onSubmit={submit} className="space-y-4">
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className="w-full border px-3 py-2 rounded" />
                    <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full border px-3 py-2 rounded" />
                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</button>
                </form>
                {msg && <p className="mt-4 text-sm">{msg}</p>}
            </div>
        </main>
    )
}
