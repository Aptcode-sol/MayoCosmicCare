import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, adminLogout } from '../lib/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [rankStats, setRankStats] = useState([]);
    const [positions, setPositions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [positionFilter, setPositionFilter] = useState('all');
    const [rewardedFilter, setRewardedFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showProductForm, setShowProductForm] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '', price: 0, bv: 0, stock: 0, description: '', imageUrl: ''
    });

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/');
            return;
        }
        fetchData();
    }, [tab, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (tab === 'products') {
                const res = await api.get('/api/admin/products');
                setProducts(res.data.products || []);
            } else if (tab === 'users') {
                const res = await api.get('/api/admin/users');
                setUsers(res.data.users || []);
                try {
                    const rankRes = await api.get('/api/admin/users/stats/ranks');
                    setRankStats(rankRes.data.stats || []);
                } catch (e) { console.warn('Failed to fetch rank stats', e); }
            } else if (tab === 'positions') {
                const params = new URLSearchParams();
                if (positionFilter !== 'all') params.append('rank', positionFilter);
                if (rewardedFilter !== 'all') params.append('rewarded', rewardedFilter);
                const res = await api.get(`/api/admin/positions?${params.toString()}`);
                setPositions(res.data.rankChanges || []);
            } else if (tab === 'withdrawals') {
                const res = await api.get('/api/payouts/admin/list');
                setWithdrawals(res.data.withdrawals || []);
            }
        } catch (err) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const createProduct = async () => {
        try {
            await api.post('/api/admin/products', productForm);
            toast.success('Product created');
            setShowProductForm(false);
            setProductForm({ name: '', price: 0, bv: 0, stock: 0, description: '', imageUrl: '' });
            fetchData();
        } catch (err) {
            toast.error('Failed to create product');
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm('Delete this product?')) return;
        try {
            await api.delete(`/api/admin/products/${id}`);
            toast.success('Product deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete product');
        }
    };

    const toggleBlockUser = async (userId, currentStatus) => {
        try {
            await api.patch(`/api/admin/users/${userId}/block`, { isBlocked: !currentStatus });
            toast.success(currentStatus ? 'User unblocked' : 'User blocked');
            fetchData();
        } catch (err) {
            toast.error('Failed to update user');
        }
    };

    const approveWithdrawal = async (id) => {
        if (!confirm('Approve payout? Funds will be transferred immediately via Cashfree.')) return;
        try {
            toast.loading('Processing payout...');
            await api.post(`/api/payouts/approve/${id}`);
            toast.dismiss();
            toast.success('Payout approved & initiated');
            fetchData();
        } catch (err) {
            toast.dismiss();
            toast.error(err.response?.data?.error || 'Approval failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Admin Console</h1>
                        <p className="text-gray-500 text-sm">Manage products and users</p>
                    </div>
                    <button
                        onClick={adminLogout}
                        className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors text-sm font-medium"
                    >
                        Logout
                    </button>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-6 border-t border-gray-100">
                    <div className="flex gap-1">
                        {['products', 'users', 'positions', 'withdrawals'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-6 py-3 text-sm font-medium transition-all relative ${tab === t ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                                {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Products Tab */}
                        {tab === 'products' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-900">Inventory Management</h2>
                                    <button
                                        onClick={() => setShowProductForm(!showProductForm)}
                                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors text-sm font-medium"
                                    >
                                        {showProductForm ? 'Cancel' : 'Add Product'}
                                    </button>
                                </div>

                                {showProductForm && (
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                        <h3 className="text-gray-900 font-medium mb-4">Create New Product</h3>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <input
                                                placeholder="Product Name"
                                                value={productForm.name}
                                                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={productForm.price}
                                                onChange={(e) => setProductForm({ ...productForm, price: +e.target.value })}
                                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                            />
                                            <input
                                                type="number"
                                                placeholder="BV"
                                                value={productForm.bv}
                                                onChange={(e) => setProductForm({ ...productForm, bv: +e.target.value })}
                                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Stock"
                                                value={productForm.stock}
                                                onChange={(e) => setProductForm({ ...productForm, stock: +e.target.value })}
                                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                            />
                                            <input
                                                placeholder="Image URL"
                                                value={productForm.imageUrl}
                                                onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 col-span-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                            />
                                            <textarea
                                                placeholder="Description"
                                                value={productForm.description}
                                                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 col-span-2 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                                rows={3}
                                            />
                                        </div>
                                        <button
                                            onClick={createProduct}
                                            className="mt-4 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium"
                                        >
                                            Save Product
                                        </button>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-3 gap-6">
                                    {products.map((product) => (
                                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                            <div className="h-40 bg-gray-100 relative group">
                                                <img
                                                    src={product.imageUrl || 'https://via.placeholder.com/400x300'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => deleteProduct(product.id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                                                        Stock: {product.stock}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                                                <div className="flex justify-between text-sm border-t border-gray-50 pt-3">
                                                    <span className="text-gray-900 font-medium">₹{product.price}</span>
                                                    <span className="text-gray-500">{product.bv} BV</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Users Tab */}
                        {tab === 'users' && (
                            <div className="space-y-6">
                                {/* Rank Distribution Stats */}
                                {rankStats.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {rankStats.map((stat) => (
                                            <div key={stat.rank} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                <div className="text-gray-500 text-xs uppercase font-medium tracking-wider mb-1">{stat.rank}</div>
                                                <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-4 text-left">User</th>
                                                <th className="px-6 py-4 text-left">BV</th>
                                                <th className="px-6 py-4 text-left">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {users.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4">
                                                        <div className="text-gray-900 font-medium">{user.username}</div>
                                                        <div className="text-gray-500 text-xs">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        L: {user.leftBV} / R: {user.rightBV}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.isBlocked
                                                            ? 'bg-red-50 text-red-700'
                                                            : 'bg-emerald-50 text-emerald-700'
                                                            }`}>
                                                            {user.isBlocked ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => toggleBlockUser(user.id, user.isBlocked)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${user.isBlocked
                                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                                }`}
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

                        {/* Positions Tab */}
                        {tab === 'positions' && (
                            <div className="space-y-6">
                                {/* Filters */}
                                <div className="flex flex-wrap gap-4">
                                    <select
                                        value={positionFilter}
                                        onChange={(e) => { setPositionFilter(e.target.value); }}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    >
                                        <option value="all">All Positions</option>
                                        <option value="Associate Executive">Associate Executive</option>
                                        <option value="Senior Associate">Senior Associate</option>
                                        <option value="Team Leader">Team Leader</option>
                                        <option value="Senior Team Leader">Senior Team Leader</option>
                                        <option value="Assistant Manager">Assistant Manager</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Senior Manager">Senior Manager</option>
                                        <option value="Regional Manager">Regional Manager</option>
                                        <option value="Director">Director</option>
                                        <option value="National Director">National Director</option>
                                    </select>
                                    <select
                                        value={rewardedFilter}
                                        onChange={(e) => { setRewardedFilter(e.target.value); }}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending Reward</option>
                                        <option value="rewarded">Rewarded</option>
                                    </select>
                                    <button
                                        onClick={fetchData}
                                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium"
                                    >
                                        Apply Filters
                                    </button>
                                </div>

                                {/* Positions Table */}
                                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-4 text-left">User</th>
                                                <th className="px-6 py-4 text-left">From</th>
                                                <th className="px-6 py-4 text-left">To</th>
                                                <th className="px-6 py-4 text-left">Pairs</th>
                                                <th className="px-6 py-4 text-left">Date</th>
                                                <th className="px-6 py-4 text-center">Rewarded</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {positions.length > 0 ? positions.map((pos) => (
                                                <tr key={pos.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4">
                                                        <div className="text-gray-900 font-medium">{pos.user?.username}</div>
                                                        <div className="text-gray-500 text-xs">{pos.user?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{pos.fromRank}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                                            {pos.toRank}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 font-mono">{pos.pairsAtChange}</td>
                                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                                        {new Date(pos.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={pos.rewarded}
                                                            onChange={async (e) => {
                                                                try {
                                                                    await api.patch(`/api/admin/positions/${pos.id}/reward`, { rewarded: e.target.checked });
                                                                    toast.success(e.target.checked ? 'Marked as rewarded' : 'Unmarked');
                                                                    fetchData();
                                                                } catch (err) {
                                                                    toast.error('Failed to update');
                                                                }
                                                            }}
                                                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                        No position changes found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Withdrawals Tab */}
                        {tab === 'withdrawals' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-medium text-gray-900">Withdrawal Requests</h2>
                                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-4 text-left">User</th>
                                                <th className="px-6 py-4 text-left">Amount</th>
                                                <th className="px-6 py-4 text-left">Bank Details</th>
                                                <th className="px-6 py-4 text-left">Date</th>
                                                <th className="px-6 py-4 text-left">Status</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {withdrawals.length > 0 ? withdrawals.map((w) => {
                                                const details = w.bankDetails ? JSON.parse(w.bankDetails) : {};
                                                return (
                                                    <tr key={w.id} className="hover:bg-gray-50/50">
                                                        <td className="px-6 py-4">
                                                            <div className="text-gray-900 font-medium">{w.user?.username}</div>
                                                            <div className="text-gray-500 text-xs">{w.user?.phone}</div>
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-gray-900">₹{w.amount}</td>
                                                        <td className="px-6 py-4 text-xs text-gray-600">
                                                            <div>{details.name}</div>
                                                            {details.vpa ? (
                                                                <div className="font-mono text-indigo-600">{details.vpa} (UPI)</div>
                                                            ) : (
                                                                <>
                                                                    <div className="font-mono">{details.accountInfo?.bankAccount}</div>
                                                                    <div className="font-mono">{details.accountInfo?.ifsc}</div>
                                                                </>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                                            {new Date(w.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${w.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                                w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {w.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {w.status === 'PENDING' && (
                                                                <button
                                                                    onClick={() => approveWithdrawal(w.id)}
                                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium"
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}
                                                            {w.status === 'APPROVED' && (
                                                                <span className="text-xs text-green-600 font-medium">Processed</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                        No withdrawal requests found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div >
    );
}
