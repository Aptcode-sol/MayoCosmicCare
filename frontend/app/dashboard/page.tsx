"use client"
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { me } from '../../lib/services/auth'
import { getWallet } from '../../lib/services/users'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import DashboardLayout from '@/components/DashboardLayout'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import RankProgress from '@/components/RankProgress'

interface User {
    id: string
    username: string
    name?: string
    email: string
    role: string
    hasPurchased?: boolean
    leftBV: number
    rightBV: number
    leftCarryBV: number
    rightCarryBV: number
    leftMemberCount: number
    rightMemberCount: number
    leftCarryCount: number
    rightCarryCount: number
    rank?: string
    totalPairs?: number
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
        const t = setTimeout(() => loadDashboard(), 0)
        const interval = setInterval(loadDashboard, 30000)
        return () => { clearTimeout(t); clearInterval(interval) }
    }, [loadDashboard])

    const leftMembers = (user?.leftMemberCount || 0) + (user?.leftCarryCount || 0)
    const rightMembers = (user?.rightMemberCount || 0) + (user?.rightCarryCount || 0)
    const totalMembers = leftMembers + rightMembers

    return (
        <DashboardLayout user={user}>
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center animate-pulse">
                        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500">Loading dashboard...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Page Header */}
                    <div className="bg-white border-b border-gray-100">
                        <div className="container mx-auto px-6 py-8">
                            <AnimateOnScroll animation="fade-up">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
                                        <p className="text-gray-500 mt-1">Welcome back, {user?.username || user?.name || 'Partner'}</p>
                                    </div>
                                </div>
                            </AnimateOnScroll>
                        </div>
                    </div>

                    <div className="container mx-auto px-6 py-10">
                        {/* Full-width Rank Progress */}
                        <AnimateOnScroll animation="fade-up" className="mb-10">
                            <RankProgress
                                currentRank={user?.rank || 'Associate'}
                                totalPairs={user?.totalPairs || 0}
                            />
                        </AnimateOnScroll>

                        {/* Stats Grid - 4 equal columns */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <AnimateOnScroll animation="fade-up" delay={100} className="h-full">
                                <Card className="h-full">
                                    <CardContent className="p-6 flex flex-col justify-center h-full">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Balance</span>
                                            <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">₹{wallet?.balance?.toLocaleString() || 0}</div>
                                    </CardContent>
                                </Card>
                            </AnimateOnScroll>

                            <AnimateOnScroll animation="fade-up" delay={150} className="h-full">
                                <Card className="h-full">
                                    <CardContent className="p-6 flex flex-col justify-center h-full">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Team</span>
                                            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">{totalMembers}</div>
                                    </CardContent>
                                </Card>
                            </AnimateOnScroll>

                            <AnimateOnScroll animation="fade-up" delay={200} className="h-full">
                                <Card className="h-full">
                                    <CardContent className="p-6 flex flex-col justify-center h-full">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Left Leg</span>
                                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">{leftMembers}</div>
                                        <div className="text-xs text-gray-400 mt-1">Carry: {user?.leftCarryCount || 0}</div>
                                    </CardContent>
                                </Card>
                            </AnimateOnScroll>

                            <AnimateOnScroll animation="fade-up" delay={250} className="h-full">
                                <Card className="h-full">
                                    <CardContent className="p-6 flex flex-col justify-center h-full">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Right Leg</span>
                                            <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">{rightMembers}</div>
                                        <div className="text-xs text-gray-400 mt-1">Carry: {user?.rightCarryCount || 0}</div>
                                    </CardContent>
                                </Card>
                            </AnimateOnScroll>
                        </div>

                        {/* Quick Actions */}
                        <AnimateOnScroll animation="fade-up">
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                <Card className="hover:border-gray-300 transition-colors cursor-pointer group" onClick={() => router.push('/products')}>
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Products</h3>
                                            <p className="text-sm text-gray-500">Browse store</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="hover:border-gray-300 transition-colors cursor-pointer group" onClick={() => router.push('/dashboard/tree')}>
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Network</h3>
                                            <p className="text-sm text-gray-500">View tree</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Referral Links - Only show if user has purchased or is admin */}
                                {(user?.role === 'ADMIN' || user?.hasPurchased) ? (
                                    <>
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-50/50 rounded-lg flex items-center justify-center">
                                                            <span className="text-blue-600 font-bold text-xs">L</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900">Left Link</h3>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/register?sponsor=${user?.id}&leg=left`)
                                                        toast.success('Copied!')
                                                    }}>Copy</Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-purple-50/50 rounded-lg flex items-center justify-center">
                                                            <span className="text-purple-600 font-bold text-xs">R</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900">Right Link</h3>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/register?sponsor=${user?.id}&leg=right`)
                                                        toast.success('Copied!')
                                                    }}>Copy</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                ) : (
                                    <Card className="col-span-2">
                                        <CardContent className="p-6 text-center">
                                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Purchase Required</h3>
                                            <p className="text-sm text-gray-500">Buy a product to unlock your referral links</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </AnimateOnScroll>

                        {/* Recent Transactions */}
                        <AnimateOnScroll animation="fade-up">
                            <Card>
                                <CardHeader className="border-b border-gray-100">
                                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {transactions.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {transactions.map((tx) => (
                                                <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type.includes('BONUS') ? 'bg-green-50 text-green-600' :
                                                            tx.type === 'PURCHASE' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                {tx.type.includes('BONUS') ? (
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                ) : (
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                                )}
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{tx.type.replace(/_/g, ' ')}</div>
                                                            <div className="text-xs text-gray-500">{tx.detail || 'Transaction'}</div>
                                                        </div>
                                                    </div>
                                                    <div className={`font-semibold ${tx.type.includes('BONUS') || tx.type === 'ADMIN_CREDIT' ? 'text-green-600' : 'text-gray-900'}`}>
                                                        {tx.type.includes('BONUS') || tx.type === 'ADMIN_CREDIT' ? '+' : ''}₹{tx.amount}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-sm text-gray-500">No transactions recorded yet</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </AnimateOnScroll>
                    </div>
                </>
            )}
        </DashboardLayout>
    )
}
