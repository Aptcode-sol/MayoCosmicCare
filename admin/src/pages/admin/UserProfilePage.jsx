import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { formatIndian } from '../../utils/formatIndian';
import { SkeletonCard } from '../../components/SkeletonCard';

export default function UserProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/api/admin/users/${id}`);
                setData(res.data);
            } catch (err) {
                toast.error('Failed to load user profile');
                navigate('/dashboard/users');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-28 bg-white rounded-xl border border-gray-100" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonCard className="h-64 bg-white rounded-xl border border-gray-100" />
                    <SkeletonCard className="h-64 bg-white rounded-xl border border-gray-100" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { user, teamStats, earnings, recentTransactions, recentOrders } = data;
    const status = user.isBlocked ? 'Blocked' : user.hasPurchased ? 'Active' : 'Inactive';
    const statusColor = user.isBlocked ? 'bg-red-50 text-red-700' : user.hasPurchased ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';

    return (
        <div className="space-y-8">
            {/* Back button + Header */}
            <div>
                <button
                    onClick={() => navigate('/dashboard/users')}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Users
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{user.username}</h1>
                        {user.name && <p className="text-gray-600 mt-0.5">{user.name}</p>}
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>{status}</span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{user.rank}</span>
                            {user.fraudFlag && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">⚠ Fraud Flag</span>}
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* User Info Cards */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoCard label="Email" value={user.email} />
                    <InfoCard label="Phone" value={user.phone || 'N/A'} />
                    <InfoCard label="User ID" value={user.id} mono />
                    <InfoCard label="Placement Parent" value={user.parent?.username || 'Root'} subtext={user.position ? `(${user.position})` : ''} />
                </div>
            </div>

            {/* Referred By Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Referred By (Sponsor)</h3>
                {user.sponsor ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InfoCard label="Username" value={user.sponsor.username} link onClick={() => navigate(`/dashboard/users/${user.sponsor.id}`)} />
                        <InfoCard label="Name" value={user.sponsor.name || 'N/A'} />
                        <InfoCard label="Email" value={user.sponsor.email} />
                        <InfoCard label="Phone" value={user.sponsor.phone || 'N/A'} />
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">No sponsor (root user)</p>
                )}
            </div>

            {/* Wallet & Earnings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Wallet Balance" value={formatIndian(user.walletBalance)} highlight />
                <StatCard label="Total Earnings" value={formatIndian(earnings.totalEarnings)} />
                <StatCard label="Direct Bonus" value={formatIndian(earnings.directBonus)} />
                <StatCard label="Matching Bonus" value={formatIndian(earnings.matchingBonus)} />
                <StatCard label="Leadership Bonus" value={formatIndian(earnings.leadershipBonus)} />
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Direct Referrals */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <h3 className="text-base font-semibold text-gray-900">Direct Referrals</h3>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-auto">
                            Total: {teamStats.directTeam.total}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <MiniStat label="Left" total={teamStats.directTeam.left} active={teamStats.directTeam.activeLeft} color="indigo" />
                        <MiniStat label="Right" total={teamStats.directTeam.right} active={teamStats.directTeam.activeRight} color="pink" />
                    </div>
                </div>

                {/* Total Team */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        <h3 className="text-base font-semibold text-gray-900">Total Team</h3>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium ml-auto">
                            Total: {teamStats.totalTeam.leftMembers + teamStats.totalTeam.rightMembers}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-indigo-50/50 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Left Leg</p>
                            <p className="text-xl font-semibold text-gray-900">{teamStats.totalTeam.leftMembers}</p>
                            <p className="text-xs text-gray-500">Active: <span className="text-emerald-600 font-medium">{teamStats.totalTeam.activeLeft}</span></p>
                            <p className="text-xs text-gray-500">BV: <span className="font-medium">{formatIndian(teamStats.totalTeam.leftBV)}</span></p>
                        </div>
                        <div className="bg-pink-50/50 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-medium text-pink-600 uppercase tracking-wider">Right Leg</p>
                            <p className="text-xl font-semibold text-gray-900">{teamStats.totalTeam.rightMembers}</p>
                            <p className="text-xs text-gray-500">Active: <span className="text-emerald-600 font-medium">{teamStats.totalTeam.activeRight}</span></p>
                            <p className="text-xs text-gray-500">BV: <span className="font-medium">{formatIndian(teamStats.totalTeam.rightBV)}</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions & Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Type</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentTransactions.length > 0 ? recentTransactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${txTypeColor(tx.type)}`}>
                                                {tx.type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-medium ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {tx.amount >= 0 ? '+' : ''}{formatIndian(tx.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500 text-xs">
                                            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No transactions</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900">Recent Orders</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Product</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentOrders.length > 0 ? recentOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-gray-900">
                                            {order.items.map(it => it.product.name).join(', ') || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                            {formatIndian(order.totalAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : order.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500 text-xs">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No orders</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Extra Info */}
            <div className="text-xs text-gray-400 pb-4">
                User ID: {user.id} · Total Pairs: {user.totalPairs}
            </div>
        </div>
    );
}

function InfoCard({ label, value, subtext, mono, link, onClick }) {
    const Wrapper = onClick ? 'button' : 'div';
    return (
        <Wrapper
            onClick={onClick}
            className={`bg-gray-50 rounded-xl p-4 text-left ${onClick ? 'hover:bg-gray-100 transition-colors cursor-pointer' : ''}`}
        >
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-sm font-medium truncate ${mono ? 'font-mono text-xs text-gray-600' : link ? 'text-blue-600 underline' : 'text-gray-900'}`}>
                {value} {subtext && <span className="text-gray-400 font-normal">{subtext}</span>}
            </p>
        </Wrapper>
    );
}

function StatCard({ label, value, highlight }) {
    return (
        <div className={`rounded-xl p-4 border shadow-sm ${highlight ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <p className={`text-xs mb-1 ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
            <p className={`text-lg font-semibold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
}

function MiniStat({ label, total, active, color }) {
    const bg = color === 'indigo' ? 'bg-indigo-50/50' : 'bg-pink-50/50';
    const textColor = color === 'indigo' ? 'text-indigo-600' : 'text-pink-600';
    return (
        <div className={`${bg} rounded-xl p-4 space-y-2`}>
            <p className={`text-xs font-medium ${textColor} uppercase tracking-wider`}>{label}</p>
            <p className="text-xl font-semibold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Active: <span className="text-emerald-600 font-medium">{active}</span></p>
        </div>
    );
}

function txTypeColor(type) {
    switch (type) {
        case 'DIRECT_BONUS': return 'bg-blue-50 text-blue-700';
        case 'MATCHING_BONUS': return 'bg-purple-50 text-purple-700';
        case 'LEADERSHIP_BONUS': return 'bg-amber-50 text-amber-700';
        case 'PURCHASE': return 'bg-gray-100 text-gray-700';
        case 'WITHDRAW': return 'bg-red-50 text-red-700';
        case 'REFUND': return 'bg-teal-50 text-teal-700';
        default: return 'bg-gray-100 text-gray-600';
    }
}
