"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import StatCard from '@/components/StatCard'
import { me } from '@/lib/services/auth'

// Hardcoded data for UI development
const mockData = {
    directReferrals: {
        left: { total: 25, active: 18, totalBV: 12500, paidBV: 10000, carryBV: 2500 },
        right: { total: 22, active: 16, totalBV: 11000, paidBV: 9000, carryBV: 2000 }
    },
    totalTeam: {
        left: { total: 125, active: 89, totalBV: 45000, paidBV: 35000, carryBV: 10000 },
        right: { total: 98, active: 72, totalBV: 38500, paidBV: 28000, carryBV: 10500 }
    }
}

export default function TeamOverview() {
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
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">Team Overview</h1>
                <p className="text-gray-500 mt-1">Detailed statistics for your direct referrals and total team</p>
            </div>

            {/* Direct Referrals Section */}
            <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-medium text-gray-900">Direct Referrals</h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Leg */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <h3 className="text-lg font-medium text-indigo-900">Left Leg</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total Count</p>
                                <p className="text-2xl font-light text-gray-900">{mockData.directReferrals.left.total}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-light text-emerald-600">{mockData.directReferrals.left.active}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{mockData.directReferrals.left.totalBV.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Paid BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{mockData.directReferrals.left.paidBV.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 col-span-2">
                                <p className="text-sm text-gray-500">Carry Forward BV</p>
                                <p className="text-2xl font-light text-amber-600">₹{mockData.directReferrals.left.carryBV.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Leg */}
                    <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-6 border border-pink-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-3 h-3 rounded-full bg-pink-500" />
                            <h3 className="text-lg font-medium text-pink-900">Right Leg</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total Count</p>
                                <p className="text-2xl font-light text-gray-900">{mockData.directReferrals.right.total}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-light text-emerald-600">{mockData.directReferrals.right.active}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{mockData.directReferrals.right.totalBV.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Paid BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{mockData.directReferrals.right.paidBV.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 col-span-2">
                                <p className="text-sm text-gray-500">Carry Forward BV</p>
                                <p className="text-2xl font-light text-amber-600">₹{mockData.directReferrals.right.carryBV.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Total Team Section */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-medium text-gray-900">Total Team</h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Leg */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <h3 className="text-lg font-medium text-indigo-900">Left Leg</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total Count</p>
                                <p className="text-2xl font-light text-gray-900">{mockData.totalTeam.left.total}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-light text-emerald-600">{mockData.totalTeam.left.active}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{mockData.totalTeam.left.totalBV.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Paid BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{mockData.totalTeam.left.paidBV.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 col-span-2">
                                <p className="text-sm text-gray-500">Carry Forward BV</p>
                                <p className="text-2xl font-light text-amber-600">₹{mockData.totalTeam.left.carryBV.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Leg */}
                    <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-6 border border-pink-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-3 h-3 rounded-full bg-pink-500" />
                            <h3 className="text-lg font-medium text-pink-900">Right Leg</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total Count</p>
                                <p className="text-2xl font-light text-gray-900">{mockData.totalTeam.right.total}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-light text-emerald-600">{mockData.totalTeam.right.active}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{mockData.totalTeam.right.totalBV.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Paid BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{mockData.totalTeam.right.paidBV.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 col-span-2">
                                <p className="text-sm text-gray-500">Carry Forward BV</p>
                                <p className="text-2xl font-light text-amber-600">₹{mockData.totalTeam.right.carryBV.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </DashboardLayout>
    )
}
