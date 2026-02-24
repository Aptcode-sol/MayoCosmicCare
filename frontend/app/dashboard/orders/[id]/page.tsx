"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { me } from '@/lib/services/auth'
import { downloadReceipt } from '@/lib/services/payment'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from "@/components/ui/SkeletonCard"
import { formatIndian } from '@/lib/formatIndian'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Product {
    id: string
    name: string
    price: number
    bv: number
    description?: string
    keyFeatures?: string
    imageUrl?: string
}

interface OrderItem {
    id: string
    quantity: number
    price: number
    product: Product
}

interface Order {
    id: string
    totalAmount: number
    status: 'PENDING' | 'PAID' | 'FAILED'
    cashfreeOrderId?: string
    createdAt: string
    updatedAt: string
    items: OrderItem[]
}

interface Transaction {
    id: string
    type: string
    amount: number
    createdAt: string
    detail?: string
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    PAID: { label: 'Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    PENDING: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    FAILED: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    PURCHASE: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
}

/* ──────────────────────────────────────────────
   Product Card — Image Left, Details Right
   ────────────────────────────────────────────── */
function ProductCard({ product, quantity }: {
    product: Product
    quantity?: number
}) {
    const features = (product.keyFeatures || '')
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean)

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="grid md:grid-cols-2 gap-0">
                {/* Left — Image */}
                <div className="relative bg-gray-50 aspect-square md:aspect-auto md:min-h-[360px] overflow-hidden group">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.parentElement!.classList.add('flex', 'items-center', 'justify-center')
                                const placeholder = document.createElement('div')
                                placeholder.innerHTML = `<svg class="w-24 h-24 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
                                target.parentElement!.appendChild(placeholder)
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-24 h-24 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}

                    {/* Quantity Badge */}
                    {quantity && quantity > 1 && (
                        <div className="absolute top-4 right-4 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            ×{quantity}
                        </div>
                    )}
                </div>

                {/* Right — Details */}
                <div className="p-6 md:p-8 flex flex-col justify-between">
                    <div>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-900 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">Premium Wellness</span>
                        </div>

                        {/* Name + Price */}
                        <h3 className="text-2xl lg:text-3xl font-light text-gray-900 tracking-tight mb-3">{product.name}</h3>
                        <div className="flex items-center gap-4 mb-5">
                            <span className="text-2xl font-semibold text-gray-900">{formatIndian(product.price)}</span>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                                {product.bv} BV
                            </span>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-3">{product.description}</p>
                        )}

                        {/* Key Features */}
                        {features.length > 0 && (
                            <div className="mb-5">
                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-bold mb-2">Key Features</p>
                                <div className="space-y-1.5">
                                    {features.slice(0, 4).map((f, i) => {
                                        const [title, ...rest] = f.split(':')
                                        return (
                                            <div key={i} className="flex items-start gap-2">
                                                <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center mt-0.5 shrink-0">
                                                    <svg className="w-2.5 h-2.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <p className="text-xs text-gray-600 leading-snug">
                                                    <span className="font-medium text-gray-800">{title.trim()}</span>
                                                    {rest.length > 0 && <span className="text-gray-400">: {rest.join(':').trim()}</span>}
                                                </p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function OrderDetail() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const entryId = params.id as string
    const source = searchParams.get('source') || 'order'

    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [order, setOrder] = useState<Order | null>(null)
    const [transaction, setTransaction] = useState<Transaction | null>(null)
    const [product, setProduct] = useState<Product | null>(null)
    const [matchedOrderId, setMatchedOrderId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadData() {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) { router.push('/login'); return }

                const userRes = await me()
                setUser(userRes?.user || userRes)

                if (source === 'order') {
                    const orderRes = await api.get(`/api/orders/${entryId}`)
                    setOrder(orderRes.data)
                } else {
                    const res = await api.get(`/api/orders/purchase/${entryId}`)
                    setTransaction(res.data.transaction)
                    setProduct(res.data.product)
                    if (res.data.orderId) setMatchedOrderId(res.data.orderId)
                }
            } catch (e: any) {
                console.error(e)
                setError(e?.response?.data?.error || e?.message || 'Failed to load details')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [router, entryId, source])

    const handleDownload = async (orderId?: string | null) => {
        if (!orderId) {
            toast.error('Receipt not available yet for this purchase')
            return
        }
        setDownloading(true)
        const toastId = toast.loading('Generating receipt...')
        try {
            await downloadReceipt(orderId)
            toast.success('Receipt downloaded!', { id: toastId })
        } catch {
            toast.error('Failed to download receipt', { id: toastId })
        } finally {
            setDownloading(false)
        }
    }

    // ─── Loading ────────────────────────────────────────────────────
    if (loading) {
        return (
            <DashboardLayout user={user}>
                <div className="space-y-6">
                    {/* Back link + title */}
                    <div>
                        <div className="h-4 bg-gray-100 rounded w-28 mb-4 animate-pulse" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
                                <div className="h-3 bg-gray-50 rounded w-56 animate-pulse" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-7 bg-gray-100 rounded-full w-16 animate-pulse" />
                                <div className="h-10 bg-gray-200 rounded-xl w-36 animate-pulse" />
                            </div>
                        </div>
                    </div>
                    {/* Product card skeleton */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* Image area */}
                            <div className="bg-gray-100 aspect-square md:aspect-auto md:min-h-[360px] animate-pulse" />
                            {/* Details area */}
                            <div className="p-6 md:p-8 space-y-4">
                                <div className="h-5 bg-gray-100 rounded-full w-32 animate-pulse" />
                                <div className="h-7 bg-gray-100 rounded w-3/4 animate-pulse" />
                                <div className="flex items-center gap-3">
                                    <div className="h-6 bg-gray-100 rounded w-20 animate-pulse" />
                                    <div className="h-5 bg-gray-50 rounded-full w-14 animate-pulse" />
                                </div>
                                <div className="h-3 bg-gray-50 rounded w-full animate-pulse" />
                                <div className="h-3 bg-gray-50 rounded w-5/6 animate-pulse" />
                                <div className="space-y-2 pt-2">
                                    <div className="h-3 bg-gray-50 rounded w-20 animate-pulse" />
                                    <div className="h-3 bg-gray-50 rounded w-40 animate-pulse" />
                                    <div className="h-3 bg-gray-50 rounded w-32 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Amount summary skeleton */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-3 bg-gray-50 rounded w-20 animate-pulse" />
                            <div className="h-6 bg-gray-100 rounded w-16 animate-pulse" />
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // ─── Error ──────────────────────────────────────────────────────
    if (error) {
        return (
            <DashboardLayout user={user}>
                <div className="text-center py-32 bg-white rounded-2xl border border-dashed border-gray-200">
                    <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-700 mb-1">Something went wrong</h3>
                    <p className="text-sm text-gray-400 mb-4">{error}</p>
                    <Button variant="outline" onClick={() => router.push('/dashboard/orders')}>← Back to Orders</Button>
                </div>
            </DashboardLayout>
        )
    }

    // ─── Transaction-sourced purchase (single product) ──────────────
    if (transaction && product) {
        return (
            <DashboardLayout user={user}>
                <AnimateOnScroll animation="fade-up">
                    <button
                        onClick={() => router.push('/dashboard/orders')}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Orders
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Purchase Details</h1>
                            <p className="text-gray-400 mt-1 text-sm">
                                {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase border ${statusConfig.PURCHASE.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.PURCHASE.dot}`} />
                                {statusConfig.PURCHASE.label}
                            </span>
                            <Button
                                onClick={() => handleDownload(matchedOrderId)}
                                disabled={downloading}
                                className="h-10 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 text-sm font-medium transition-all duration-200 hover:shadow-lg"
                            >
                                {downloading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download Receipt
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </AnimateOnScroll>

                <AnimateOnScroll animation="fade-up" delay={100}>
                    <ProductCard product={product} />
                </AnimateOnScroll>

                {/* Amount Summary */}
                <AnimateOnScroll animation="fade-up" delay={200}>
                    <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 uppercase tracking-wider font-medium">Amount Paid</span>
                            <span className="text-2xl font-semibold text-gray-900">{formatIndian(transaction.amount)}</span>
                        </div>
                    </div>
                </AnimateOnScroll>
            </DashboardLayout>
        )
    }

    // Transaction without product info
    if (transaction && !product) {
        return (
            <DashboardLayout user={user}>
                <AnimateOnScroll animation="fade-up">
                    <button
                        onClick={() => router.push('/dashboard/orders')}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Orders
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <h1 className="text-3xl font-light text-gray-900 tracking-tight">Purchase Details</h1>
                        <Button
                            onClick={() => handleDownload(matchedOrderId)}
                            disabled={downloading}
                            className="h-10 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 text-sm font-medium"
                        >
                            {downloading ? 'Generating...' : 'Download Receipt'}
                        </Button>
                    </div>
                </AnimateOnScroll>
                <AnimateOnScroll animation="fade-up" delay={100}>
                    <div className="bg-white rounded-2xl border border-gray-100 p-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Date</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {new Date(transaction.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Product</p>
                                <p className="text-sm font-medium text-gray-900">{transaction.detail?.replace(/^Purchase\s+/i, '') || 'Product Purchase'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Amount</p>
                                <p className="text-lg font-semibold text-gray-900">{formatIndian(transaction.amount)}</p>
                            </div>
                        </div>
                    </div>
                </AnimateOnScroll>
            </DashboardLayout>
        )
    }

    // ─── Order-sourced purchase (gateway — full detail) ──────────────
    if (!order) return null

    const orderStatus = statusConfig[order.status] || statusConfig.PENDING

    return (
        <DashboardLayout user={user}>
            {/* Back + Header */}
            <AnimateOnScroll animation="fade-up">
                <button
                    onClick={() => router.push('/dashboard/orders')}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Orders
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-light text-gray-900 tracking-tight">Order Details</h1>
                        <p className="text-gray-400 mt-1 text-sm">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                            })}
                            <span className="mx-2 text-gray-300">·</span>
                            <span className="font-mono text-gray-500">{order.id.slice(-12).toUpperCase()}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase border ${orderStatus.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${orderStatus.dot}`} />
                            {orderStatus.label}
                        </span>
                        {order.status === 'PAID' && (
                            <Button
                                onClick={() => handleDownload(order.id)}
                                disabled={downloading}
                                className="h-10 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 text-sm font-medium transition-all duration-200 hover:shadow-lg"
                            >
                                {downloading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download Receipt
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </AnimateOnScroll>

            {/* Product Cards */}
            <div className="space-y-6 mb-8">
                {order.items.map((item, idx) => (
                    <AnimateOnScroll key={item.id} animation="fade-up" delay={100 + idx * 80}>
                        <ProductCard
                            product={item.product}
                            quantity={item.quantity}
                        />
                    </AnimateOnScroll>
                ))}
            </div>

            {/* Order Summary */}
            <AnimateOnScroll animation="fade-up" delay={300}>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {order.items.map((item, idx) => (
                            <div key={item.id} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                                        <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatIndian(item.price)}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{formatIndian(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-5 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Grand Total</span>
                        <span className="text-xl font-bold text-gray-900">{formatIndian(order.totalAmount)}</span>
                    </div>
                </div>
            </AnimateOnScroll>
        </DashboardLayout>
    )
}
