"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '../../lib/api'
import { adminProducts } from '../../lib/services/admin'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"

interface Product {
    id: string
    name: string
    price: number
    bv: number
    stock: number
    description: string
    imageUrl: string
}

interface User {
    id: string
    username: string
    email: string
    sponsorId: string
    isBlocked: boolean
    fraudFlag: boolean
    leftBV: number
    rightBV: number
    createdAt: string
}

export default function AdminPanel() {
    const router = useRouter();
    const [tab, setTab] = useState<'products' | 'users' | 'withdrawals'>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProductForm, setShowProductForm] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '',
        price: 0,
        bv: 0,
        stock: 0,
        description: '',
        imageUrl: ''
    });

    useEffect(() => {
        fetchData();
    }, [tab]);

    async function fetchData() {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                router.push('/login');
                return;
            }

            if (tab === 'products') {
                const res = await adminProducts()
                setProducts(res.products || []);
            } else if (tab === 'users') {
                const res = await api.get('/api/admin/users')
                setUsers(res.data.users || []);
            }

            setLoading(false);
        } catch (error) {
            console.error(error);
            router.push('/login');
        }
    }

    async function createProduct() {
        try {
            await api.post('/api/admin/products', productForm)
            setShowProductForm(false);
            setProductForm({ name: '', price: 0, bv: 0, stock: 0, description: '', imageUrl: '' });
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Failed to create product');
        }
    }

    async function deleteProduct(id: string) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.delete(`/api/admin/products/${id}`)
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Failed to delete product');
        }
    }

    async function toggleBlockUser(userId: string, currentStatus: boolean) {
        try {
            await api.patch(`/api/admin/users/${userId}/block`, { isBlocked: !currentStatus })
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Failed to update user');
        }
    }

    return (
        <main className="min-h-screen bg-gray-50/30 pt-20">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Admin Console</h1>
                            <p className="text-gray-500 text-sm">Manage system resources and users</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                            ← Back to Dashboard
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 border-b border-gray-100">
                        {['products', 'users', 'withdrawals'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t as any)}
                                className={`px-6 py-3 text-sm font-medium transition-all relative ${tab === t
                                    ? 'text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                {tab === t && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                {/* Products Tab */}
                {tab === 'products' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900">Inventory Management</h2>
                            <Button onClick={() => setShowProductForm(!showProductForm)}>
                                {showProductForm ? 'Cancel' : 'Add New Product'}
                            </Button>
                        </div>

                        {showProductForm && (
                            <Card className="animate-in slide-in-from-top-4 border-gray-200 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Create New Product</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Product Name</Label>
                                                <Input
                                                    placeholder="e.g. Cosmic Serum"
                                                    value={productForm.name}
                                                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Price (₹)</Label>
                                                    <Input
                                                        type="number"
                                                        value={productForm.price}
                                                        onChange={e => setProductForm({ ...productForm, price: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>BV</Label>
                                                    <Input
                                                        type="number"
                                                        value={productForm.bv}
                                                        onChange={e => setProductForm({ ...productForm, bv: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Initial Stock</Label>
                                                <Input
                                                    type="number"
                                                    value={productForm.stock}
                                                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Image URL</Label>
                                                <Input
                                                    placeholder="https://..."
                                                    value={productForm.imageUrl}
                                                    onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2 h-full">
                                                <Label>Description</Label>
                                                <textarea
                                                    className="w-full min-h-[120px] rounded-md border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                                    placeholder="Product description..."
                                                    value={productForm.description}
                                                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <Button onClick={createProduct}>
                                            Save Product
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid md:grid-cols-3 gap-6">
                            {products.map(product => (
                                <Card key={product.id} className="overflow-hidden border-gray-200">
                                    <div className="h-48 bg-gray-100 relative group">
                                        <img src={product.imageUrl || 'https://via.placeholder.com/400x300'} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="destructive" size="sm" onClick={() => deleteProduct(product.id)}>
                                                Delete Product
                                            </Button>
                                        </div>
                                    </div>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                            <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">Stock: {product.stock}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">{product.description}</p>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            <span className="font-medium text-gray-900">₹{product.price}</span>
                                            <span className="text-xs text-gray-500 font-medium">{product.bv} BV</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {tab === 'users' && (
                    <Card className="border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">User Details</th>
                                        <th className="px-6 py-4">Business Volume</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{user.username}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-4">
                                                    <div>
                                                        <span className="text-xs text-gray-400 block uppercase">Left</span>
                                                        <span className="font-mono text-gray-700">{user.leftBV}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-gray-400 block uppercase">Right</span>
                                                        <span className="font-mono text-gray-700">{user.rightBV}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isBlocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                                    </span>
                                                    {user.fraudFlag && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                                                            Flagged
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant={user.isBlocked ? "outline" : "ghost"}
                                                    size="sm"
                                                    onClick={() => toggleBlockUser(user.id, user.isBlocked)}
                                                    className={user.isBlocked ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" : "text-gray-500 hover:text-red-600 hover:bg-red-50"}
                                                >
                                                    {user.isBlocked ? 'Unblock User' : 'Block Access'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Withdrawals Tab */}
                {tab === 'withdrawals' && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Withdrawals System</h3>
                        <p className="text-gray-500 max-w-sm mt-2">This module is currently under development. Check back later for updates.</p>
                    </div>
                )}
            </div>
        </main>
    )
}
