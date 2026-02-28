"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { getMatchingReport } from '@/lib/services/dashboard'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import { SkeletonCard, SkeletonTable } from "@/components/ui/SkeletonCard"
import { formatIndian } from '@/lib/formatIndian'

interface MatchingData {
    current: {
        left: { totalBV: number; paidBV: number; unpaidBV: number; carryForward: number; totalMembers: number; totalPurchasedMembers: number; paidMembers: number; unpaidMembers: number; carryMembers: number; carryPurchasedMembers: number }
        right: { totalBV: number; paidBV: number; unpaidBV: number; carryForward: number; totalMembers: number; totalPurchasedMembers: number; paidMembers: number; unpaidMembers: number; carryMembers: number; carryPurchasedMembers: number }
    }
    history: Array<{
        id: string
        amount: number
        createdAt: string
        detail?: string
    }>
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

export default function MatchingReport() {
    const router = useRouter()
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [data, setData] = useState<MatchingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)

    const loadData = async (page = 1) => {
        try {
            setLoading(true)
            const token = localStorage.getItem('accessToken')
            if (!token) { router.push('/login'); return }

            const [userRes, matchingRes] = await Promise.all([
                me(),
                getMatchingReport(page)
            ])
            setUser(userRes?.user || userRes)
            setData(matchingRes)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData(currentPage)
    }, [router, currentPage])

    const handlePageChange = (page: number) => {
        const next = Math.max(1, page)
        setCurrentPage(next)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const getDisplayedPages = (current: number, totalPages: number) => {
        const maxButtons = 7
        if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1)

        const pages: (number | '...')[] = []
        const left = Math.max(2, current - 2)
        const right = Math.min(totalPages - 1, current + 2)

        pages.push(1)
        if (left > 2) pages.push('...')

        for (let p = left; p <= right; p++) pages.push(p)

        if (right < totalPages - 1) pages.push('...')
        pages.push(totalPages)

        return pages
    }

    const current = data?.current || {
        left: { totalBV: 0, paidBV: 0, unpaidBV: 0, carryForward: 0, totalMembers: 0, totalPurchasedMembers: 0, paidMembers: 0, unpaidMembers: 0, carryMembers: 0, carryPurchasedMembers: 0 },
        right: { totalBV: 0, paidBV: 0, unpaidBV: 0, carryForward: 0, totalMembers: 0, totalPurchasedMembers: 0, paidMembers: 0, unpaidMembers: 0, carryMembers: 0, carryPurchasedMembers: 0 }
    }
    const history = data?.history || []

    const formatNumberShort = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm'
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
        return num.toString()
    }

    const formatWithCount = (value: number, count: number) => `${formatNumberShort(value)} (${formatNumberShort(count)})`

    return (
        <DashboardLayout user={user}>
            {loading ? (
                <div className="container mx-auto px-2 sm:px-3 lg:px-6 py-10 space-y-10">
                    {/* Header Skeleton */}
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                    </div>

                    {/* Current Summary Skeleton */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-6"></div>
                        <SkeletonTable rows={4} />
                    </div>

                    {/* History Skeleton */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse mb-6"></div>
                        <SkeletonTable rows={5} />
                    </div>
                </div>
            ) : (
                <>
                    {/* Page Header */}
                    <AnimateOnScroll animation="fade-up">
                        <div className="mb-8">
                            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Matching Report</h1>
                            <p className="text-gray-500 mt-1">BV breakdown for group matching</p>
                        </div>
                    </AnimateOnScroll>

                    {/* Current Summary */}
                    <AnimateOnScroll animation="fade-up" delay={100}>
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
                            <h2 className="text-lg font-medium text-gray-900 mb-6">Current Period Summary</h2>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left pb-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                                            <th className="text-right pb-4 text-xs md:text-sm font-medium text-indigo-600 uppercase tracking-wider">Left BV</th>
                                            <th className="text-right pb-4 text-xs md:text-sm font-medium text-pink-600 uppercase tracking-wider">Right BV</th>
                                            <th className="text-right pb-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 md:py-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-6 md:w-8 h-6 md:h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3 md:w-4 h-3 md:h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-medium text-gray-900">Total BV</span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-medium text-indigo-600">{formatWithCount(current.left.totalBV, current.left.totalPurchasedMembers)}</td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-medium text-pink-600">{formatWithCount(current.right.totalBV, current.right.totalPurchasedMembers)}</td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-medium text-gray-900">{formatWithCount(current.left.totalBV + current.right.totalBV, current.left.totalPurchasedMembers + current.right.totalPurchasedMembers)}</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 md:py-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-6 md:w-8 h-6 md:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3 md:w-4 h-3 md:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-medium text-gray-900">Today&apos;s Paid BV</span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-green-600">{formatWithCount(current.left.paidBV, current.left.paidMembers)}</td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-green-600">{formatWithCount(current.right.paidBV, current.right.paidMembers)}</td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-green-700">{formatWithCount(current.left.paidBV + current.right.paidBV, current.left.paidMembers + current.right.paidMembers)}</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 md:py-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-6 md:w-8 h-6 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3 md:w-4 h-3 md:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-medium text-gray-900">Today&apos;s Unpaid BV</span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-indigo-600">{formatWithCount(current.left.unpaidBV, current.left.unpaidMembers)}</td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-pink-600">{formatWithCount(current.right.unpaidBV, current.right.unpaidMembers)}</td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-gray-900">{formatWithCount(current.left.unpaidBV + current.right.unpaidBV, current.left.unpaidMembers + current.right.unpaidMembers)}</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 md:py-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-6 md:w-8 h-6 md:h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3 md:w-4 h-3 md:h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-medium text-gray-900">Carry Forward</span>
                                                </div>
                                            </td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-medium text-indigo-600">{formatWithCount(current.left.carryForward, current.left.carryPurchasedMembers)}</td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-medium text-pink-600">{formatWithCount(current.right.carryForward, current.right.carryPurchasedMembers)}</td>
                                            <td className="py-3 md:py-4 text-right text-xs md:text-sm font-medium text-gray-900">{formatWithCount(current.left.carryForward + current.right.carryForward, current.left.carryPurchasedMembers + current.right.carryPurchasedMembers)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </AnimateOnScroll>

                    {/* History */}
                    <AnimateOnScroll animation="fade-up" delay={200}>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-medium text-gray-900">Matching Bonus History</h2>
                            </div>

                            {history.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="text-left px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                                                <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {history.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">
                                                        {String(new Date(row.createdAt).getDate()).padStart(2, '0')}/{String(new Date(row.createdAt).getMonth() + 1).padStart(2, '0')}/{String(new Date(row.createdAt).getFullYear()).slice(-2)}
                                                    </td>
                                                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600">{(row.detail || 'Matching bonus').replace(/\(1:1\)/g, '').trim() || 'Matching bonus'}</td>
                                                    <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-emerald-600 text-right">
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

                        {/* Pagination */}
                        {data?.pagination && data.pagination.totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white rounded-b-2xl border-x border-b">
                                <p className="text-sm text-gray-500">
                                    Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} - {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={!data.pagination.hasPrev}
                                        className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-50 transition"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-600 px-2">
                                        Page {data.pagination.page} of {data.pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={!data.pagination.hasNext}
                                        className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-50 hover:bg-gray-50 transition"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </AnimateOnScroll>
                </>
            )}
        </DashboardLayout>
    )
}
