import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { SkeletonTable } from '../../components/SkeletonCard';

export default function PositionsPage() {
    const [positions, setPositions] = useState([]);
    const [positionsPage, setPositionsPage] = useState(1);
    const [positionsPagination, setPositionsPagination] = useState(null);
    const [positionFilter, setPositionFilter] = useState('all');
    const [rewardedFilter, setRewardedFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const fetchPositions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', positionsPage);
            params.append('limit', '25');
            if (positionFilter !== 'all') params.append('rank', positionFilter);
            if (rewardedFilter !== 'all') params.append('rewarded', rewardedFilter);
            const res = await api.get(`/api/admin/positions?${params.toString()}`);
            setPositions(res.data.rankChanges || []);
            setPositionsPagination(res.data.pagination || null);
        } catch (err) {
            toast.error('Failed to fetch positions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, [positionsPage, positionFilter, rewardedFilter]);

    const toggleReward = async (id, rewarded) => {
        try {
            await api.patch(`/api/admin/positions/${id}/reward`, { rewarded });
            toast.success(rewarded ? 'Marked as rewarded' : 'Unmarked');
            fetchPositions();
        } catch (err) {
            toast.error('Failed to update');
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
                <h2 className="text-base sm:text-lg font-medium text-gray-900">
                    Position Changes
                    <span className="ml-2 px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs sm:text-sm font-medium">
                        {positionsPagination?.total || positions.length}
                    </span>
                </h2>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <select
                    value={positionFilter}
                    onChange={(e) => { setPositionFilter(e.target.value); setPositionsPage(1); }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
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
                    onChange={(e) => { setRewardedFilter(e.target.value); setPositionsPage(1); }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending Reward</option>
                    <option value="rewarded">Rewarded</option>
                </select>
            </div>

            {positionsPagination && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Showing {(positionsPage - 1) * 25 + 1} to {Math.min(positionsPage * 25, positionsPagination.total)} of {positionsPagination.total} positions
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setPositionsPage(p => Math.max(1, p - 1))}
                            disabled={!positionsPagination.hasPrev}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">
                            Page {positionsPage} of {positionsPagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPositionsPage(p => p + 1)}
                            disabled={!positionsPagination.hasNext}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[720px]">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] sm:text-xs uppercase text-gray-500 font-medium">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">User</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">From</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">To</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Pairs</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Date</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center">Rewarded</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {positions.length > 0 ? positions.map((pos) => (
                                <tr key={pos.id} className="hover:bg-gray-50/50">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <div className="text-gray-900 font-medium text-sm sm:text-base">{pos.user?.username}</div>
                                        <div className="text-gray-500 text-[11px] sm:text-xs">{pos.user?.email}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600">{pos.fromRank}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-indigo-50 text-indigo-700">
                                            {pos.toRank}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 font-mono">{pos.pairsAtChange}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-500 text-[11px] sm:text-xs">
                                        {new Date(pos.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={pos.rewarded}
                                            onChange={(e) => toggleReward(pos.id, e.target.checked)}
                                            className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-3 sm:px-6 py-12 text-center text-gray-500">
                                        No position changes found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {positionsPagination && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Showing {(positionsPage - 1) * 25 + 1} to {Math.min(positionsPage * 25, positionsPagination.total)} of {positionsPagination.total} positions
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setPositionsPage(p => Math.max(1, p - 1))}
                            disabled={!positionsPagination.hasPrev}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">
                            Page {positionsPage} of {positionsPagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPositionsPage(p => p + 1)}
                            disabled={!positionsPagination.hasNext}
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
