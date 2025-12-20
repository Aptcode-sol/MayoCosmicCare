"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'

// Hardcoded data for UI development
const mockData = {
    broughtForward: { left: 5000, right: 4500 },
    totalPending: { left: 15000, right: 12000 },
    payoutFor: { left: 10000, right: 10000 },
    carryForward: { left: 5000, right: 2000 },
    history: [
        { date: '2024-12-15', broughtLeft: 3000, broughtRight: 2500, pendingLeft: 12000, pendingRight: 10000, payoutLeft: 8000, payoutRight: 8000, carryLeft: 4000, carryRight: 2000 },
        { date: '2024-12-01', broughtLeft: 2000, broughtRight: 1500, pendingLeft: 10000, pendingRight: 8000, payoutLeft: 7000, payoutRight: 6000, carryLeft: 3000, carryRight: 2500 },
        { date: '2024-11-15', broughtLeft: 1500, broughtRight: 1000, pendingLeft: 8000, pendingRight: 6500, payoutLeft: 6000, payoutRight: 5000, carryLeft: 2000, carryRight: 1500 },
    ]
}

export default function MatchingReport() {
    const router = useRouter()
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) { router.push('/login'); return }
                const res = await me()
                setUser(res?.user || res)
            } catch { router.push('/login') }
            finally { setLoading(false) }
        }
        loadUser()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

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
                                <td className="py-4 text-right font-medium text-indigo-600">₹{mockData.broughtForward.left.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-pink-600">₹{mockData.broughtForward.right.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-gray-900">₹{(mockData.broughtForward.left + mockData.broughtForward.right).toLocaleString()}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-900">Total Pending</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right font-medium text-indigo-600">₹{mockData.totalPending.left.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-pink-600">₹{mockData.totalPending.right.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-gray-900">₹{(mockData.totalPending.left + mockData.totalPending.right).toLocaleString()}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 transition-colors bg-emerald-50/50">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-emerald-900">Payout For</span>
                                    </div>
                                </td>
                                <td className="py-4 text-right font-bold text-indigo-600">₹{mockData.payoutFor.left.toLocaleString()}</td>
                                <td className="py-4 text-right font-bold text-pink-600">₹{mockData.payoutFor.right.toLocaleString()}</td>
                                <td className="py-4 text-right font-bold text-emerald-600">₹{(mockData.payoutFor.left + mockData.payoutFor.right).toLocaleString()}</td>
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
                                <td className="py-4 text-right font-medium text-indigo-600">₹{mockData.carryForward.left.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-pink-600">₹{mockData.carryForward.right.toLocaleString()}</td>
                                <td className="py-4 text-right font-medium text-gray-900">₹{(mockData.carryForward.left + mockData.carryForward.right).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900">Matching History</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Brought L/R</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Pending L/R</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Payout L/R</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Carry L/R</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mockData.history.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{new Date(row.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <span className="text-indigo-600">₹{row.broughtLeft.toLocaleString()}</span>
                                        <span className="text-gray-400 mx-1">/</span>
                                        <span className="text-pink-600">₹{row.broughtRight.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <span className="text-indigo-600">₹{row.pendingLeft.toLocaleString()}</span>
                                        <span className="text-gray-400 mx-1">/</span>
                                        <span className="text-pink-600">₹{row.pendingRight.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right font-medium">
                                        <span className="text-indigo-600">₹{row.payoutLeft.toLocaleString()}</span>
                                        <span className="text-gray-400 mx-1">/</span>
                                        <span className="text-pink-600">₹{row.payoutRight.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <span className="text-indigo-600">₹{row.carryLeft.toLocaleString()}</span>
                                        <span className="text-gray-400 mx-1">/</span>
                                        <span className="text-pink-600">₹{row.carryRight.toLocaleString()}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    )
}
