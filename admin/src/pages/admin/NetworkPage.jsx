import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AdminTreeView from '../../components/AdminTreeView';

export default function NetworkPage() {
    const [networkUsers, setNetworkUsers] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNetwork = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/admin/analytics/network');
                setNetworkUsers(res.data.users || []);
            } catch (err) {
                toast.error('Failed to fetch network');
            } finally {
                setLoading(false);
            }
        };

        fetchNetwork();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-[600px] animate-pulse relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-8">
                        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                        <div className="flex gap-16">
                            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h2 className="text-base sm:text-lg font-medium text-gray-900">Network Tree ({networkUsers.length} members)</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{networkUsers.filter(u => u.hasPurchased).length}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Active (Purchased)</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{networkUsers.filter(u => u.position === 'LEFT').length}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Left Position</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-purple-600">{networkUsers.filter(u => u.position === 'RIGHT').length}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Right Position</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                    <div className="mb-4 text-xs sm:text-sm text-gray-500">
                        Click nodes to view details. Expand/collapse with the arrow button.
                    </div>
                    {(() => {
                        const buildTree = (users) => {
                            if (!users || users.length === 0) return null;

                            const userMap = {};
                            users.forEach(u => {
                                userMap[u.id] = { ...u, left: null, right: null };
                            });

                            let root = null;
                            users.forEach(u => {
                                if (!u.parentId || !userMap[u.parentId]) {
                                    if (!root) root = userMap[u.id];
                                }
                            });

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
                            <div className="overflow-x-auto">
                                <div className="min-w-[520px]">
                                    <AdminTreeView
                                        data={treeData}
                                        onNodeClick={(node) => {
                                            const fullNodeData = networkUsers.find(u => u.id === node.id) || node;
                                            if (fullNodeData && !fullNodeData.leftMemberCount) fullNodeData.leftMemberCount = node.leftMemberCount;
                                            if (fullNodeData && !fullNodeData.rightMemberCount) fullNodeData.rightMemberCount = node.rightMemberCount;
                                            setSelectedNode(fullNodeData);
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {selectedNode && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 pt-20" onClick={() => setSelectedNode(null)}>
                    <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg font-medium shadow-md">
                                    {(selectedNode.firstName || selectedNode.username || 'U').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">{selectedNode.firstName || 'User'} {selectedNode.lastName || ''}</h3>
                                    <p className="text-sm font-medium text-gray-900">@{selectedNode.username}</p>
                                    <p className="text-xs text-gray-500 font-medium bg-gray-100 rounded-full px-2 py-0.5 inline-block mt-1">
                                        {selectedNode.position || 'ROOT'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                    <div className="grid grid-cols-2 gap-4 text-center divide-x divide-gray-200">
                                        <div>
                                            <div className="text-2xl font-light text-gray-900">{selectedNode.leftMemberCount || 0}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mt-1">Left Team</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-light text-gray-900">{selectedNode.rightMemberCount || 0}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mt-1">Right Team</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-center">
                                    <div className="text-2xl font-light text-emerald-700">₹{(selectedNode.walletBalance || 0).toLocaleString()}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium mt-1">Wallet Balance</div>
                                </div>

                                <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-50">
                                    <span>Referred By: {selectedNode.sponsor?.username || '—'}</span>
                                    <span>Joined: {selectedNode.createdAt ? new Date(selectedNode.createdAt).toLocaleDateString() : '—'}</span>
                                </div>
                            </div>

                            <button onClick={() => setSelectedNode(null)} className="w-full mt-6 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium">
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
