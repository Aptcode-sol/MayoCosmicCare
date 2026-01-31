"use client"
import { useEffect, useState, useRef } from 'react'
import { getMyTree, getTreeForUser } from '@/lib/services/referrals'
import { useRouter } from 'next/navigation'
import { me } from '@/lib/services/auth'
import TreeView from '@/components/TreeView'
import DashboardLayout from '@/components/DashboardLayout'
import { SkeletonCard } from "@/components/ui/SkeletonCard"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import AnimateOnScroll from '@/components/AnimateOnScroll'

type TreeNodeData = {
    id: string
    name?: string
    firstName?: string
    username?: string
    position?: string
    leftMemberCount?: number
    rightMemberCount?: number
    walletBalance?: number
    createdAt?: string
    referredBy?: string
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
                            {(node.name || node.firstName || node.username || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900">{node.name || node.firstName || 'User'}</h3>
                            <p className="text-sm font-medium text-gray-900">@{node.username}</p>
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
                            <span>Referred By: {node.referredBy || '—'}</span>
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
    const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
    const [tree, setTree] = useState<TreeNodeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('')
    const [selected, setSelected] = useState<TreeNodeData | null>(null)
    const [zoom, setZoom] = useState(1)
    const lastPinchDistanceRef = useRef<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Handle wheel zoom (Ctrl + Scroll)
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.05 : 0.05
            setZoom(z => Math.max(0.3, Math.min(2, z + delta)))
        }
    }

    // Setup native touch event listeners with { passive: false } to prevent browser zoom
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault()
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                )
                lastPinchDistanceRef.current = distance
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
                e.preventDefault()
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                )
                const delta = (distance - lastPinchDistanceRef.current) * 0.005
                setZoom(z => Math.max(0.3, Math.min(2, z + delta)))
                lastPinchDistanceRef.current = distance
            }
        }

        const handleTouchEnd = () => {
            lastPinchDistanceRef.current = null
        }

        // Add listeners with passive: false to allow preventDefault
        container.addEventListener('touchstart', handleTouchStart, { passive: false })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd)

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
        }
    }, [])

    useEffect(() => {
        async function loadData() {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) {
                    router.push('/login')
                    return
                }
                const userRes = await me()
                setUser(userRes?.user || userRes)
                const res = await getMyTree(6)
                setTree(res.tree)
            } catch (err: unknown) {
                const errorObj = err as { message?: string } | Error
                const message = typeof errorObj === 'object' && errorObj !== null
                    ? (errorObj.message || 'Failed to load tree')
                    : String(err || 'Failed to load tree')
                setError(message)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [router])

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
            // Handle both parsed error objects and regular errors
            const errorObj = err as { message?: string } | Error
            const message = typeof errorObj === 'object' && errorObj !== null
                ? (errorObj.message || 'Failed to load tree')
                : String(err || 'Failed to load tree')
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout user={user}>
            {loading ? (
                <div className="container mx-auto px-2 sm:px-3 lg:px-6 py-10 space-y-10">
                    {/* Header Skeleton */}
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                    </div>

                    {/* Legend Skeleton */}
                    <div className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>

                    {/* Tree Container Skeleton */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-[600px] animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-8">
                                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                <div className="flex gap-16">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                </div>
                                <div className="flex gap-8">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Page Header */}
                    <AnimateOnScroll animation="fade-up">
                        <div className="mb-8">
                            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Network Tree</h1>
                            <p className="text-gray-500 mt-1">Visualize your team structure and growth</p>
                        </div>
                    </AnimateOnScroll>

                    {/* Legend */}
                    <AnimateOnScroll animation="fade-up" delay={100}>
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
                    </AnimateOnScroll>

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

                            {/* Zoom Controls */}
                            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-2">
                                <button
                                    onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                                    title="Zoom In"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </button>
                                <div className="text-xs text-center text-gray-500 font-medium py-1">
                                    {Math.round(zoom * 100)}%
                                </div>
                                <button
                                    onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                                    title="Zoom Out"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setZoom(1)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors text-xs font-medium"
                                    title="Reset Zoom"
                                >
                                    1:1
                                </button>
                            </div>

                            {/* Zoomable Tree Container */}
                            <div
                                ref={containerRef}
                                className="overflow-auto h-[600px] touch-none"
                                style={{ cursor: 'grab' }}
                                onWheel={handleWheel}
                            >
                                {/* This wrapper ensures the scrollable area doesn't shrink when zooming out */}
                                <div style={{ minWidth: '100%', minHeight: '600px', display: 'flex', justifyContent: 'center' }}>
                                    <div
                                        style={{
                                            transform: `scale(${zoom})`,
                                            transformOrigin: 'top center',
                                            transition: 'transform 0.2s ease-out',
                                            width: `${100 / zoom}%`,
                                            minHeight: `${600 / zoom}px`
                                        }}
                                    >
                                        <TreeView
                                            data={tree}
                                            onNodeClick={(node) => setSelected(node)}
                                            onLoadChildren={async (nodeId) => {
                                                const res = await getTreeForUser(nodeId, 4)
                                                return res.tree
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
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
                </>
            )}
        </DashboardLayout>
    )
}
