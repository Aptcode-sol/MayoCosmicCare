"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { getTeamStats, TeamStats } from '@/lib/services/dashboard'

export default function TeamOverview() {
    const router = useRouter()
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [stats, setStats] = useState<TeamStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) { router.push('/login'); return }

                const [userRes, statsRes] = await Promise.all([
                    me(),
                    getTeamStats()
                ])
                setUser(userRes?.user || userRes)
                setStats(statsRes)
            } catch (e) {
                console.error(e)
                // If 401, redirect usually handled by intercepter, but good to have
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

    return (
        <DashboardLayout user={user}>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">Team Overview</h1>
                <p className="text-gray-500 mt-1">Detailed statistics for your direct referrals and total team</p>
            </div>

            {/* Direct Referrals Section - Simplified as backend calculates total only currently */}
            <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div className="flex items-basline gap-4">
                        <h2 className="text-xl font-medium text-gray-900">Direct Referrals</h2>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                            Total: {stats?.directTeam.total || 0}
                        </span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Leg (Directs) */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <h3 className="text-lg font-medium text-indigo-900">Left Leg Directs</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total Count</p>
                                <p className="text-2xl font-light text-gray-900">{stats?.directTeam.left || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-light text-emerald-600">{stats?.directTeam.activeLeft || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Leg (Directs) */}
                    <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-6 border border-pink-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-3 h-3 rounded-full bg-pink-500" />
                            <h3 className="text-lg font-medium text-pink-900">Right Leg Directs</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total Count</p>
                                <p className="text-2xl font-light text-gray-900">{stats?.directTeam.right || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-light text-emerald-600">{stats?.directTeam.activeRight || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Total Team Section - Real Data */}
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
                                <p className="text-2xl font-light text-gray-900">{stats?.totalTeam.leftMembers || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-light text-emerald-600">{stats?.totalTeam.activeLeft || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{(stats?.totalTeam.leftBV || 0).toLocaleString()}</p>
                            </div>
                            {/* Paid BV from matching payouts */}
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Paid BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{(stats?.totalTeam.leftPaidBV || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 col-span-2">
                                <p className="text-sm text-gray-500">Carry Forward BV</p>
                                <p className="text-2xl font-light text-amber-600">₹{(stats?.carryForward.left || 0).toLocaleString()}</p>
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
                                <p className="text-2xl font-light text-gray-900">{stats?.totalTeam.rightMembers || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-light text-emerald-600">{stats?.totalTeam.activeRight || 0}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Total BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{(stats?.totalTeam.rightBV || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4">
                                <p className="text-sm text-gray-500">Paid BV</p>
                                <p className="text-2xl font-light text-gray-900">₹{(stats?.totalTeam.rightPaidBV || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 col-span-2">
                                <p className="text-sm text-gray-500">Carry Forward BV</p>
                                <p className="text-2xl font-light text-amber-600">₹{(stats?.carryForward.right || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </DashboardLayout>
    )
}
