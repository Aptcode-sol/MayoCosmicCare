"use client"
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { getTeamList } from '@/lib/services/dashboard'
import { Button } from '@/components/ui/Button'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import { SkeletonCard, SkeletonTable } from "@/components/ui/SkeletonCard"
import { formatIndian } from '@/lib/formatIndian'

interface Member {
    id: string
    username: string
    email: string
    createdAt: string
    status: string
    leftBV: number
    rightBV: number
    introducer: string
    team: string
    position?: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

export default function TeamListing() {
    const router = useRouter()
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [teamFilter, setTeamFilter] = useState<'all' | 'LEFT' | 'RIGHT'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState<Pagination | null>(null)

    const loadData = useCallback(async (page = 1) => {
        try {
            setLoading(true)
            const token = localStorage.getItem('accessToken')
            if (!token) { router.push('/login'); return }

            const params: { search?: string; from?: string; to?: string; team?: string; page?: number; limit?: number } = { page, limit: 20 }
            if (search) params.search = search
            if (fromDate && toDate) {
                params.from = fromDate
                params.to = toDate
            }
            if (teamFilter !== 'all') params.team = teamFilter

            const userRes = await me()
            setUser(userRes?.user || userRes)

            try {
                const teamRes = await getTeamList(params)
                setMembers(teamRes?.members || [])
                setPagination(teamRes?.pagination || null)
            } catch {
                setMembers([])
                setPagination(null)
            }
        } catch {
            router.push('/login')
        } finally {
            setLoading(false)
        }
    }, [router, search, fromDate, toDate, teamFilter])

    useEffect(() => {
        loadData(currentPage)
    }, [loadData, currentPage])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleFilterChange = () => {
        setCurrentPage(1)
        loadData(1)
    }

    return (
        <DashboardLayout user={user}>
            {loading ? (
                <div className="container mx-auto px-2 sm:px-3 lg:px-6 py-10 space-y-10">
                    {/* Header Skeleton */}
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                    </div>

                    {/* Filters Skeleton */}
                    <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>

                    {/* Members Table Skeleton */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <SkeletonTable rows={10} />
                    </div>
                </div>
            ) : (
                <>
                    {/* Page Header */}
                    <AnimateOnScroll animation="fade-up">
                        <div className="mb-8">
                            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Team Listing</h1>
                            <p className="text-gray-500 mt-1">View and filter your direct referrals</p>
                        </div>
                    </AnimateOnScroll>

                    {/* Filters */}
                    <AnimateOnScroll animation="fade-up" delay={100}>
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
                            <div className="grid md:grid-cols-4 gap-4">
                                {/* Search */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                                    />
                                </div>

                                {/* From Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                                    />
                                </div>

                                {/* To Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                                    />
                                </div>

                                {/* Team Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                                    <select
                                        value={teamFilter}
                                        onChange={(e) => { setTeamFilter(e.target.value as 'all' | 'LEFT' | 'RIGHT'); handleFilterChange(); }}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                                    >
                                        <option value="all">All Teams</option>
                                        <option value="LEFT">Left Leg</option>
                                        <option value="RIGHT">Right Leg</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </AnimateOnScroll>

                    {/* Members Table */}
                    <AnimateOnScroll animation="fade-up" delay={200}>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                            <div className="min-w-[320px]">
                                {members.length > 0 ? (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Join</th>
                                                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">L-BV</th>
                                                <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">R-BV</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {members.map((member) => (
                                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                                        <div className="flex items-center gap-2 md:gap-3">
                                                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs md:text-sm font-medium text-gray-600 shrink-0">
                                                                {(member.email || 'U').slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="text-xs md:text-sm font-medium text-gray-900 truncate">{member.email || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 truncate">{member.username}</td>
                                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-xs font-medium ${(member.team || member.position || '').toUpperCase() === 'LEFT'
                                                            ? 'bg-indigo-50 text-indigo-700'
                                                            : 'bg-pink-50 text-pink-700'
                                                            }`}>
                                                            <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${(member.team || member.position || '').toUpperCase() === 'LEFT' ? 'bg-indigo-500' : 'bg-pink-500'
                                                                }`} />
                                                            {(member.team || member.position || 'N/A').slice(0, 1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                                                        {String(new Date(member.createdAt).getDate()).padStart(2, '0')}/{String(new Date(member.createdAt).getMonth() + 1).padStart(2, '0')}/{String(new Date(member.createdAt).getFullYear()).slice(-2)}
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 md:py-4">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${member.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : member.status === 'Blocked'
                                                                ? 'bg-red-50 text-red-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {member.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-900 text-right">
                                                        {(member.leftBV || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-900 text-right">
                                                        {(member.rightBV || 0).toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">No team members found</p>
                                        <p className="text-sm text-gray-400 mt-1">Direct referrals will appear here</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                        Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={!pagination.hasPrev}
                                        >
                                            ← Previous
                                        </Button>
                                        <span className="text-sm text-gray-600 px-2">
                                            Page {pagination.page} of {pagination.totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={!pagination.hasNext}
                                        >
                                            Next →
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {pagination && pagination.totalPages <= 1 && members.length > 0 && (
                                <div className="px-6 py-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">Showing {members.length} members</p>
                                </div>
                            )}
                        </div>
                    </AnimateOnScroll>
                </>
            )}
        </DashboardLayout>
    )
}
