"use client"
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { listPublic, purchase } from '../../lib/services/products'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface Product {
    id: string
    name: string
    description: string
    price: number
    bv: number
    stock: number
    imageUrl?: string
}

export default function Products() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadProducts()
    }, [])

    async function loadProducts() {
        try {
            const res = await listPublic()
            setProducts(res?.products ?? res ?? [])
        } catch (error) {
            toast.error('Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    async function handlePurchase(productId: string, productName: string) {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            toast.error('Please login to purchase')
            return
        }

        try {
            await purchase(productId)
            toast.success(`Successfully purchased ${productName}!`)
            loadProducts()
        } catch (err) {
            toast.error('Purchase failed')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white pt-20">
                <div className="text-center animate-pulse">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading fine products...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/30 pt-32 pb-20">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3 block">Premium Wellness</span>
                    <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 tracking-tight">Our Collections</h1>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        Discover our curated selection of premium health and lifestyle products, designed to elevate your everyday well-being.
                    </p>
                </div>

                {products.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products.map((product, idx) => (
                            <Card
                                key={product.id}
                                className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-500 bg-white"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                            <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {product.stock <= 5 && product.stock > 0 && (
                                        <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-full shadow-sm">
                                            Low Stock
                                        </div>
                                    )}
                                    {product.stock === 0 && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                                            <span className="text-sm font-semibold text-gray-900 border border-gray-900 px-6 py-2 uppercase tracking-widest">Sold Out</span>
                                        </div>
                                    )}

                                    {/* Overlay Action */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <Button
                                            variant="secondary"
                                            className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg"
                                            onClick={() => window.location.href = `/products/${product.id}`}
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </div>

                                <CardHeader className="pt-6 pb-2">
                                    <div className="flex justify-between items-start mb-1">
                                        <CardTitle className="text-lg font-medium text-gray-900 line-clamp-1">{product.name}</CardTitle>
                                        <span className="text-lg font-semibold text-gray-900">₹{product.price.toLocaleString()}</span>
                                    </div>
                                    <div className="flex gap-2 text-xs">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{product.bv} BV</span>
                                        <span className="text-gray-400 font-medium">In Stock</span>
                                    </div>
                                </CardHeader>

                                <CardContent className="pb-4">
                                    <CardDescription className="line-clamp-2 text-sm text-gray-500 leading-relaxed min-h-[2.5rem]">
                                        {product.description}
                                    </CardDescription>
                                </CardContent>

                                <CardFooter className="pt-0 pb-6">
                                    <Button
                                        onClick={() => handlePurchase(product.id, product.name)}
                                        disabled={product.stock === 0}
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-colors"
                                    >
                                        {product.stock === 0 ? 'Unavailable' : 'Add to Cart'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                        <p className="text-gray-500">We're updating our inventory. Please check back soon.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
