"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { getTransactions } from '@/lib/services/dashboard'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import { SkeletonCard } from "@/components/ui/SkeletonCard"
import { formatIndian } from '@/lib/formatIndian'
import api from '@/lib/api'

interface OrderItem {
    id: string
    quantity: number
    price: number
    product: {
        name: string
        imageUrl?: string
    }
}

interface Order {
    id: string
    totalAmount: number
    status: 'PENDING' | 'PAID' | 'FAILED'
    createdAt: string
    items: OrderItem[]
}

interface Transaction {
    id: string
    type: string
    amount: number
    createdAt: string
    detail?: string
}

// Unified purchase entry — from either Order or Transaction
interface PurchaseEntry {
    id: string
    source: 'order' | 'transaction'
    amount: number
    status: string
    date: string
    label: string
    itemCount?: number
    orderId?: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
    PAID: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PENDING: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    FAILED: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200' },
    PURCHASE: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export default function Orders() {
    const router = useRouter()
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [purchases, setPurchases] = useState<PurchaseEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) { router.push('/login'); return }

                const [userRes, ordersRes, txRes] = await Promise.all([
                    me(),
                    api.get('/api/orders').catch(() => ({ data: [] })),
                    getTransactions({ type: 'PURCHASE', limit: 100 })
                ])
                setUser(userRes?.user || userRes)

                const entries: PurchaseEntry[] = []

                // Add gateway orders (have item details, receipt downloadable)
                const orders: Order[] = ordersRes.data || []
                const orderAmountDates = new Set<string>()

                orders.forEach(order => {
                    const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0)
                    const productNames = order.items.map(i => i.product.name).join(', ')
                    const key = `${order.totalAmount}-${new Date(order.createdAt).toDateString()}`
                    orderAmountDates.add(key)

                    entries.push({
                        id: order.id,
                        source: 'order',
                        amount: order.totalAmount,
                        status: order.status,
                        date: order.createdAt,
                        label: productNames,
                        itemCount,
                        orderId: order.id
                    })
                })

                // Add direct purchase transactions (no order record)
                const transactions: Transaction[] = txRes?.transactions || []
                transactions.forEach(tx => {
                    // Skip if this transaction is already covered by an Order
                    const key = `${tx.amount}-${new Date(tx.createdAt).toDateString()}`
                    if (orderAmountDates.has(key)) return

                    entries.push({
                        id: tx.id,
                        source: 'transaction',
                        amount: tx.amount,
                        status: 'PURCHASE',
                        date: tx.createdAt,
                        label: tx.detail || 'Product Purchase',
                        itemCount: 1
                    })
                })

                // Sort by date descending
                entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                setPurchases(entries)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [router])

    return (
        <DashboardLayout user={user}>
            {loading ? (
                <div className="space-y-6">
                    {/* Header skeleton */}
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-100 rounded-lg w-32 animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-lg w-64 animate-pulse" />
                    </div>
                    {/* Card skeletons matching real order cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5" style={{ animationDelay: `${i * 100}ms` }}>
                                {/* Date + Status */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
                                    <div className="h-5 bg-gray-100 rounded-full w-14 animate-pulse" />
                                </div>
                                {/* Product name */}
                                <div className="h-4 bg-gray-100 rounded w-3/4 mb-1.5 animate-pulse" />
                                {/* Items count */}
                                <div className="h-3 bg-gray-50 rounded w-12 mb-4 animate-pulse" />
                                {/* Total row */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <div className="h-3 bg-gray-50 rounded w-10 animate-pulse" />
                                    <div className="h-5 bg-gray-100 rounded w-16 animate-pulse" />
                                </div>
                                {/* View details */}
                                <div className="mt-3 flex items-center gap-1">
                                    <div className="h-3 bg-gray-50 rounded w-16 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Page Header */}
                    <AnimateOnScroll animation="fade-up">
                        <div className="mb-8">
                            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Orders</h1>
                            <p className="text-gray-500 mt-1">View your purchase history and download receipts</p>
                        </div>
                    </AnimateOnScroll>

                    {purchases.length > 0 ? (
                        <AnimateOnScroll animation="fade-up" delay={100}>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {purchases.map((entry) => {
                                    const status = statusConfig[entry.status] || statusConfig.PURCHASE
                                    const hasDetail = entry.source === 'order'

                                    return (
                                        <button
                                            key={entry.id}
                                            onClick={() => router.push(`/dashboard/orders/${entry.id}?source=${entry.source}`)}
                                            className="bg-white rounded-2xl border border-gray-100 p-5 text-left transition-all duration-200 group hover:shadow-lg hover:border-gray-200 cursor-pointer"
                                        >
                                            {/* Header: Date + Status */}
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-xs text-gray-500">
                                                    {new Date(entry.date).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Products */}
                                            <p className="text-sm font-medium text-gray-900 truncate mb-1 group-hover:text-gray-700 transition-colors">
                                                {entry.label}
                                            </p>
                                            {entry.itemCount && (
                                                <p className="text-xs text-gray-400 mb-4">
                                                    {entry.itemCount} {entry.itemCount === 1 ? 'item' : 'items'}
                                                </p>
                                            )}

                                            {/* Total */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total</span>
                                                <span className="text-lg font-semibold text-gray-900">{formatIndian(entry.amount)}</span>
                                            </div>

                                            {/* Arrow hint */}
                                            <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                                                <span>View Details</span>
                                                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </AnimateOnScroll>
                    ) : (
                        <AnimateOnScroll animation="fade-up" delay={100}>
                            <div className="text-center py-32 bg-white rounded-2xl border border-dashed border-gray-200">
                                <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-700 mb-1">No orders yet</h3>
                                <p className="text-sm text-gray-400">Your purchase history will appear here</p>
                            </div>
                        </AnimateOnScroll>
                    )}
                </>
            )}
        </DashboardLayout>
    )
}
