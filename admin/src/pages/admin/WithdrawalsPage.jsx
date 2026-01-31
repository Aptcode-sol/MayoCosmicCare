import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { SkeletonTable } from '../../components/SkeletonCard';

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawalsPage, setWithdrawalsPage] = useState(1);
    const [withdrawalsPagination, setWithdrawalsPagination] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/payouts/admin/list?page=${withdrawalsPage}&limit=25`);
            setWithdrawals(res.data.withdrawals || []);
            setWithdrawalsPagination(res.data.pagination || null);
        } catch (err) {
            toast.error('Failed to fetch withdrawals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [withdrawalsPage]);

    const approveWithdrawal = async (id) => {
        if (!confirm('Approve payout? Funds will be transferred immediately via Cashfree.')) return;
        try {
            toast.loading('Processing payout...');
            await api.post(`/api/payouts/approve/${id}`);
            toast.dismiss();
            toast.success('Payout approved & initiated');
            fetchWithdrawals();
        } catch (err) {
            toast.dismiss();
            toast.error(err.response?.data?.error || 'Approval failed');
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <SkeletonTable rows={10} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Withdrawal Requests</h2>
                {withdrawalsPagination && (
                    <div className="text-xs sm:text-sm text-gray-500">
                        Total: {withdrawalsPagination.total}
                    </div>
                )}
            </div>

            {withdrawalsPagination && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Showing {(withdrawalsPage - 1) * 25 + 1} to {Math.min(withdrawalsPage * 25, withdrawalsPagination.total)} of {withdrawalsPagination.total} withdrawals
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setWithdrawalsPage(p => Math.max(1, p - 1))}
                            disabled={!withdrawalsPagination.hasPrev}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">
                            Page {withdrawalsPage} of {withdrawalsPagination.totalPages}
                        </span>
                        <button
                            onClick={() => setWithdrawalsPage(p => p + 1)}
                            disabled={!withdrawalsPagination.hasNext}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[760px]">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] sm:text-xs uppercase text-gray-500 font-medium">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">User</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Amount</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Bank Details</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Date</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Status</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {withdrawals.length > 0 ? withdrawals.map((w) => {
                                const details = w.bankDetails ? JSON.parse(w.bankDetails) : {};
                                return (
                                    <tr key={w.id} className="hover:bg-gray-50/50">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="text-gray-900 font-medium text-sm sm:text-base">{w.user?.username}</div>
                                            <div className="text-gray-500 text-[11px] sm:text-xs">{w.user?.phone}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 font-bold text-gray-900">₹{w.amount}</td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-xs text-gray-600">
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
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-500 text-[11px] sm:text-xs">
                                            {new Date(w.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium ${w.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                                            {w.status === 'PENDING' && (
                                                <button
                                                    onClick={() => approveWithdrawal(w.id)}
                                                    className="px-3 py-2 sm:px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] sm:text-xs font-medium"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            {w.status === 'APPROVED' && (
                                                <span className="text-[11px] sm:text-xs text-green-600 font-medium">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-3 sm:px-6 py-12 text-center text-gray-500">
                                        No withdrawal requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {withdrawalsPagination && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Showing {(withdrawalsPage - 1) * 25 + 1} to {Math.min(withdrawalsPage * 25, withdrawalsPagination.total)} of {withdrawalsPagination.total} withdrawals
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setWithdrawalsPage(p => Math.max(1, p - 1))}
                            disabled={!withdrawalsPagination.hasPrev}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">
                            Page {withdrawalsPage} of {withdrawalsPagination.totalPages}
                        </span>
                        <button
                            onClick={() => setWithdrawalsPage(p => p + 1)}
                            disabled={!withdrawalsPagination.hasNext}
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
