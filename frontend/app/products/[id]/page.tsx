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

    // Check if this is a mattress product
    const isMattress = product.name.toLowerCase().includes('mattress') || product.name.toLowerCase().includes('magnetic')

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-6 py-24 md:py-32">
                <AnimateOnScroll animation="fade-up">
                    <Button
                        variant="ghost"
                        className="mb-8 hover:bg-gray-100 -ml-4"
                        onClick={() => router.back()}
                    >
                        ← Back to Collection
                    </Button>
                </AnimateOnScroll>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
                    {/* Image Section */}
                    <AnimateOnScroll animation="fade-up" delay={100}>
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
                    </AnimateOnScroll>

                    {/* Details Section */}
                    <AnimateOnScroll animation="fade-up" delay={200}>
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
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0}
                                >
                                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </Button>
                            </div>
                        </div>
                    </AnimateOnScroll>
                </div>

                {/* Mattress Features Section - Only show for mattress products */}
                {isMattress && (
                    <>
                        {/* Main Features Grid */}
                        <AnimateOnScroll animation="fade-up" delay={100}>
                            <div className="mt-24 pt-16 border-t border-gray-100">
                                <h2 className="text-3xl font-light text-gray-900 mb-12 text-center">Key Features</h2>
                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="bg-gray-50 rounded-3xl p-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mb-6">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Blood Circulation</h3>
                                        <p className="text-gray-500 leading-relaxed">
                                            Enhances smooth blood flow from head to toe, naturally improving oxygen delivery to all 78 vital organs
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-3xl p-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Energy Boost</h3>
                                        <p className="text-gray-500 leading-relaxed">
                                            Absorbs glucose & fatty acids, converting them into high energy while reducing fatigue and tiredness
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-3xl p-8">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Deep Sleep</h3>
                                        <p className="text-gray-500 leading-relaxed">
                                            Experience restorative deep sleep that helps your body heal, recover, and rejuvenate naturally
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </AnimateOnScroll>

                        {/* Health Benefits */}
                        <AnimateOnScroll animation="fade-up" delay={200}>
                            <div className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-10 lg:p-16">
                                <h3 className="text-2xl font-light text-white mb-10 text-center">
                                    Comprehensive Health Benefits
                                </h3>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { icon: "💪", text: "Increases Strength & Resistance" },
                                        { icon: "🩸", text: "Controls BP & Cholesterol" },
                                        { icon: "🧠", text: "Improves Brain Health" },
                                        { icon: "🦴", text: "Helps Joint & Bone Pain" },
                                        { icon: "⚡", text: "Boosts Body Flexibility" },
                                        { icon: "🛡️", text: "EMF Radiation Protection" },
                                        { icon: "🌿", text: "Anti-Aging Benefits" },
                                        { icon: "✨", text: "Complete Body Detox" },
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                                            <span className="text-2xl">{benefit.icon}</span>
                                            <span className="text-white/90 text-sm font-medium">{benefit.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </AnimateOnScroll>

                        {/* Trust Badges */}
                        <AnimateOnScroll animation="fade-up" delay={300}>
                            <div className="flex flex-wrap justify-center gap-6 mt-16">
                                {['100% Natural', 'Scientifically Proven', 'Zero Side Effects', 'Drug-Free Therapy'].map((badge, i) => (
                                    <div key={i} className="flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-full border border-gray-100">
                                        <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium text-gray-700">{badge}</span>
                                    </div>
                                ))}
                            </div>
                        </AnimateOnScroll>
                    </>
                )}
            </div>
        </div>
    )
}

