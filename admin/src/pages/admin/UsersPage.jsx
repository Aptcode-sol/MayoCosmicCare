import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { SkeletonTable } from '../../components/SkeletonCard';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [usersPage, setUsersPage] = useState(1);
    const [usersPagination, setUsersPagination] = useState(null);
    const [usersSearch, setUsersSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    // Debounce search input to prevent focus loss
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(usersSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [usersSearch]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', usersPage);
            params.append('limit', '25');
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            const res = await api.get(`/api/admin/users?${params.toString()}`);
            setUsers(res.data.users || []);
            setUsersPagination(res.data.pagination || null);
        } catch (err) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [usersPage, debouncedSearch, statusFilter]);

    const toggleBlockUser = async (userId, currentStatus) => {
        try {
            await api.patch(`/api/admin/users/${userId}/block`, { isBlocked: !currentStatus });
            toast.success(currentStatus ? 'User unblocked' : 'User blocked');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update user');
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
            {/* Search Bar */}
            <div className="relative w-full">
                <input
                    value={usersSearch}
                    onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
                    placeholder="Search by name, username, email, phone, or ID"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.1-4.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                </svg>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setUsersPage(1); }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                </select>
                {usersPagination && (
                    <div className="flex items-center text-xs sm:text-sm text-gray-500 px-2">
                        Total: <span className="ml-1 font-medium text-gray-900">{usersPagination.total}</span>
                    </div>
                )}
            </div>

            {usersPagination && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Showing {(usersPage - 1) * 25 + 1} to {Math.min(usersPage * 25, usersPagination.total)} of {usersPagination.total} users
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                            disabled={!usersPagination.hasPrev}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">
                            Page {usersPage} of {usersPagination.totalPages}
                        </span>
                        <button
                            onClick={() => setUsersPage(p => p + 1)}
                            disabled={!usersPagination.hasNext}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm min-w-[640px]">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] sm:text-xs uppercase text-gray-500 font-medium">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">User</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">BV</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Status</th>
                                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.length > 0 ? users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <div className="text-gray-900 font-medium text-sm sm:text-base">{user.username}</div>
                                        {user.name && <div className="text-gray-700 text-xs sm:text-sm">{user.name}</div>}
                                        <div className="text-gray-500 text-[11px] sm:text-xs">{user.email}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600">
                                        L: {user.leftBV} / R: {user.rightBV}
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium ${user.isBlocked
                                            ? 'bg-red-50 text-red-700'
                                            : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                            {user.isBlocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                                        <button
                                            onClick={() => toggleBlockUser(user.id, user.isBlocked)}
                                            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors ${user.isBlocked
                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                }`}
                                        >
                                            {user.isBlocked ? 'Unblock' : 'Block'}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-3 sm:px-6 py-12 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {usersPagination && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs sm:text-sm text-gray-500">
                        Showing {(usersPage - 1) * 25 + 1} to {Math.min(usersPage * 25, usersPagination.total)} of {usersPagination.total} users
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                            disabled={!usersPagination.hasPrev}
                            className="px-3 py-2 sm:px-4 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600">
                            Page {usersPage} of {usersPagination.totalPages}
                        </span>
                        <button
                            onClick={() => setUsersPage(p => p + 1)}
                            disabled={!usersPagination.hasNext}
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
