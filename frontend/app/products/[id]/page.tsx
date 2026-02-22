"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { listPublic } from '../../../lib/services/products'
import { Button } from "@/components/ui/Button"
import toast from 'react-hot-toast'
import { parseApiError } from '../../../lib/api'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import { useCart } from '../../../context/CartContext'

interface Product {
    id: string
    name: string
    description: string
    keyFeatures?: string
    price: number
    bv: number
    stock: number
    imageUrl?: string
}

export default function ProductDetail() {
    const params = useParams()
    const router = useRouter()
    const { addToCart } = useCart()
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

    function handleAddToCart() {
        if (!product) return

        const token = localStorage.getItem('accessToken')
        if (!token) {
            toast.error('Please login to purchase')
            router.push('/login')
            return
        }

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl
        })
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

    // Check if this is a mattress product - no longer needed as all products share the dark theme
    const isMattress = true // Forced to true to easily maintain the dark theme layout

    return (
        <div className={`min-h-screen transition-colors duration-700 bg-[#080808] text-white`}>
            <div className="container mx-auto px-6 py-24 md:py-32 relative">
                {/* Dramatic radial glow backdrop for Mattress */}
                {isMattress && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px]" />
                        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-gray-500/10 rounded-full blur-[80px]" />
                    </div>
                )}

                <AnimateOnScroll animation="fade-up">
                    <Button
                        variant="ghost"
                        className={`mb-8 -ml-4 text-white/60 hover:text-white hover:bg-white/5`}
                        onClick={() => router.back()}
                    >
                        ← Back to Collection
                    </Button>
                </AnimateOnScroll>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-20 relative z-10">
                    {/* Image Section */}
                    <AnimateOnScroll animation="fade-up" delay={100}>
                        <div className={`rounded-2xl overflow-hidden aspect-square relative group border bg-white/5 border-white/10 shadow-2xl`}>
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg className={`w-32 h-32 text-white/10`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                            {product.stock <= 5 && product.stock > 0 && (
                                <div className="absolute top-6 right-6 bg-red-500 text-white text-[10px] font-bold px-4 py-1.5 uppercase tracking-widest rounded-full shadow-lg">
                                    Low Stock: {product.stock}
                                </div>
                            )}
                        </div>
                    </AnimateOnScroll>

                    {/* Details Section */}
                    <AnimateOnScroll animation="fade-up" delay={200}>
                        <div className="flex flex-col justify-center h-full">
                            <div className="mb-8">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 border bg-white/10 border-white/20`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse bg-white`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-white/70`}>Premium Wellness</span>
                                </div>
                                {/* Normal full title */}
                                <h1 className={`text-4xl lg:text-6xl font-light mb-6 tracking-tight leading-tight text-white`}>
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-6 mb-6">
                                    <span className={`text-4xl font-semibold text-white`}>₹{product.price.toLocaleString()}</span>
                                    <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white/80`}>
                                        {product.bv} BV
                                    </div>
                                </div>
                            </div>

                            {/* Description moved to bottom section intentionally to match landing page, but keeping a short snippet here if desired. For true sync, we remove it here. */}
                            <div className={`space-y-8 pt-6 border-t border-white/10`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                                    <span className={`text-sm font-medium text-white/70`}>Ready for Immediate Dispatch</span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        size="lg"
                                        className={`h-16 px-10 text-lg rounded-full shadow-xl transition-all duration-300 bg-white text-gray-900 hover:bg-gray-100 hover:scale-[1.02]`}
                                        onClick={handleAddToCart}
                                        disabled={product.stock === 0}
                                    >
                                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </AnimateOnScroll>
                </div>

                {/* Dynamic Features Section - Iconless like landing page */}
                {product.keyFeatures && (
                    <div className="mt-32 space-y-24">
                        <AnimateOnScroll animation="fade-up">
                            <h2 className={`text-4xl lg:text-7xl font-light text-center mb-20 tracking-tight text-white`}>
                                Key Features
                            </h2>
                            <div className="flex flex-wrap justify-center gap-6">
                                {product.keyFeatures.split('\n').filter(f => f.trim()).map((feature, i) => (
                                    <div key={i} className={`group relative rounded-2xl border border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 p-10 transition-all duration-500 overflow-hidden flex-1 min-w-[300px] max-w-sm`}>
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-2xl" />
                                        <span className={`absolute top-4 right-6 text-7xl font-black text-white/5 select-none leading-none`}>
                                            {(i + 1).toString().padStart(2, '0')}
                                        </span>
                                        <div className="relative z-10 w-full">
                                            <h3 className={`text-2xl font-bold mb-4 group-hover:translate-x-1 transition-transform text-white`}>
                                                {feature.split(':')[0]}
                                            </h3>
                                            <p className={`text-gray-400 text-base leading-relaxed`}>
                                                {feature.includes(':') ? feature.split(':').slice(1).join(':').trim() : feature}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AnimateOnScroll>

                        {/* Description Section — matching landing page */}
                        <AnimateOnScroll animation="fade-up" delay={200}>
                            <div className={`relative rounded-3xl border border-white/10 bg-white/5 overflow-hidden p-10 lg:p-14 mb-20`}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                <div className="text-center">
                                    <h3 className={`text-3xl lg:text-4xl font-light tracking-tight mb-8 text-white`}>
                                        Comprehensive <span className="font-semibold">Description</span>
                                    </h3>
                                    <p className={`text-xl max-w-4xl mx-auto leading-relaxed text-gray-400`}>
                                        {product.description}
                                    </p>
                                </div>
                            </div>
                        </AnimateOnScroll>

                        {/* Trust Badges */}
                        <AnimateOnScroll animation="fade-up" delay={200}>
                            <div className="flex flex-wrap justify-center gap-6 pb-20">
                                {['Fast Delivery', '100% Genuine', 'Secure Payment', '24/7 Support'].map((badge, i) => (
                                    <div key={i} className={`flex items-center gap-3 px-8 py-4 bg-white/5 border-white/10 rounded-full border shadow-lg`}>
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className={`font-bold text-xs uppercase tracking-widest text-white/70`}>{badge}</span>
                                    </div>
                                ))}
                            </div>
                        </AnimateOnScroll>
                    </div>
                )}
            </div>
        </div>
    )
}

