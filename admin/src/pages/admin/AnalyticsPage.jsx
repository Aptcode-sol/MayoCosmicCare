import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';
import { formatIndian } from '../../utils/formatIndian';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [graphFilter, setGraphFilter] = useState('months');
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/admin/analytics/stats');
                setAnalytics(res.data.stats || null);
            } catch (err) {
                toast.error('Failed to fetch analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse mb-8"></div>
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="h-32 bg-gray-100 rounded-xl mb-6"></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="h-24 bg-gray-100 rounded-xl"></div>
                            <div className="h-24 bg-gray-100 rounded-xl"></div>
                            <div className="h-24 bg-gray-100 rounded-xl"></div>
                        </div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-64 animate-pulse"></div>
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-64 animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center text-gray-500">
                No analytics data available
            </div>
        );
    }

    // Use backend's accurate stats directly
    const derivedTodayOrders = analytics.orders?.today || 0;
    const derivedMonthOrders = analytics.orders?.thisMonth || 0;
    const derivedMonthRevenue = analytics.orders?.monthRevenue || 0;

    return (
        <div className="space-y-6">
            {/* User Statistics */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    User Statistics
                </h3>

                <div className="mb-6 p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                    <p className="text-sm text-indigo-700 font-medium mb-2">Total Users</p>
                    <p className="text-4xl font-bold text-indigo-900">{analytics.users?.total || 0}</p>
                    <p className="text-sm text-indigo-600 mt-2">All registered members in the network</p>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-medium text-gray-600 mb-3">New Users by Period</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                            <p className="text-xs text-green-700 font-medium mb-2">Today</p>
                            <p className="text-2xl font-bold text-green-600">+{analytics.users?.today || 0}</p>
                            <p className="text-xs text-green-600 mt-1">Added today</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-xs text-blue-700 font-medium mb-2">This Week</p>
                            <p className="text-2xl font-bold text-blue-600">{analytics.users?.thisWeek || 0}</p>
                            <p className="text-xs text-blue-600 mt-1">Last 7 days</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <p className="text-xs text-purple-700 font-medium mb-2">Last 30 days</p>
                            <p className="text-2xl font-bold text-purple-600">{analytics.users?.thisMonth || 0}</p>
                            <p className="text-xs text-purple-600 mt-1">Last 30 days</p>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium text-gray-600 mb-3">User Status</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                            <p className="text-xs text-emerald-700 font-medium mb-2">Active (Purchased)</p>
                            <p className="text-2xl font-bold text-emerald-600">{analytics.users?.active || 0}</p>
                            <p className="text-xs text-emerald-600 mt-1">Completed purchase</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <p className="text-xs text-amber-700 font-medium mb-2">Pending Purchase</p>
                            <p className="text-2xl font-bold text-amber-600">{analytics.users?.pending || 0}</p>
                            <p className="text-xs text-amber-600 mt-1">Awaiting first purchase</p>
                        </div>
                    </div>
                </div>

                {analytics.users?.total > 0 && (
                    <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 font-medium">Conversion Rate</span>
                            <span className="text-lg font-bold text-gray-900">
                                {Math.round((analytics.users?.active / analytics.users?.total) * 100)}%
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {analytics.users?.active} active out of {analytics.users?.total} total users
                        </p>
                    </div>
                )}
            </div>

            {/* User Trends Chart */}
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
                            <XAxis
                                dataKey={graphFilter === 'months' ? 'month' : 'date'}
                                tick={{ fontSize: 11 }}
                                stroke="#999"
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => {
                                    if (graphFilter === 'months') {
                                        const date = new Date(value);
                                        return date.toLocaleString('en-US', { month: 'short' });
                                    }
                                    const date = new Date(value);
                                    return date.getDate().toString();
                                }}
                            />
                            <YAxis tick={{ fontSize: 11 }} stroke="#999" axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => value}
                                labelFormatter={(label) => {
                                    if (graphFilter === 'months') {
                                        const date = new Date(label);
                                        return date.toLocaleString('en-US', { month: 'short' });
                                    }
                                    const date = new Date(label);
                                    const day = date.getDate();
                                    const month = date.toLocaleString('en-US', { month: 'short' });
                                    const ordinal = ['st', 'nd', 'rd'][((day + 90) % 10 - 1) % 3] || 'th';
                                    return `${month} ${day}${ordinal}`;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fill="url(#colorUsersMain)"
                                name="Users"
                                activeDot={{
                                    r: 8,
                                    style: { cursor: 'pointer', outline: 'none' },
                                    onClick: (e, payload) => {
                                        if (payload && payload.payload) {
                                            setSelectedPeriod(payload.payload);
                                        }
                                    }
                                }}
                                dot={{ r: 4, fill: '#8b5cf6', style: { cursor: 'pointer', outline: 'none' } }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg text-center border border-gray-100">
                            <p className="text-lg font-bold text-orange-600">
                                {formatIndian(selectedPeriod
                                    ? (selectedPeriod.directBonus || 0)
                                    : (analytics.financial?.bonusTotals?.find(b => b.type === 'DIRECT_BONUS')?.total || 0)
                                )}
                            </p>
                            <p className="text-xs text-gray-500">Direct Referral</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center border border-gray-100">
                            <p className="text-lg font-bold text-green-600">
                                {formatIndian(selectedPeriod
                                    ? (selectedPeriod.matchingBonus || 0)
                                    : (analytics.financial?.bonusTotals?.find(b => b.type === 'MATCHING_BONUS')?.total || 0)
                                )}
                            </p>
                            <p className="text-xs text-gray-500">Matching Bonus</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center border border-gray-100">
                            <p className="text-lg font-bold text-purple-600">
                                {formatIndian(selectedPeriod
                                    ? (selectedPeriod.leadershipBonus || 0)
                                    : (analytics.financial?.bonusTotals?.find(b => b.type === 'LEADERSHIP_BONUS')?.total || 0)
                                )}
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
                            <p className="text-xs text-gray-500">Purchases</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Position Distribution & KYC */}
            <div className="grid lg:grid-cols-2 gap-6">
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

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        KYC Status
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                        <p className="text-xl font-bold text-orange-600 mt-1">{formatIndian(analytics.financial?.bonusTotals?.find(b => b.type === 'DIRECT_BONUS')?.total || 0)}</p>
                        <p className="text-xs text-gray-400">{analytics.financial?.bonusTotals?.find(b => b.type === 'DIRECT_BONUS')?.count || 0} transactions</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                        <p className="text-xs text-gray-500">Matching Bonus</p>
                        <p className="text-xl font-bold text-green-600 mt-1">{formatIndian(analytics.financial?.bonusTotals?.find(b => b.type === 'MATCHING_BONUS')?.total || 0)}</p>
                        <p className="text-xs text-gray-400">{analytics.financial?.bonusTotals?.find(b => b.type === 'MATCHING_BONUS')?.count || 0} transactions</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                        <p className="text-xs text-gray-500">Leadership Bonus</p>
                        <p className="text-xl font-bold text-purple-600 mt-1">{formatIndian(analytics.financial?.bonusTotals?.find(b => b.type === 'LEADERSHIP_BONUS')?.total || 0)}</p>
                        <p className="text-xs text-gray-400">{analytics.financial?.bonusTotals?.find(b => b.type === 'LEADERSHIP_BONUS')?.count || 0} transactions</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-xs text-gray-500">Today's Bonuses</p>
                        <p className="text-xl font-bold text-blue-600 mt-1">{formatIndian(analytics.financial?.todayBonuses || 0)}</p>
                    </div>
                </div>
            </div>

            {/* Withdrawals & Orders */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">Withdrawal Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {analytics.financial?.withdrawals?.length > 0 ? (
                            analytics.financial.withdrawals.map(w => (
                                <div key={w.status} className={`text-center p-4 rounded-xl ${w.status === 'APPROVED' ? 'bg-green-50' : w.status === 'PENDING' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                                    <p className={`text-xl font-bold ${w.status === 'APPROVED' ? 'text-green-600' : w.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {formatIndian(w.total || 0)}
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

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">Orders & Revenue</h3>
                    <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                            <p className="text-xs opacity-80">Total Revenue</p>
                            <p className="text-2xl font-bold mt-1">{formatIndian(analytics.orders?.totalRevenue || 0)}</p>
                            <p className="text-xs opacity-80 mt-1">{analytics.orders?.total || 0} orders</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-lg font-bold text-gray-900">{formatIndian(derivedMonthRevenue ?? 0)}</p>
                                <p className="text-xs text-gray-500">This Month ({derivedMonthOrders ?? 0} orders)</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-lg font-bold text-gray-900">{derivedTodayOrders ?? 0}</p>
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
                    {(() => {
                        const rankOrder = ['ROOKIE', 'ASSOCIATE_EXECUTIVE', 'TEAM_EXECUTIVE', 'SR_TEAM_EXECUTIVE', 'AREA_EXECUTIVE', 'REGIONAL_EXECUTIVE', 'STATE_EXECUTIVE', 'VP'];
                        const sortedRanks = (analytics.ranks || []).sort((a, b) => {
                            const indexA = rankOrder.indexOf(a.rank);
                            const indexB = rankOrder.indexOf(b.rank);
                            return (indexA === -1 ? rankOrder.length : indexA) - (indexB === -1 ? rankOrder.length : indexB);
                        });

                        return sortedRanks.map(r => {
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
                        });
                    })()}
                </div>
            </div>
        </div>
    );
}
