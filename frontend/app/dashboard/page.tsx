"use client"
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { me } from '../../lib/services/auth'
import { getWallet } from '../../lib/services/users'

interface User {
    id: string
    username: string
    name?: string
    email: string
    role: string
    leftBV: number
    rightBV: number
    leftCarryBV: number
    rightCarryBV: number
}

interface Transaction {
    id: string
    type: string
    detail?: string
    amount?: number
    createdAt?: string
}

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [wallet, setWallet] = useState<{ balance?: number } | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    const loadDashboard = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) {
                router.push('/login')
                return
            }

            const userRes = await me()
            // Support both shapes: { user: {...} } or direct user object
            const fetchedUser = userRes?.user || userRes || null
            setUser(fetchedUser)

            const userId = fetchedUser?.id
            const walletRes = userId ? await getWallet(userId) : await getWallet(fetchedUser?.user?.id)
            setWallet(walletRes.wallet)
            setTransactions((walletRes.transactions || []).slice(0, 10))

            setLoading(false)
        } catch (err) {
            let status: number | null = null
            let message = 'Failed to load dashboard'
            try {
                const e = err as unknown as { response?: { status?: number; data?: { error?: string } }; message?: string }
                status = e?.response?.status || null
                message = e?.response?.data?.error || e?.message || message
                console.debug('loadDashboard error status:', status, 'message:', message)
                console.debug('loadDashboard error details:', e?.response?.data ?? e)
            } catch (inner) {
                console.debug('loadDashboard unknown error', inner)
            }

            if (status === 401) {
                toast.error('Session expired')
                router.push('/login')
            } else {
                toast.error(message)
            }
        }
    }, [router])

    useEffect(() => {
        // defer initial call to avoid sync setState within effect
        const t = setTimeout(() => loadDashboard(), 0)
        const interval = setInterval(loadDashboard, 30000)
        return () => { clearTimeout(t); clearInterval(interval) }
    }, [loadDashboard])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#8b7355] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    const totalBV = (user?.leftBV || 0) + (user?.leftCarryBV || 0) + (user?.rightBV || 0) + (user?.rightCarryBV || 0)
    const leftTotal = (user?.leftBV || 0) + (user?.leftCarryBV || 0)
    const rightTotal = (user?.rightBV || 0) + (user?.rightCarryBV || 0)

    return (
        <div className="min-h-screen bg-[#fdfcfb]">
            {/* Page Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 lg:px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
                            <p className="text-gray-600">Welcome back, {user?.username || user?.name || user?.email || 'User'}</p>
                        </div>
                        {user?.role === 'ADMIN' && (
                            <a
                                href="/admin/products"
                                className="btn-primary"
                            >
                                Admin Panel
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-6 py-12">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="elegant-card rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#8b7355]/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Wallet</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">₹{wallet?.balance?.toLocaleString() || 0}</div>
                        <p className="text-sm text-gray-600">Available Balance</p>
                    </div>

                    <div className="elegant-card rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total BV</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{totalBV.toLocaleString()}</div>
                        <p className="text-sm text-gray-600">Business Volume</p>
                    </div>

                    <div className="elegant-card rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Left Leg</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{leftTotal.toLocaleString()}</div>
                        <p className="text-sm text-gray-600">Carry: {user?.leftCarryBV || 0}</p>
                    </div>

                    <div className="elegant-card rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Right Leg</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{rightTotal.toLocaleString()}</div>
                        <p className="text-sm text-gray-600">Carry: {user?.rightCarryBV || 0}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <a href="/products" className="elegant-card rounded-xl p-6 group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#8b7355]/10 rounded-lg flex items-center justify-center group-hover:bg-[#8b7355]/20 transition">
                                <svg className="w-6 h-6 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">Browse Products</h3>
                                <p className="text-sm text-gray-600">Purchase and earn BV</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#8b7355] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </a>

                    <a href="/tree" className="elegant-card rounded-xl p-6 group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#8b7355]/10 rounded-lg flex items-center justify-center group-hover:bg-[#8b7355]/20 transition">
                                <svg className="w-6 h-6 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">Network Tree</h3>
                                <p className="text-sm text-gray-600">View binary structure</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#8b7355] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </a>

                    <div className="elegant-card rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">Referral Link</h3>
                                <p className="text-sm text-gray-600 truncate">...{user?.id.slice(-8)}</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/register?sponsor=${user?.id}`)
                                    toast.success('Link copied!')
                                }}
                                className="px-3 py-1 bg-[#8b7355] hover:bg-[#755d45] text-white text-sm rounded-lg transition"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="elegant-card rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Transactions</h2>

                    {transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 bg-[#f5f3f0] rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'MATCHING_BONUS' || tx.type === 'DIRECT_BONUS' ? 'bg-green-100' :
                                            tx.type === 'PURCHASE' ? 'bg-blue-100' : 'bg-gray-100'
                                            }`}>
                                            <svg className={`w-5 h-5 ${tx.type === 'MATCHING_BONUS' || tx.type === 'DIRECT_BONUS' ? 'text-green-600' :
                                                tx.type === 'PURCHASE' ? 'text-blue-600' : 'text-gray-600'
                                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {tx.type.includes('BONUS') ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                )}
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{tx.type.replace(/_/g, ' ')}</div>
                                            <div className="text-sm text-gray-600">{tx.detail || 'Transaction'}</div>
                                        </div>
                                    </div>
                                    <div className={`text-lg font-semibold ${tx.type.includes('BONUS') || tx.type === 'ADMIN_CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type.includes('BONUS') || tx.type === 'ADMIN_CREDIT' ? '+' : '-'}₹{tx.amount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <p className="text-gray-600">No transactions yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
