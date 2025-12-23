"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { getMatchingReport } from '@/lib/services/dashboard'

interface MatchingData {
    current: {
        left: { broughtForward: number; pending: number; carryForward: number }
        right: { broughtForward: number; pending: number; carryForward: number }
    }
    history: Array<{
        id: string
        amount: number
        createdAt: string
        detail?: string
    }>
}

export default function MatchingReport() {
    const router = useRouter()
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [data, setData] = useState<MatchingData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) { router.push('/login'); return }

                const [userRes, matchingRes] = await Promise.all([
                    me(),
                    getMatchingReport()
                ])
                setUser(userRes?.user || userRes)
                setData(matchingRes)
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

    const current = data?.current || {
        left: { broughtForward: 0, pending: 0, carryForward: 0 },
        right: { broughtForward: 0, pending: 0, carryForward: 0 }
    }
    const history = data?.history || []

    return (
        <DashboardLayout user={user}>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">Matching Report</h1>
                <p className="text-gray-500 mt-1">BV breakdown for group matching</p>
            </div>

            {/* Current Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Current Period Summary</h2>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left pb-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                                <th className="text-right pb-4 text-sm font-medium text-indigo-600 uppercase tracking-wider">Left BV</th>
                                <th className="text-right pb-4 text-sm font-medium text-pink-600 uppercase tracking-wider">Right BV</th>
                                <th className="text-right pb-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-900">Brought Forward</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right font-medium text-indigo-600">₹{current.left.broughtForward.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-pink-600">₹{current.right.broughtForward.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-gray-900">₹{(current.left.broughtForward + current.right.broughtForward).toLocaleString()}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-900">Current Pending</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right font-medium text-indigo-600">₹{current.left.pending.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-pink-600">₹{current.right.pending.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-gray-900">₹{(current.left.pending + current.right.pending).toLocaleString()}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-900">Carry Forward</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right font-medium text-indigo-600">₹{current.left.carryForward.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-pink-600">₹{current.right.carryForward.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-gray-900">₹{(current.left.carryForward + current.right.carryForward).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900">Matching Bonus History</h2>
                </div>

                {history.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(row.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{row.detail || 'Matching bonus'}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-emerald-600 text-right">
                                            +₹{row.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No matching bonus history yet</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
