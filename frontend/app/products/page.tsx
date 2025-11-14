"use client"
import { useEffect, useState } from 'react'
import { listPublic, purchase as purchaseProduct } from '../../lib/services/products'

export default function Products() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState<{ open: boolean, title?: string, body?: string }>({ open: false })
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => { fetchProducts() }, [])

    async function fetchProducts() {
        try {
            const res = await listPublic()
            setProducts(res.products || [])
        } catch (err) {
            setModal({ open: true, title: 'Error', body: 'Failed to fetch products' })
        } finally { setLoading(false) }
    }

    async function purchase(productId: string) {
        // optimistic UI: mark as processing
        setProcessingId(productId)
        const original = products.map(p => ({ ...p }))
        setProducts(products.map(p => p.id === productId ? { ...p, stock: p.stock - 1 } : p))

        try {
            const token = localStorage.getItem('accessToken')
            if (!token) return window.location.href = '/login'
            await purchaseProduct(productId)
            setModal({ open: true, title: 'Purchase success', body: 'Your purchase was successful.' })
        } catch (err: any) {
            // rollback
            setProducts(original)
            setModal({ open: true, title: 'Purchase failed', body: err.response?.data?.error || err.message })
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) return <p className="p-8">Loading...</p>

    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold mb-6">Products</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map(p => (
                    <div key={p.id} className="bg-white rounded shadow p-4">
                        <img src={p.imageUrl || 'https://via.placeholder.com/400x200'} alt={p.name} className="w-full h-40 object-cover mb-3" />
                        <h2 className="font-semibold">{p.name}</h2>
                        <p className="text-sm text-gray-600">BV: {p.bv} • ₹{p.price}</p>
                        <p className="mt-2 text-sm">{p.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-gray-700">Stock: {p.stock}</span>
                            <button onClick={() => purchase(p.id)} disabled={processingId === p.id || p.stock <= 0} className="px-3 py-1 bg-blue-600 text-white rounded">{processingId === p.id ? 'Processing...' : 'Buy'}</button>
                        </div>
                    </div>
                ))}
            </div>

            {modal.open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white rounded shadow p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-2">{modal.title}</h3>
                        <p className="mb-4">{modal.body}</p>
                        <div className="text-right">
                            <button onClick={() => setModal({ open: false })} className="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
