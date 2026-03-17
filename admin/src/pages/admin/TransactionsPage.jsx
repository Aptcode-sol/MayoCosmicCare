import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { SkeletonTable } from '../../components/SkeletonCard';

const TX_TYPES = [
    { value: 'all', label: 'All Types' },
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'DIRECT_BONUS', label: 'Direct Bonus' },
    { value: 'MATCHING_BONUS', label: 'Matching Bonus' },
    { value: 'LEADERSHIP_BONUS', label: 'Leadership Bonus' },
    { value: 'WITHDRAW', label: 'Withdraw' },
    { value: 'REFUND', label: 'Refund' },
    { value: 'ADMIN_CREDIT', label: 'Admin Credit' },
    { value: 'ADMIN_DEBIT', label: 'Admin Debit' }
];

const TYPE_STYLES = {
    PURCHASE: 'bg-indigo-100 text-indigo-700',
    DIRECT_BONUS: 'bg-green-100 text-green-700',
    MATCHING_BONUS: 'bg-blue-100 text-blue-700',
    LEADERSHIP_BONUS: 'bg-purple-100 text-purple-700',
    WITHDRAW: 'bg-red-100 text-red-700',
    REFUND: 'bg-yellow-100 text-yellow-700',
    ADMIN_CREDIT: 'bg-emerald-100 text-emerald-700',
    ADMIN_DEBIT: 'bg-orange-100 text-orange-700'
};

const TYPE_LABELS = {
    PURCHASE: 'Purchase',
    DIRECT_BONUS: 'Direct Bonus',
    MATCHING_BONUS: 'Matching Bonus',
    LEADERSHIP_BONUS: 'Leadership Bonus',
    WITHDRAW: 'Withdraw',
    REFUND: 'Refund',
    ADMIN_CREDIT: 'Admin Credit',
    ADMIN_DEBIT: 'Admin Debit'
};

function formatIndian(num) {
    if (num === null || num === undefined) return '₹0';
    return '₹' + Number(num).toLocaleString('en-IN');
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', '25');
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (typeFilter !== 'all') params.append('type', typeFilter);
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);
            const res = await api.get(`/api/admin/transactions?${params.toString()}`);
            setTransactions(res.data.transactions || []);
            setPagination(res.data.pagination || null);
        } catch (err) {
            toast.error('Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await api.get('/api/admin/transactions/summary');
            setSummary(res.data.summary || {});
        } catch {
            // Silent fail for summary
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, debouncedSearch, typeFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchSummary();
    }, []);

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <svg className="w-3 h-3 text-gray-300 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
        return sortOrder === 'asc'
            ? <svg className="w-3 h-3 text-gray-900 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            : <svg className="w-3 h-3 text-gray-900 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { key: 'DIRECT_BONUS', label: 'Direct Bonus', icon: '🎯' },
                        { key: 'MATCHING_BONUS', label: 'Matching Bonus', icon: '🔗' },
                        { key: 'LEADERSHIP_BONUS', label: 'Leadership Bonus', icon: '👑' },
                        { key: 'WITHDRAW', label: 'Withdrawals', icon: '💸' }
                    ].map(item => (
                        <div
                            key={item.key}
                            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => { setTypeFilter(item.key); setPage(1); }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-xs font-medium text-gray-500">{item.label}</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{formatIndian(summary[item.key]?.total || 0)}</p>
                            <p className="text-xs text-gray-400">{summary[item.key]?.count || 0} transactions</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Search Bar */}
            <div className="relative w-full">
                <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by user name, username, phone, email, or details"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.1-4.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                </svg>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                >
                    {TX_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>

                {typeFilter !== 'all' && (
                    <button
                        onClick={() => { setTypeFilter('all'); setPage(1); }}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        ✕ Clear Filter
                    </button>
                )}

                {pagination && (
                    <div className="flex items-center text-xs sm:text-sm text-gray-500 px-2 ml-auto">
                        Total: <span className="ml-1 font-medium text-gray-900">{pagination.total}</span>
                    </div>
                )}
            </div>

            {/* Pagination top */}
            {pagination && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, pagination.total)} of {pagination.total} transactions
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={!pagination.hasPrev}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">
                            Page {page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!pagination.hasNext}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] sm:text-xs uppercase text-gray-500 font-medium">
                            <tr>
                                <th className="px-3 sm:px-4 py-3 sm:py-4 text-left">User</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Type</th>
                                <th
                                    className="px-3 sm:px-6 py-3 sm:py-4 text-left cursor-pointer hover:text-gray-900 select-none"
                                    onClick={() => toggleSort('amount')}
                                >
                                    Amount <SortIcon field="amount" />
                                </th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Details</th>
                                <th
                                    className="px-3 sm:px-6 py-3 sm:py-4 text-left cursor-pointer hover:text-gray-900 select-none"
                                    onClick={() => toggleSort('createdAt')}
                                >
                                    Date <SortIcon field="createdAt" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-0">
                                        <SkeletonTable rows={10} />
                                    </td>
                                </tr>
                            ) : transactions.length > 0 ? transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50">
                                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                                        <div className="text-gray-900 font-medium text-sm sm:text-base">{tx.user?.username}</div>
                                        {tx.user?.name && <div className="text-gray-700 text-xs sm:text-sm">{tx.user.name}</div>}
                                        <div className="text-gray-500 text-[11px] sm:text-xs">{tx.user?.phone || tx.user?.email}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium ${TYPE_STYLES[tx.type] || 'bg-gray-100 text-gray-700'}`}>
                                            {TYPE_LABELS[tx.type] || tx.type}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <span className={`font-bold ${tx.type === 'WITHDRAW' || tx.type === 'ADMIN_DEBIT' ? 'text-red-600' : 'text-green-600'}`}>
                                            {tx.type === 'WITHDRAW' || tx.type === 'ADMIN_DEBIT' ? '-' : '+'}{formatIndian(tx.amount)}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 text-[11px] sm:text-xs max-w-[200px] truncate" title={tx.detail || ''}>
                                        {tx.detail || '—'}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-500 text-[11px] sm:text-xs whitespace-nowrap">
                                        <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                                        <div className="text-gray-400">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-3 sm:px-6 py-12 text-center text-gray-500">
                                        No transactions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination bottom */}
            {pagination && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, pagination.total)} of {pagination.total} transactions
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={!pagination.hasPrev}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">
                            Page {page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={!pagination.hasNext}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
