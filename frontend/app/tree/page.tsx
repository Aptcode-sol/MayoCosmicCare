"use client"
import { useEffect, useState } from 'react'
import { getMyTree } from '../../lib/services/referrals'
import { useRouter } from 'next/navigation'
import { parseApiError } from '../../lib/api'
import TreeView from '../../components/TreeView'
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 pt-20">
            <Card className="w-full max-w-sm shadow-xl border-0 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg font-medium shadow-md">
                            {(node.username || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900">{node.username || 'User'}</h3>
                            <p className="text-sm text-gray-500 font-medium bg-gray-100 rounded-full px-2 py-0.5 inline-block mt-1">
                                {node.position || 'ROOT'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                            <div className="grid grid-cols-2 gap-4 text-center divide-x divide-gray-200">
                                <div>
                                    <div className="text-2xl font-light text-gray-900">{node.leftMemberCount || 0}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mt-1">Left Team</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-light text-gray-900">{node.rightMemberCount || 0}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mt-1">Right Team</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-center">
                            <div className="text-2xl font-light text-emerald-700">₹{(node.walletBalance || 0).toLocaleString()}</div>
                            <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium mt-1">Wallet Balance</div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-50">
                            <span className="font-mono">{node.id}</span>
                            <span>Date: {node.createdAt ? new Date(node.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                    </div>

                    <Button onClick={onClose} className="w-full mt-6" variant="outline">
                        Close Details
                    </Button>
                </div>
            </Card>
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
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            setError(String(message || 'Failed to load tree'))
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
                <div className="text-center animate-pulse">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Loading network structure...</p>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50/30">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Network Tree</h1>
                            <p className="text-gray-500 mt-1">Visualize your team structure and growth</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                            ← Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                {/* Legend */}
                <Card className="mb-8 border-gray-100 shadow-sm bg-white/50 backdrop-blur-sm">
                    <div className="p-4 flex flex-wrap items-center gap-8 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-900 shadow-sm"></div>
                            <span className="text-gray-600 font-medium">You</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                            <span className="text-gray-600 font-medium">Left Team</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-pink-500 shadow-sm"></div>
                            <span className="text-gray-600 font-medium">Right Team</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded border border-dashed border-gray-300"></div>
                            <span className="text-gray-400">Empty Spot</span>
                        </div>
                    </div>
                </Card>

                {/* Tree Container */}
                {error && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 rounded-full px-6 py-2 text-sm font-medium border border-red-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    </div>
                )}

                {tree ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[600px] relative">
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                        <TreeView data={tree} onNodeClick={(node) => setSelected(node)} />
                    </div>
                ) : !error && (
                    <div className="text-center py-32 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <p className="text-gray-500 font-medium">No team members found yet.</p>
                        <Button className="mt-4" onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </div>
                )}

                {/* Profile Modal */}
                <ProfileModal node={selected} onClose={() => setSelected(null)} />
            </div>
        </main>
    )
}
