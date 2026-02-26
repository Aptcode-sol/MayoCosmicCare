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
import { SkeletonCard } from "@/components/ui/SkeletonCard"
import { formatIndian } from '@/lib/formatIndian'

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

    const leftMembers = user?.leftMemberCount || 0
    const rightMembers = user?.rightMemberCount || 0
    const totalMembers = leftMembers + rightMembers

    return (
        <DashboardLayout user={user}>
            {loading ? (
                <div className="container mx-auto px-2 sm:px-3 lg:px-6 py-10 space-y-10">
                    {/* Header Skeleton */}
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                    </div>

                    {/* Rank Progress Skeleton */}
                    <div className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonCard key={i} className="h-32 bg-white p-6 rounded-xl border border-gray-100" />
                        ))}
                    </div>

                    {/* Quick Actions Skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonCard key={i} className="h-40 bg-white p-6 rounded-xl border border-gray-100" />
                        ))}
                    </div>

                    {/* Recent Transactions Skeleton */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <SkeletonCard key={i} className="h-16" />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Page Header */}
                    <div className="bg-white border-b border-gray-100">
                        <div className="px-2 sm:px-3 lg:px-6 py-8">
                            <AnimateOnScroll animation="fade-up">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
                                        <p className="text-sm md:text-base text-gray-500 mt-1">Welcome back, {user?.name || user?.username || 'Partner'}</p>
                                    </div>
                                </div>
                            </AnimateOnScroll>
                        </div>
                    </div>

                    <div className="mx-auto px-2 sm:px-3 lg:px-6 py-10">
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
                                    <CardContent className="p-4 md:p-6 flex flex-col justify-center h-full">
                                        <div className="flex items-center justify-between mb-2 md:mb-3">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Balance</span>
                                            <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-lg md:text-2xl font-bold text-gray-900">{formatIndian(wallet?.balance || 0)}</div>
                                    </CardContent>
                                </Card>
                            </AnimateOnScroll>

                            <AnimateOnScroll animation="fade-up" delay={150} className="h-full">
                                <Card className="h-full">
                                    <CardContent className="p-4 md:p-6 flex flex-col justify-center h-full">
                                        <div className="flex items-center justify-between mb-2 md:mb-3">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Team</span>
                                            <div className="w-7 h-7 md:w-8 md:h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-lg md:text-2xl font-bold text-gray-900">{totalMembers}</div>
                                    </CardContent>
                                </Card>
                            </AnimateOnScroll>

                            <AnimateOnScroll animation="fade-up" delay={200} className="h-full">
                                <Card className="h-full">
                                    <CardContent className="p-4 md:p-6 flex flex-col justify-center h-full">
                                        <div className="flex items-center justify-between mb-2 md:mb-3">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Left Leg</span>
                                            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-lg md:text-2xl font-bold text-gray-900">{leftMembers}</div>
                                    </CardContent>
                                </Card>
                            </AnimateOnScroll>

                            <AnimateOnScroll animation="fade-up" delay={250} className="h-full">
                                <Card className="h-full">
                                    <CardContent className="p-4 md:p-6 flex flex-col justify-center h-full">
                                        <div className="flex items-center justify-between mb-2 md:mb-3">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Right Leg</span>
                                            <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-50 rounded-full flex items-center justify-center">
                                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-lg md:text-2xl font-bold text-gray-900">{rightMembers}</div>
                                    </CardContent>
                                </Card>
                            </AnimateOnScroll>
                        </div>

                        {/* Quick Actions */}
                        <AnimateOnScroll animation="fade-up">
                            {(user?.role === 'ADMIN' || user?.hasPurchased) ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                    <Card className="hover:border-gray-300 transition-colors cursor-pointer group" onClick={() => router.push('/products')}>
                                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
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
                                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
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

                                    <Card className="hover:border-gray-300 transition-colors cursor-pointer group" onClick={() => {
                                        const randomEven = [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
                                        navigator.clipboard.writeText(`${window.location.origin}/register?sponsor=${user?.id}${randomEven}`)
                                        toast.success('Left Link Copied!')
                                    }}>
                                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                <span className="text-blue-600 font-bold text-xl">L</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Left Link</h3>
                                                <p className="text-sm text-gray-500">Click to copy</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="hover:border-gray-300 transition-colors cursor-pointer group" onClick={() => {
                                        const randomOdd = [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)];
                                        navigator.clipboard.writeText(`${window.location.origin}/register?sponsor=${user?.id}${randomOdd}`)
                                        toast.success('Right Link Copied!')
                                    }}>
                                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                                <span className="text-purple-600 font-bold text-xl">R</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Right Link</h3>
                                                <p className="text-sm text-gray-500">Click to copy</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                    <Card className="hover:border-gray-300 transition-colors cursor-pointer group" onClick={() => router.push('/products')}>
                                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
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
                                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
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

                                    <Card>
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
                                </div>
                            )}
                        </AnimateOnScroll>

                        {/* Recent Transactions */}
                        <AnimateOnScroll animation="fade-up">
                            <Card>
                                <CardHeader className="border-b border-gray-100">
                                    <CardTitle className="text-base md:text-lg">Recent Transactions</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {transactions.length > 0 ? (
                                        <div className="divide-y divide-gray-100 overflow-x-auto">
                                            {transactions.map((tx) => (
                                                <div key={tx.id} className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50/50 transition-colors min-w-[320px]">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type.includes('BONUS') ? 'bg-green-50 text-green-600' :
                                                            tx.type === 'PURCHASE' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                {tx.type.includes('BONUS') ? (
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                ) : (
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                                )}
                                                            </svg>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-gray-900 text-sm md:text-base truncate">{tx.type.replace(/_/g, ' ')}</div>
                                                            <div className="text-[11px] md:text-xs text-gray-500 break-words max-w-[150px] md:max-w-none md:truncate">{(tx.detail || 'Transaction').replace(/\(1:1\)|\(25%.*?\)/g, '').trim() || 'Transaction'}</div>
                                                        </div>
                                                    </div>
                                                    <div className={`font-semibold text-sm md:text-base shrink-0 ${tx.type.includes('BONUS') || tx.type === 'ADMIN_CREDIT' ? 'text-green-600' : tx.type === 'PURCHASE' ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {tx.type.includes('BONUS') || tx.type === 'ADMIN_CREDIT' ? '+' : tx.type === 'PURCHASE' ? '-' : ''}₹{Math.abs(tx.amount ?? 0)}
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
