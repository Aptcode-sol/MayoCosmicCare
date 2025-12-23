"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { getIncentives } from '@/lib/services/dashboard'

interface Transaction {
    id: string
    type: string
    amount: number
    createdAt: string
    detail?: string
}

interface IncentiveData {
    summary: {
        totalPaid: number
        directBonus: number
        matchingBonus: number
    }
    history: Transaction[]
}

export default function Incentives() {
    const router = useRouter()
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [data, setData] = useState<IncentiveData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) { router.push('/login'); return }

                const [userRes, incentiveRes] = await Promise.all([
                    me(),
                    getIncentives()
                ])
                setUser(userRes?.user || userRes)
                setData(incentiveRes)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const summary = data?.summary || { totalPaid: 0, directBonus: 0, matchingBonus: 0 }
    const history = data?.history || []

    return (
        <DashboardLayout user={user}>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">Incentives</h1>
                <p className="text-gray-500 mt-1">Your payout breakdown and earnings history</p>
            </div>

            {/* Payout Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-emerald-100 uppercase tracking-wider">Total Payout</p>
                    </div>
                    <p className="text-4xl font-light">₹{summary.totalPaid.toLocaleString()}</p>
                    <p className="text-sm text-emerald-200 mt-2">All time earnings</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Direct Bonus</p>
                    </div>
                    <p className="text-4xl font-light text-gray-900">₹{summary.directBonus.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-2">From direct referrals</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Matching Bonus</p>
                    </div>
                    <p className="text-4xl font-light text-gray-900">₹{summary.matchingBonus.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-2">From team matching</p>
                </div>
            </div>

            {/* Transaction History */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-medium text-gray-900">Bonus History</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {history.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${tx.type === 'DIRECT_BONUS'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {tx.type === 'DIRECT_BONUS' ? 'Direct' : 'Matching'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{tx.detail || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-emerald-600 text-right">
                                            +₹{tx.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No bonus transactions yet</p>
                        </div>
                    )}
                </div>
            </section>
        </DashboardLayout>
    )
}
