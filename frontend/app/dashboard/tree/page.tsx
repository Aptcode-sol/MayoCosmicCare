"use client"
import { useEffect, useState, useRef, useCallback } from 'react'
import { getTreeForUser, searchMyNetwork } from '@/lib/services/referrals'
import type { NetworkSearchMatch } from '@/lib/services/referrals'
import { useRouter } from 'next/navigation'
import { me } from '@/lib/services/auth'
import TreeView from '@/components/TreeView'
import TreeBreadcrumb from '@/components/TreeBreadcrumb'
import type { BreadcrumbEntry } from '@/components/TreeBreadcrumb'
import DashboardLayout from '@/components/DashboardLayout'
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import AnimateOnScroll from '@/components/AnimateOnScroll'
import type { TreeNodeData } from '@/lib/types/tree'

function ProfileModal({ node, onClose }: { node: TreeNodeData | null, onClose: () => void }) {
    if (!node) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[400] p-4 animate-in fade-in zoom-in-95 pt-20">
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

const FOCUS_DEPTH = 3

export default function Tree() {
    const router = useRouter();
    const [user, setUser] = useState<{ id?: string; username?: string; email?: string; name?: string } | null>(null)
    const [tree, setTree] = useState<TreeNodeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('')
    const [selected, setSelected] = useState<TreeNodeData | null>(null)
    const [zoom, setZoom] = useState(1)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const lastPinchDistanceRef = useRef<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const mouseStartRef = useRef<{ x: number; y: number } | null>(null)
    const isMouseDraggingRef = useRef(false)

    // Focus/breadcrumb navigation state — the whole nav model. `focusedNodeId` is
    // whichever node's subtree is currently rendered; `breadcrumb` is the ancestor
    // chain from "Me" down to it, each entry clickable to jump back.
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([])
    const [fetchError, setFetchError] = useState('')

    // Search / "jump to member"
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [searchResults, setSearchResults] = useState<NetworkSearchMatch[]>([])
    const [searchOpen, setSearchOpen] = useState(false)
    const [highlightedId, setHighlightedId] = useState<string | null>(null)

    // Fullscreen: lock the page behind the overlay and let Escape close it.
    useEffect(() => {
        if (!isFullscreen) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false)
        }
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [isFullscreen])

    // Handle wheel zoom (Ctrl + Scroll)
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.05 : 0.05
            setZoom(z => Math.max(0.3, Math.min(2, z + delta)))
        }
    }

    // Mouse: click-drag to pan the workspace (grab → grabbing cursor)
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleMouseDown = (e: MouseEvent) => {
            // Only pan with left mouse button on the container background
            if (e.button !== 0) return
            isMouseDraggingRef.current = true
            mouseStartRef.current = { x: e.clientX, y: e.clientY }
            container.style.cursor = 'grabbing'
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isMouseDraggingRef.current || !mouseStartRef.current) return
            e.preventDefault()
            const dx = mouseStartRef.current.x - e.clientX
            const dy = mouseStartRef.current.y - e.clientY
            container.scrollLeft += dx
            container.scrollTop += dy
            mouseStartRef.current = { x: e.clientX, y: e.clientY }
        }

        const handleMouseUp = () => {
            isMouseDraggingRef.current = false
            mouseStartRef.current = null
            container.style.cursor = 'grab'
        }

        container.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            container.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    // Setup native touch event listeners for double-tap-drag-to-pan and pinch-to-zoom
    // Since touch-none blocks ALL native touch, we handle everything manually
    const lastTouchRef = useRef<{ x: number; y: number } | null>(null)
    const lastTapTimeRef = useRef<number>(0)
    const isDraggingRef = useRef<boolean>(false)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const DOUBLE_TAP_DELAY = 300 // ms

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                // Two-finger: start pinch zoom
                e.preventDefault()
                isDraggingRef.current = false
                lastTouchRef.current = null
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                )
                lastPinchDistanceRef.current = distance
            } else if (e.touches.length === 1) {
                lastPinchDistanceRef.current = null
                const now = Date.now()
                if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
                    // Double-tap detected — enter drag mode
                    e.preventDefault()
                    isDraggingRef.current = true
                    lastTouchRef.current = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY
                    }
                } else {
                    // First tap — don't prevent default (allow node clicks)
                    isDraggingRef.current = false
                    lastTouchRef.current = null
                }
                lastTapTimeRef.current = now
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
                // Two-finger: pinch zoom
                e.preventDefault()
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                )
                const delta = (distance - lastPinchDistanceRef.current) * 0.005
                setZoom(z => Math.max(0.3, Math.min(2, z + delta)))
                lastPinchDistanceRef.current = distance
            } else if (e.touches.length === 1 && isDraggingRef.current && lastTouchRef.current !== null) {
                // Double-tap-drag: pan by scrolling the container
                e.preventDefault()
                const dx = lastTouchRef.current.x - e.touches[0].clientX
                const dy = lastTouchRef.current.y - e.touches[0].clientY
                container.scrollLeft += dx
                container.scrollTop += dy
                lastTouchRef.current = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                }
            }
        }

        const handleTouchEnd = () => {
            lastPinchDistanceRef.current = null
            lastTouchRef.current = null
            isDraggingRef.current = false
        }

        // Prevent page-level pinch-zoom by blocking multi-touch on the document
        const preventPageZoom = (e: TouchEvent) => {
            if (e.touches.length >= 2) {
                e.preventDefault()
            }
        }

        // Add listeners with passive: false to allow preventDefault
        container.addEventListener('touchstart', handleTouchStart, { passive: false })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd)
        document.addEventListener('touchmove', preventPageZoom, { passive: false })

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
            document.removeEventListener('touchmove', preventPageZoom)
        }
    }, [])

    // Initial load: resolve the logged-in user, then focus the view on them.
    useEffect(() => {
        async function loadUser() {
            try {
                const token = localStorage.getItem('accessToken')
                if (!token) {
                    router.push('/login')
                    return
                }
                const userRes = await me()
                const u = userRes?.user || userRes
                setUser(u)
                setBreadcrumb([{ id: u.id, username: u.username, name: u.name }])
                setFocusedNodeId(u.id)
            } catch (err: unknown) {
                const errorObj = err as { message?: string } | Error
                const message = typeof errorObj === 'object' && errorObj !== null
                    ? (errorObj.message || 'Failed to load tree')
                    : String(err || 'Failed to load tree')
                setError(message)
                setLoading(false)
            }
        }
        loadUser()
    }, [router])

    const loadFocusedTree = useCallback(async () => {
        if (!focusedNodeId) return
        setFetchError('')
        try {
            const res = await getTreeForUser(focusedNodeId, FOCUS_DEPTH)
            setTree(res.tree)
        } catch (err: unknown) {
            const errorObj = err as { message?: string } | Error
            const message = typeof errorObj === 'object' && errorObj !== null
                ? (errorObj.message || 'Failed to load tree')
                : String(err || 'Failed to load tree')
            setFetchError(message)
        } finally {
            setLoading(false)
        }
    }, [focusedNodeId])

    // Re-fetch whenever the focused node changes (drill-in, breadcrumb click, search jump)
    useEffect(() => {
        if (focusedNodeId) loadFocusedTree()
    }, [focusedNodeId, loadFocusedTree])

    // Once the newly-focused tree has actually rendered, scroll it into view and
    // start the highlight-clear countdown — tied to the fetch completing rather
    // than a fixed timeout guess made before the fetch even finished.
    useEffect(() => {
        if (!tree || !highlightedId) return
        const el = document.getElementById(`tree-node-${highlightedId}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        const timer = setTimeout(() => setHighlightedId(null), 2000)
        return () => clearTimeout(timer)
    }, [tree, highlightedId])

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        let cancelled = false
        async function runSearch() {
            if (!debouncedSearch) {
                setSearchResults([])
                return
            }
            try {
                const res = await searchMyNetwork(debouncedSearch)
                if (!cancelled) setSearchResults(res.matches || [])
            } catch {
                if (!cancelled) setSearchResults([])
            }
        }
        runSearch()
        return () => { cancelled = true }
    }, [debouncedSearch])

    function jumpTo(path: BreadcrumbEntry[], targetId: string) {
        setBreadcrumb(path)
        setFocusedNodeId(targetId)
        setSearch('')
        setSearchOpen(false)
        setHighlightedId(targetId)
    }

    function handleBreadcrumbNavigate(index: number) {
        const entry = breadcrumb[index]
        if (!entry) return
        setBreadcrumb(breadcrumb.slice(0, index + 1))
        setFocusedNodeId(entry.id)
    }

    function handleFocusNode(node: TreeNodeData) {
        setBreadcrumb([...breadcrumb, { id: node.id, username: node.username, name: node.name }])
        setFocusedNodeId(node.id)
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

                    {/* Legend + Breadcrumb + Search */}
                    <AnimateOnScroll animation="fade-up" delay={100}>
                        <Card className="mb-8 border-gray-100 shadow-sm bg-white/50 backdrop-blur-sm">
                            <div className="p-4 flex flex-wrap items-center gap-8 text-sm border-b border-gray-100">
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
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                                <TreeBreadcrumb path={breadcrumb} onNavigate={handleBreadcrumbNavigate} rootLabel="Me" />
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setSearchOpen(true) }}
                                        onFocus={() => setSearchOpen(true)}
                                        placeholder="Find a member..."
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                                    />
                                    {searchOpen && search && (
                                        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 max-h-64 overflow-y-auto">
                                            {searchResults.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-gray-400">No members found</div>
                                            ) : (
                                                searchResults.map((m) => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => jumpTo(m.path, m.id)}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                                                    >
                                                        <span className="font-medium text-gray-900">{m.name || m.username}</span>
                                                        <span className="text-xs text-gray-400">{m.position || ''}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </AnimateOnScroll>

                    {/* Tree Container */}
                    {(error || fetchError) && (
                        <div className="text-center py-12 space-y-3">
                            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 rounded-full px-6 py-2 text-sm font-medium border border-red-100">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error || fetchError}
                            </div>
                            {fetchError && (
                                <div>
                                    <Button variant="outline" onClick={() => loadFocusedTree()}>Retry</Button>
                                </div>
                            )}
                        </div>
                    )}

                    {tree && !error ? (
                        <div className={isFullscreen
                            ? "fixed inset-0 z-[300] bg-white overflow-hidden flex flex-col"
                            : "bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] relative"}>
                            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

                            {isFullscreen && (
                                <div className="relative z-20 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
                                    <div className="flex-1 min-w-0 overflow-x-auto">
                                        <TreeBreadcrumb path={breadcrumb} onNavigate={handleBreadcrumbNavigate} rootLabel="Me" />
                                    </div>
                                    <button
                                        onClick={() => setIsFullscreen(false)}
                                        className="shrink-0 px-3 py-1.5 text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                                    >
                                        Exit Full Screen
                                    </button>
                                </div>
                            )}

                            {/* Zoom Controls */}
                            <div className={`absolute right-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-2 ${isFullscreen ? 'top-20' : 'top-4'}`}>
                                <button
                                    onClick={() => setIsFullscreen(f => !f)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                                    title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen'}
                                >
                                    {isFullscreen ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4m0 5H4m5 0L4 4m11 5h5m-5 0V4m0 5l5-5M9 15v5m0-5H4m5 0l-5 5m11-5h5m-5 0v5m0-5l5 5" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0-4h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                        </svg>
                                    )}
                                </button>
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
                                className={`overflow-auto touch-none ${isFullscreen ? 'flex-1 h-full' : 'h-[420px]'}`}
                                style={{ cursor: 'grab', userSelect: 'none' }}
                                onWheel={handleWheel}
                            >
                                {/* This wrapper ensures the scrollable area doesn't shrink when zooming out */}
                                <div style={{ minWidth: '100%', minHeight: '400px', display: 'flex', justifyContent: 'center' }}>
                                    <div
                                        style={{
                                            transform: `scale(${zoom})`,
                                            transformOrigin: 'top center',
                                            transition: 'transform 0.2s ease-out',
                                            width: `${100 / zoom}%`,
                                        }}
                                    >
                                        <TreeView
                                            data={tree}
                                            onNodeClick={(node) => setSelected(node)}
                                            onFocusNode={handleFocusNode}
                                            highlightedId={highlightedId}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : !error && !fetchError && (
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
