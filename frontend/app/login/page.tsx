"use client"
import { useState } from 'react'
import { login } from '../../lib/services/auth'
import { useRouter } from 'next/navigation'

export default function Login() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMsg('');

        try {
            const res = await login(form)
            // Store tokens
            localStorage.setItem('accessToken', res.tokens.accessToken);
            localStorage.setItem('refreshToken', res.tokens.refreshToken);

            setMsg('✓ Login successful! Redirecting...');
            setTimeout(() => router.push('/dashboard'), 1000);
        } catch (err: any) {
            setMsg('✗ ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Login</h1>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {msg && (
                    <div className={`mt-4 p-3 rounded ${msg.startsWith('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {msg}
                    </div>
                )}

                <div className="mt-4 text-sm text-center text-gray-600">
                    <p>Don&apos;t have an account? <a href="/register" className="text-blue-600 hover:underline">Register</a></p>
                    <p className="mt-2"><a href="/forgot-password" className="text-blue-600 hover:underline">Forgot password?</a></p>
                </div>
            </div>
        </main>
    )
}
