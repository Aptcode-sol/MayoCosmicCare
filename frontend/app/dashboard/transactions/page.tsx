"use client"
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { getTransactions } from '@/lib/services/dashboard'
import { Button } from '@/components/ui/Button'

interface Transaction {
    id: string
    type: string
    amount: number
    detail?: string
    createdAt: string
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

interface Stats {
    type: string
    total: number
    count: number
}

const typeLabels: Record<string, { label: string, color: string }> = {
    DIRECT_BONUS: { label: 'Direct Bonus', color: 'bg-blue-100 text-blue-700' },
    MATCHING_BONUS: { label: 'Matching Bonus', color: 'bg-purple-100 text-purple-700' },
    PURCHASE: { label: 'Purchase', color: 'bg-orange-100 text-orange-700' },
    WITHDRAW: { label: 'Withdrawal', color: 'bg-red-100 text-red-700' },
    REFUND: { label: 'Refund', color: 'bg-green-100 text-green-700' },
    ADMIN_CREDIT: { label: 'Admin Credit', color: 'bg-emerald-100 text-emerald-700' },
    ADMIN_DEBIT: { label: 'Admin Debit', color: 'bg-rose-100 text-rose-700' }
}

export default function Transactions() {
    const router = useRouter()
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [stats, setStats] = useState<Stats[]>([])
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)

    const loadData = useCallback(async (page = 1, type = 'all') => {
        try {
            setLoading(true)
            const token = localStorage.getItem('accessToken')
            if (!token) { router.push('/login'); return }

            const [userRes, txRes] = await Promise.all([
                me(),
                getTransactions({ page, limit: 15, type: type === 'all' ? undefined : type })
            ])
            setUser(userRes?.user || userRes)
            setTransactions(txRes.transactions || [])
            setPagination(txRes.pagination)
            setStats(txRes.stats || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        loadData(currentPage, typeFilter)
    }, [currentPage, typeFilter, loadData])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleTypeChange = (type: string) => {
        setTypeFilter(type)
        setCurrentPage(1)
    }

    if (loading && !transactions.length) {
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
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">Transactions</h1>
                <p className="text-gray-500 mt-1">View all your transaction history</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                    <div key={stat.type} className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${typeLabels[stat.type]?.color || 'bg-gray-100 text-gray-700'}`}>
                            {typeLabels[stat.type]?.label || stat.type}
                        </div>
                        <p className={`text-xl font-semibold ${stat.total >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {stat.total >= 0 ? '+' : ''}₹{stat.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{stat.count} transactions</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6 flex flex-wrap items-center gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                    >
                        <option value="all">All Transactions</option>
                        <option value="DIRECT_BONUS">Direct Bonus</option>
                        <option value="MATCHING_BONUS">Matching Bonus</option>
                        <option value="PURCHASE">Purchases</option>
                        <option value="WITHDRAW">Withdrawals</option>
                    </select>
                </div>
                {pagination && (
                    <div className="ml-auto text-sm text-gray-500">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </div>
                )}
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeLabels[tx.type]?.color || 'bg-gray-100 text-gray-700'}`}>
                                                {typeLabels[tx.type]?.label || tx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {tx.detail || '-'}
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-semibold text-right ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {tx.amount >= 0 ? '+' : ''}₹{tx.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-500">No transactions found</p>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrev}
                        >
                            ← Previous
                        </Button>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNum: number
                                if (pagination.totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNext}
                        >
                            Next →
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
