"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../../lib/api'
import { adminProducts, setSponsor } from '../../../lib/services/admin'

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
        <main className="min-h-screen bg-gray-50">
            <nav className="bg-purple-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                    <a href="/dashboard" className="px-4 py-2 bg-white text-purple-600 rounded hover:bg-gray-100">Back to Dashboard</a>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b">
                    <button
                        onClick={() => setTab('products')}
                        className={`px-4 py-2 font-medium ${tab === 'products' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
                    >
                        Products
                    </button>
                    <button
                        onClick={() => setTab('users')}
                        className={`px-4 py-2 font-medium ${tab === 'users' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setTab('withdrawals')}
                        className={`px-4 py-2 font-medium ${tab === 'withdrawals' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-600'}`}
                    >
                        Withdrawals
                    </button>
                </div>

                {/* Products Tab */}
                {tab === 'products' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Products</h2>
                            <button
                                onClick={() => setShowProductForm(!showProductForm)}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                                {showProductForm ? 'Cancel' : 'Add Product'}
                            </button>
                        </div>

                        {showProductForm && (
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <h3 className="text-lg font-semibold mb-4">Create New Product</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        className="px-4 py-2 border rounded"
                                        placeholder="Product Name"
                                        value={productForm.name}
                                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        className="px-4 py-2 border rounded"
                                        placeholder="Price (₹)"
                                        value={productForm.price}
                                        onChange={e => setProductForm({ ...productForm, price: parseInt(e.target.value) })}
                                    />
                                    <input
                                        type="number"
                                        className="px-4 py-2 border rounded"
                                        placeholder="Business Volume (BV)"
                                        value={productForm.bv}
                                        onChange={e => setProductForm({ ...productForm, bv: parseInt(e.target.value) })}
                                    />
                                    <input
                                        type="number"
                                        className="px-4 py-2 border rounded"
                                        placeholder="Stock"
                                        value={productForm.stock}
                                        onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                                    />
                                    <input
                                        className="px-4 py-2 border rounded col-span-2"
                                        placeholder="Image URL"
                                        value={productForm.imageUrl}
                                        onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                                    />
                                    <textarea
                                        className="px-4 py-2 border rounded col-span-2"
                                        placeholder="Description"
                                        rows={3}
                                        value={productForm.description}
                                        onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={createProduct}
                                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Create Product
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                                    <img src={product.imageUrl || 'https://via.placeholder.com/400x300'} alt={product.name} className="w-full h-48 object-cover" />
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold">{product.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                                        <div className="mt-3 flex justify-between text-sm">
                                            <span className="font-semibold">₹{product.price}</span>
                                            <span className="text-blue-600">BV: {product.bv}</span>
                                        </div>
                                        <div className="mt-2 flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                                            <button
                                                onClick={() => deleteProduct(product.id)}
                                                className="text-sm text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {tab === 'users' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Users</h2>
                        <div className="bg-white rounded-lg shadow overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Username</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Left BV</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Right BV</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-3">{user.username}</td>
                                            <td className="px-4 py-3 text-sm">{user.email}</td>
                                            <td className="px-4 py-3">{user.leftBV}</td>
                                            <td className="px-4 py-3">{user.rightBV}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs rounded ${user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {user.isBlocked ? 'Blocked' : 'Active'}
                                                </span>
                                                {user.fraudFlag && (
                                                    <span className="ml-2 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Fraud Flag</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleBlockUser(user.id, user.isBlocked)}
                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    {user.isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Withdrawals Tab */}
                {tab === 'withdrawals' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Pending Withdrawals</h2>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-gray-600">Withdrawal management coming soon...</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
