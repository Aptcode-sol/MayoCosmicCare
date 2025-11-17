"use client"
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { listPublic, purchase } from '../../lib/services/products'

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
            // support both shapes: { products } or direct array
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
            <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#8b7355] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fdfcfb] py-16">
            <div className="container mx-auto px-4 lg:px-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        Premium <span className="text-[#8b7355]">Products</span>
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        Discover our curated collection of premium products. Each purchase contributes to your network growth.
                    </p>
                </div>

                {products.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {products.map((product) => (
                            <div key={product.id} className="elegant-card rounded-xl overflow-hidden group">
                                <div className="aspect-square bg-[#f5f3f0] relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    )}
                                    {product.stock <= 5 && product.stock > 0 && (
                                        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                            Only {product.stock} left
                                        </div>
                                    )}
                                    {product.stock === 0 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold">
                                                Out of Stock
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#8b7355]/10 text-[#8b7355]">
                                            {product.bv} BV
                                        </span>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {product.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold text-gray-900">
                                            ₹{product.price.toLocaleString()}
                                        </div>
                                        <button
                                            onClick={() => handlePurchase(product.id, product.name)}
                                            disabled={product.stock === 0}
                                            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Purchase
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Products Available</h3>
                        <p className="text-gray-600">Check back soon for new products</p>
                    </div>
                )}
            </div>
        </div>
    )
}
