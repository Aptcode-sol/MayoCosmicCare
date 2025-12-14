"use client"
import { useEffect, useState } from 'react'
import { getMyTree } from '../../lib/services/referrals'
import { useRouter } from 'next/navigation'
import TreeView from '../../components/TreeView'

type TreeNodeData = {
    id: string
    username?: string
    position?: string
    leftMemberCount?: number
    rightMemberCount?: number
    walletBalance?: number
    createdAt?: string
    left?: TreeNodeData | null
    right?: TreeNodeData | null
}

function ProfileModal({ node, onClose }: { node: TreeNodeData | null, onClose: () => void }) {
    if (!node) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {(node.username || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{node.username || 'User'}</h3>
                        <p className="text-sm text-gray-500">{node.position || 'ROOT'}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{node.leftMemberCount || 0}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Left Members</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pink-600">{node.rightMemberCount || 0}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Right Members</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">₹{(node.walletBalance || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Wallet Balance</div>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        <div className="font-mono text-xs bg-gray-100 rounded px-2 py-1 inline-block mb-2">{node.id}</div>
                        <div>Joined: {node.createdAt ? new Date(node.createdAt).toLocaleDateString() : '—'}</div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export default function Tree() {
    const router = useRouter();
    const [tree, setTree] = useState<TreeNodeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('')
    const [selected, setSelected] = useState<TreeNodeData | null>(null)

    useEffect(() => {
        fetchTree()
    }, [])

    async function fetchTree() {
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) {
                router.push('/login')
                return
            }
            const res = await getMyTree(6)
            setTree(res.tree)
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to load tree')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your network...</p>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#fdfcfb]">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4 lg:px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Binary Tree</h1>
                            <p className="text-gray-600">View your network structure and team members</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="container mx-auto px-4 lg:px-6 py-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-500"></div>
                        <span className="text-gray-600">You (Root)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-indigo-500"></div>
                        <span className="text-gray-600">Left Leg</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-pink-500"></div>
                        <span className="text-gray-600">Right Leg</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-dashed border-gray-300 bg-gray-50"></div>
                        <span className="text-gray-600">Empty Slot</span>
                    </div>
                </div>
            </div>

            {/* Tree Container */}
            <div className="container mx-auto px-4 lg:px-6 py-6">
                {error && (
                    <div className="text-center py-12">
                        <div className="text-red-500 bg-red-50 rounded-xl p-6 inline-block">
                            <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {tree ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <TreeView data={tree} onNodeClick={(node) => setSelected(node)} />
                    </div>
                ) : !error && (
                    <div className="text-center py-16">
                        <svg className="w-20 h-20 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Team Members Yet</h3>
                        <p className="text-gray-600 mb-6">Share your referral links to start building your network!</p>
                        <a
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
                        >
                            Go to Dashboard
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            <ProfileModal node={selected} onClose={() => setSelected(null)} />
        </main>
    )
}
