import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, adminLogout } from '../lib/auth';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdminTreeView from '../components/AdminTreeView';

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
    const [analytics, setAnalytics] = useState(null);
    const [networkUsers, setNetworkUsers] = useState([]);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '', price: 0, bv: 0, stock: 0, description: '', imageUrl: '',
        directBonus: 3000, matchingBonus: 2000, dailyCap: 40000, taxPercent: 5, adminChargePercent: 5
    });
    const [graphFilter, setGraphFilter] = useState('months'); // 'months' or 'days'
    const [selectedPeriod, setSelectedPeriod] = useState(null); // selected month or day for detailed stats

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
            } else if (tab === 'analytics') {
                const res = await api.get('/api/admin/analytics/stats');
                setAnalytics(res.data.stats || null);
            } else if (tab === 'network') {
                const res = await api.get('/api/admin/analytics/network');
                setNetworkUsers(res.data.users || []);
            }
        } catch (err) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const createProduct = async () => {
        try {
            if (editingProduct) {
                await api.put(`/api/admin/products/${editingProduct.id}`, productForm);
                toast.success('Product updated');
            } else {
                await api.post('/api/admin/products', productForm);
                toast.success('Product created');
            }
            closeProductModal();
            fetchData();
        } catch (err) {
            toast.error(editingProduct ? 'Failed to update product' : 'Failed to create product');
        }
    };

    const openEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            price: product.price,
            bv: product.bv,
            stock: product.stock,
            description: product.description || '',
            imageUrl: product.imageUrl || '',
            directBonus: product.directBonus ?? 3000,
            matchingBonus: product.matchingBonus ?? 2000,
            dailyCap: product.dailyCap ?? 40000,
            taxPercent: product.taxPercent ?? 5,
            adminChargePercent: product.adminChargePercent ?? 5
        });
        setShowProductForm(true);
    };

    const closeProductModal = () => {
        setShowProductForm(false);
        setEditingProduct(null);
        setProductForm({ name: '', price: 0, bv: 0, stock: 0, description: '', imageUrl: '', directBonus: 3000, matchingBonus: 2000, dailyCap: 40000, taxPercent: 5, adminChargePercent: 5 });
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
                        {['analytics', 'products', 'users', 'network', 'positions', 'withdrawals'].map((t) => (
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
                        {/* Analytics Tab */}
                        {tab === 'analytics' && analytics && (
                            <div className="space-y-6">
                                {/* User Trends Chart - Moved to top with filter */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-gray-900">User Signups</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setGraphFilter('months'); setSelectedPeriod(null); }}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${graphFilter === 'months' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                Months
                                            </button>
                                            <button
                                                onClick={() => { setGraphFilter('days'); setSelectedPeriod(null); }}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${graphFilter === 'days' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                Days
                                            </button>
                                        </div>
                                    </div>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={graphFilter === 'months' ? (analytics.trends?.monthlyUsers || []) : (analytics.trends?.dailyUsers || [])}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorUsersMain" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                                <XAxis dataKey={graphFilter === 'months' ? 'month' : 'date'} tick={{ fontSize: 11 }} stroke="#999" axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 11 }} stroke="#999" axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="count"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2}
                                                    fill="url(#colorUsersMain)"
                                                    name="Users"
                                                    activeDot={{
                                                        r: 8,
                                                        style: { cursor: 'pointer' },
                                                        onClick: (e, payload) => {
                                                            if (payload && payload.payload) {
                                                                setSelectedPeriod(payload.payload);
                                                            }
                                                        }
                                                    }}
                                                    dot={{ r: 4, fill: '#8b5cf6', style: { cursor: 'pointer' } }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* Stats Panel - Always visible */}
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium text-gray-900">
                                                {selectedPeriod
                                                    ? `${selectedPeriod.month || selectedPeriod.date} Stats`
                                                    : 'Lifetime Stats'
                                                }
                                            </h4>
                                            {selectedPeriod && (
                                                <button onClick={() => setSelectedPeriod(null)} className="text-indigo-600 text-sm hover:underline">
                                                    Show Lifetime
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="bg-white p-3 rounded-lg text-center border border-gray-100">
                                                <p className="text-lg font-bold text-orange-600">
                                                    ₹{selectedPeriod
                                                        ? (selectedPeriod.directBonus || 0).toLocaleString()
                                                        : (analytics.financial?.bonusTotals?.find(b => b.type === 'DIRECT_BONUS')?.total || 0).toLocaleString()
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500">Direct Referral</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg text-center border border-gray-100">
                                                <p className="text-lg font-bold text-green-600">
                                                    ₹{selectedPeriod
                                                        ? (selectedPeriod.matchingBonus || 0).toLocaleString()
                                                        : (analytics.financial?.bonusTotals?.find(b => b.type === 'MATCHING_BONUS')?.total || 0).toLocaleString()
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500">Matching Bonus</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg text-center border border-gray-100">
                                                <p className="text-lg font-bold text-purple-600">
                                                    ₹{selectedPeriod
                                                        ? (selectedPeriod.leadershipBonus || 0).toLocaleString()
                                                        : (analytics.financial?.bonusTotals?.find(b => b.type === 'LEADERSHIP_BONUS')?.total || 0).toLocaleString()
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500">Leadership Bonus</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg text-center border border-gray-100">
                                                <p className="text-lg font-bold text-blue-600">
                                                    {selectedPeriod
                                                        ? (selectedPeriod.orders || 0)
                                                        : (analytics.orders?.total || 0)
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500">Orders</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats List - Text based with colored bars */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-gray-900">User Statistics</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-1.5 bg-indigo-500 rounded-full"></div>
                                                <span className="text-gray-700">Total Users</span>
                                            </div>
                                            <span className="font-bold text-gray-900">{analytics.users?.total || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-1.5 bg-green-500 rounded-full"></div>
                                                <span className="text-gray-700">Today</span>
                                            </div>
                                            <span className="font-bold text-green-600">+{analytics.users?.today || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-1.5 bg-blue-500 rounded-full"></div>
                                                <span className="text-gray-700">This Week</span>
                                            </div>
                                            <span className="font-bold text-blue-600">{analytics.users?.thisWeek || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-1.5 bg-purple-500 rounded-full"></div>
                                                <span className="text-gray-700">This Month</span>
                                            </div>
                                            <span className="font-bold text-purple-600">{analytics.users?.thisMonth || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-1.5 bg-emerald-500 rounded-full"></div>
                                                <span className="text-gray-700">Active (Purchased)</span>
                                            </div>
                                            <span className="font-bold text-emerald-600">{analytics.users?.active || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-1.5 bg-amber-500 rounded-full"></div>
                                                <span className="text-gray-700">Pending Purchase</span>
                                            </div>
                                            <span className="font-bold text-amber-600">{analytics.users?.pending || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Position Distribution & KYC Stats */}
                                <div className="grid lg:grid-cols-2 gap-6">
                                    {/* Position Distribution */}
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                            </svg>
                                            Position Distribution
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-4 bg-blue-50 rounded-xl">
                                                <p className="text-3xl font-bold text-blue-600">{analytics.positions?.LEFT || 0}</p>
                                                <p className="text-sm text-gray-600 mt-1">Left</p>
                                            </div>
                                            <div className="text-center p-4 bg-purple-50 rounded-xl">
                                                <p className="text-3xl font-bold text-purple-600">{analytics.positions?.RIGHT || 0}</p>
                                                <p className="text-sm text-gray-600 mt-1">Right</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KYC Status */}
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            KYC Status
                                        </h3>
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                                                <p className="text-xl font-bold text-gray-600">{analytics.kyc?.NOT_STARTED || 0}</p>
                                                <p className="text-xs text-gray-500 mt-1">Not Started</p>
                                            </div>
                                            <div className="text-center p-3 bg-yellow-50 rounded-xl">
                                                <p className="text-xl font-bold text-yellow-600">{analytics.kyc?.IN_PROGRESS || 0}</p>
                                                <p className="text-xs text-gray-500 mt-1">In Progress</p>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-xl">
                                                <p className="text-xl font-bold text-green-600">{analytics.kyc?.VERIFIED || 0}</p>
                                                <p className="text-xs text-gray-500 mt-1">Verified</p>
                                            </div>
                                            <div className="text-center p-3 bg-red-50 rounded-xl">
                                                <p className="text-xl font-bold text-red-600">{analytics.kyc?.FAILED || 0}</p>
                                                <p className="text-xs text-gray-500 mt-1">Failed</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Overview */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Financial Overview
                                    </h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-4 bg-orange-50 rounded-xl">
                                            <p className="text-xs text-gray-500">Direct Bonus</p>
                                            <p className="text-xl font-bold text-orange-600 mt-1">₹{(analytics.financial?.bonusTotals?.find(b => b.type === 'DIRECT_BONUS')?.total || 0).toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">{analytics.financial?.bonusTotals?.find(b => b.type === 'DIRECT_BONUS')?.count || 0} transactions</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-xl">
                                            <p className="text-xs text-gray-500">Matching Bonus</p>
                                            <p className="text-xl font-bold text-green-600 mt-1">₹{(analytics.financial?.bonusTotals?.find(b => b.type === 'MATCHING_BONUS')?.total || 0).toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">{analytics.financial?.bonusTotals?.find(b => b.type === 'MATCHING_BONUS')?.count || 0} transactions</p>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-xl">
                                            <p className="text-xs text-gray-500">Today's Bonuses</p>
                                            <p className="text-xl font-bold text-blue-600 mt-1">₹{(analytics.financial?.todayBonuses || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="p-4 bg-purple-50 rounded-xl">
                                            <p className="text-xs text-gray-500">This Month</p>
                                            <p className="text-xl font-bold text-purple-600 mt-1">₹{(analytics.financial?.monthBonuses || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Withdrawals & Orders */}
                                <div className="grid lg:grid-cols-2 gap-6">
                                    {/* Withdrawals */}
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                        <h3 className="font-semibold text-gray-900 mb-4">Withdrawal Summary</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            {analytics.financial?.withdrawals?.length > 0 ? (
                                                analytics.financial.withdrawals.map(w => (
                                                    <div key={w.status} className={`text-center p-4 rounded-xl ${w.status === 'APPROVED' ? 'bg-green-50' : w.status === 'PENDING' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                                                        <p className={`text-xl font-bold ${w.status === 'APPROVED' ? 'text-green-600' : w.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            ₹{(w.total || 0).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">{w.status}</p>
                                                        <p className="text-xs text-gray-400">{w.count} requests</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-3 text-center py-8 text-gray-400">
                                                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                    <p className="text-sm">No withdrawal history yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Orders/Revenue */}
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                        <h3 className="font-semibold text-gray-900 mb-4">Orders & Revenue</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                                                <p className="text-xs opacity-80">Total Revenue</p>
                                                <p className="text-2xl font-bold mt-1">₹{(analytics.orders?.totalRevenue || 0).toLocaleString()}</p>
                                                <p className="text-xs opacity-80 mt-1">{analytics.orders?.total || 0} orders</p>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="p-3 bg-gray-50 rounded-xl">
                                                    <p className="text-lg font-bold text-gray-900">₹{(analytics.orders?.monthRevenue || 0).toLocaleString()}</p>
                                                    <p className="text-xs text-gray-500">This Month ({analytics.orders?.thisMonth || 0} orders)</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-xl">
                                                    <p className="text-lg font-bold text-gray-900">{analytics.orders?.today || 0}</p>
                                                    <p className="text-xs text-gray-500">Orders Today</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Products Alert */}
                                {analytics.products?.lowStock > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-amber-800">Low Stock Alert</p>
                                            <p className="text-sm text-amber-600">{analytics.products.lowStock} products have less than 10 items in stock</p>
                                        </div>
                                    </div>
                                )}

                                {/* Ranks Distribution */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <h3 className="font-semibold text-gray-900 mb-4">Users by Rank</h3>
                                    <div className="space-y-3">
                                        {(analytics.ranks || []).map(r => {
                                            const percentage = analytics.users?.total ? (r.count / analytics.users.total) * 100 : 0;
                                            const colors = {
                                                'ROOKIE': 'bg-gray-400', 'Rookie': 'bg-gray-400',
                                                'ASSOCIATE_EXECUTIVE': 'bg-blue-400', 'Associate Executive': 'bg-blue-400',
                                                'TEAM_EXECUTIVE': 'bg-green-400', 'Team Executive': 'bg-green-400',
                                                'SR_TEAM_EXECUTIVE': 'bg-yellow-400', 'Sr Team Executive': 'bg-yellow-400',
                                                'AREA_EXECUTIVE': 'bg-orange-400', 'Area Executive': 'bg-orange-400',
                                                'REGIONAL_EXECUTIVE': 'bg-red-400', 'Regional Executive': 'bg-red-400',
                                                'STATE_EXECUTIVE': 'bg-purple-400', 'State Executive': 'bg-purple-400',
                                                'VP': 'bg-pink-400'
                                            };
                                            return (
                                                <div key={r.rank} className="flex items-center gap-4">
                                                    <span className="text-sm text-gray-600 w-40 truncate">{r.rank?.replace(/_/g, ' ') || 'Unknown'}</span>
                                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${colors[r.rank] || 'bg-indigo-400'} rounded-full transition-all`} style={{ width: `${Math.max(percentage, 3)}%` }}></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{r.count}</span>
                                                    <span className="text-xs text-gray-500 w-12">{percentage.toFixed(0)}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Network Tab */}
                        {tab === 'network' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-900">Network Tree ({networkUsers.length} members)</h2>
                                </div>

                                {/* Network Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                                        <p className="text-3xl font-bold text-gray-900">{networkUsers.filter(u => u.hasPurchased).length}</p>
                                        <p className="text-sm text-gray-500">Active (Purchased)</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                                        <p className="text-3xl font-bold text-blue-600">{networkUsers.filter(u => u.position === 'LEFT').length}</p>
                                        <p className="text-sm text-gray-500">Left Position</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                                        <p className="text-3xl font-bold text-purple-600">{networkUsers.filter(u => u.position === 'RIGHT').length}</p>
                                        <p className="text-sm text-gray-500">Right Position</p>
                                    </div>
                                </div>

                                {/* Network Tree Visualization */}
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    <div className="mb-4 text-sm text-gray-500">
                                        Click nodes to view details. Expand/collapse with the arrow button.
                                    </div>
                                    {(() => {
                                        // Build tree from flat user list
                                        const buildTree = (users) => {
                                            if (!users || users.length === 0) return null;

                                            // Create a map of users by id
                                            const userMap = {};
                                            users.forEach(u => {
                                                userMap[u.id] = { ...u, left: null, right: null };
                                            });

                                            // Find root (user with no parent or first user)
                                            let root = null;
                                            users.forEach(u => {
                                                if (!u.parentId || !userMap[u.parentId]) {
                                                    if (!root) root = userMap[u.id];
                                                }
                                            });

                                            // Build tree relationships
                                            users.forEach(u => {
                                                if (u.parentId && userMap[u.parentId]) {
                                                    const parent = userMap[u.parentId];
                                                    if (u.position === 'LEFT') {
                                                        parent.left = userMap[u.id];
                                                    } else if (u.position === 'RIGHT') {
                                                        parent.right = userMap[u.id];
                                                    }
                                                }
                                            });

                                            return root;
                                        };

                                        const treeData = buildTree(networkUsers);

                                        if (!treeData) {
                                            return (
                                                <div className="text-center py-12 text-gray-500">
                                                    No network data available
                                                </div>
                                            );
                                        }

                                        return (
                                            <AdminTreeView
                                                data={treeData}
                                                onNodeClick={(node) => {
                                                    toast.success(`${node.username}: ${node.leftMemberCount || 0} left, ${node.rightMemberCount || 0} right`);
                                                }}
                                            />
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Products Tab */}
                        {tab === 'products' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-900">Inventory Management</h2>
                                    <button
                                        onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: 0, bv: 0, stock: 0, description: '', imageUrl: '', directBonus: 3000, matchingBonus: 2000, dailyCap: 40000, taxPercent: 5, adminChargePercent: 5 }); setShowProductForm(true); }}
                                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors text-sm font-medium"
                                    >
                                        Add Product
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    {products.map((product) => (
                                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                            <div className="h-40 bg-gray-100 relative group">
                                                <img
                                                    src={product.imageUrl || 'https://via.placeholder.com/400x300'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditProduct(product)}
                                                        className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
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
                                                {/* Bonus Info */}
                                                <div className="flex gap-2 mt-2 text-xs">
                                                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">Direct: ₹{product.directBonus ?? 3000}</span>
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Match: ₹{product.matchingBonus ?? 2000}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Product Modal Overlay */}
                                {showProductForm && (
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                                </h3>
                                                <button
                                                    onClick={closeProductModal}
                                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                                    <input
                                                        placeholder="Enter product name"
                                                        value={productForm.name}
                                                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={productForm.price}
                                                            onChange={(e) => setProductForm({ ...productForm, price: +e.target.value })}
                                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">BV</label>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={productForm.bv}
                                                            onChange={(e) => setProductForm({ ...productForm, bv: +e.target.value })}
                                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={productForm.stock}
                                                        onChange={(e) => setProductForm({ ...productForm, stock: +e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                                    <input
                                                        placeholder="https://..."
                                                        value={productForm.imageUrl}
                                                        onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                    <textarea
                                                        placeholder="Product description..."
                                                        value={productForm.description}
                                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                                        rows={3}
                                                    />
                                                </div>

                                                {/* Bonus Configuration Section */}
                                                <div className="pt-4 border-t border-gray-100">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Bonus Configuration</h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Direct Bonus (₹)</label>
                                                            <input
                                                                type="number"
                                                                placeholder="3000"
                                                                value={productForm.directBonus}
                                                                onChange={(e) => setProductForm({ ...productForm, directBonus: +e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Matching Bonus (₹)</label>
                                                            <input
                                                                type="number"
                                                                placeholder="2000"
                                                                value={productForm.matchingBonus}
                                                                onChange={(e) => setProductForm({ ...productForm, matchingBonus: +e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Daily Cap (₹)</label>
                                                            <input
                                                                type="number"
                                                                placeholder="40000"
                                                                value={productForm.dailyCap}
                                                                onChange={(e) => setProductForm({ ...productForm, dailyCap: +e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Tax (%)</label>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="5"
                                                                value={productForm.taxPercent}
                                                                onChange={(e) => setProductForm({ ...productForm, taxPercent: +e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Admin Charge (%)</label>
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="5"
                                                                value={productForm.adminChargePercent}
                                                                onChange={(e) => setProductForm({ ...productForm, adminChargePercent: +e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    onClick={closeProductModal}
                                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={createProduct}
                                                    className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium"
                                                >
                                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Users Tab */}
                        {tab === 'users' && (
                            <div className="space-y-6">

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
                                {/* Header with count */}
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-900">
                                        Position Changes
                                        <span className="ml-2 px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                            {positions.length}
                                        </span>
                                    </h2>
                                </div>

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
