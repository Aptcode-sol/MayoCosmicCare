"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { listPublic, purchase } from '../../../lib/services/products'
import { Button } from "@/components/ui/Button"
import toast from 'react-hot-toast'
import { parseApiError } from '../../../lib/api'

interface Product {
    id: string
    name: string
    description: string
    price: number
    bv: number
    stock: number
    imageUrl?: string
}

export default function ProductDetail() {
    const params = useParams()
    const router = useRouter()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            loadProduct(params.id as string)
        }
    }, [params.id])

    async function loadProduct(id: string) {
        try {
            const res = await listPublic()
            const found = (res?.products ?? res ?? []).find((p: Product) => p.id === id)

            if (found) {
                setProduct(found)
            } else {
                toast.error('Product not found')
                router.push('/products')
            }
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            toast.error(String(message || 'Failed to load product'))
        } finally {
            setLoading(false)
        }
    }

    async function handlePurchase() {
        if (!product) return

        const token = localStorage.getItem('accessToken')
        if (!token) {
            toast.error('Please login to purchase')
            router.push('/login')
            return
        }

        try {
            await purchase(product.id)
            toast.success(`Successfully purchased ${product.name}!`)
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            toast.error(String(message || 'Purchase failed'))
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
                <div className="text-center animate-pulse">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading details...</p>
                </div>
            </div>
        )
    }

    if (!product) return null

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-6 py-24 md:py-32">
                <Button
                    variant="ghost"
                    className="mb-8 hover:bg-gray-100 -ml-4"
                    onClick={() => router.back()}
                >
                    ← Back to Collection
                </Button>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
                    {/* Image Section */}
                    <div className="bg-gray-50 rounded-2xl overflow-hidden aspect-square relative group">
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-32 h-32 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                            <div className="absolute top-6 right-6 bg-red-500 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider rounded-full">
                                Low Stock: {product.stock} left
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="flex flex-col justify-center">
                        <div className="mb-8">
                            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-2 block">Premium Wellness</span>
                            <h1 className="text-3xl lg:text-5xl font-light text-gray-900 mb-4 tracking-tight">{product.name}</h1>
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-3xl font-semibold text-gray-900">₹{product.price.toLocaleString()}</span>
                                <span className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">BV: {product.bv}</span>
                            </div>
                        </div>

                        <div className="prose prose-gray max-w-none mb-10 text-gray-600 text-lg leading-relaxed">
                            <p>{product.description}</p>
                        </div>

                        <div className="space-y-6 pt-8 border-t border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                                <span className="text-sm font-medium text-gray-700">In Stock: Ready to ship</span>
                            </div>

                            <Button
                                size="lg"
                                className="w-full md:w-auto min-w-[200px] h-14 text-lg bg-gray-900 hover:bg-gray-800"
                                onClick={handlePurchase}
                                disabled={product.stock === 0}
                            >
                                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
