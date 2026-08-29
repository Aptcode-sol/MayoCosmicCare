import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import AdminTreeView from '../../components/AdminTreeView';
import TreeBreadcrumb from '../../components/TreeBreadcrumb';
import { getNetworkTree, getNetworkSubtree, getNetworkSummary, searchNetwork, getNetworkPath } from '../../lib/services/network';

const FOCUS_DEPTH = 3;

export default function NetworkPage() {
    const [tree, setTree] = useState(null);
    const [summary, setSummary] = useState({ total: 0, active: 0, left: 0, right: 0 });
    const [selectedNode, setSelectedNode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    // Focus/breadcrumb navigation — same model as the customer network page.
    // focusedNodeId=null means "not resolved yet"; the first fetch seeds both
    // focusedNodeId and breadcrumb from the platform root the backend picks.
    const [focusedNodeId, setFocusedNodeId] = useState(null);
    const [breadcrumb, setBreadcrumb] = useState([]);
    const [highlightedId, setHighlightedId] = useState(null);

    // Search / "jump to member"
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchOpen, setSearchOpen] = useState(false);

    // Zoom/pan — ported from the customer network page (frontend/app/dashboard/tree/page.tsx)
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef(null);
    const lastPinchDistanceRef = useRef(null);
    const mouseStartRef = useRef(null);
    const isMouseDraggingRef = useRef(false);
    const lastTouchRef = useRef(null);
    const lastTapTimeRef = useRef(0);
    const isDraggingRef = useRef(false);

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseDown = (e) => {
            if (e.button !== 0) return;
            isMouseDraggingRef.current = true;
            mouseStartRef.current = { x: e.clientX, y: e.clientY };
            container.style.cursor = 'grabbing';
        };
        const handleMouseMove = (e) => {
            if (!isMouseDraggingRef.current || !mouseStartRef.current) return;
            e.preventDefault();
            const dx = mouseStartRef.current.x - e.clientX;
            const dy = mouseStartRef.current.y - e.clientY;
            container.scrollLeft += dx;
            container.scrollTop += dy;
            mouseStartRef.current = { x: e.clientX, y: e.clientY };
        };
        const handleMouseUp = () => {
            isMouseDraggingRef.current = false;
            mouseStartRef.current = null;
            container.style.cursor = 'grab';
        };

        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const DOUBLE_TAP_DELAY = 300;

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                isDraggingRef.current = false;
                lastTouchRef.current = null;
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                lastPinchDistanceRef.current = distance;
            } else if (e.touches.length === 1) {
                lastPinchDistanceRef.current = null;
                const now = Date.now();
                if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
                    e.preventDefault();
                    isDraggingRef.current = true;
                    lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                } else {
                    isDraggingRef.current = false;
                    lastTouchRef.current = null;
                }
                lastTapTimeRef.current = now;
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2 && lastPinchDistanceRef.current !== null) {
                e.preventDefault();
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const delta = (distance - lastPinchDistanceRef.current) * 0.005;
                setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
                lastPinchDistanceRef.current = distance;
            } else if (e.touches.length === 1 && isDraggingRef.current && lastTouchRef.current !== null) {
                e.preventDefault();
                const dx = lastTouchRef.current.x - e.touches[0].clientX;
                const dy = lastTouchRef.current.y - e.touches[0].clientY;
                container.scrollLeft += dx;
                container.scrollTop += dy;
                lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        };

        const handleTouchEnd = () => {
            lastPinchDistanceRef.current = null;
            lastTouchRef.current = null;
            isDraggingRef.current = false;
        };

        const preventPageZoom = (e) => {
            if (e.touches.length >= 2) e.preventDefault();
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchmove', preventPageZoom, { passive: false });
        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchmove', preventPageZoom);
        };
    }, []);

    // Summary tiles reflect the WHOLE network, independent of what's focused.
    useEffect(() => {
        getNetworkSummary().then(res => setSummary(res)).catch(() => { });
    }, []);

    // Fetches and sets the tree for a specific node id, or (id=null) resolves and
    // fetches the platform root. Triggered explicitly by each navigation action
    // below, plus once on mount — not by watching focusedNodeId — so resolving the
    // root on first load doesn't cause a second, redundant fetch once it's known.
    const fetchAndSetTree = useCallback(async (id) => {
        setFetchError('');
        try {
            const res = id
                ? await getNetworkSubtree(id, FOCUS_DEPTH)
                : await getNetworkTree(null, FOCUS_DEPTH);
            setTree(res.tree);
            if (!id && res.tree) {
                setFocusedNodeId(res.tree.id);
                setBreadcrumb([{ id: res.tree.id, username: res.tree.username, name: res.tree.name }]);
            }
        } catch (err) {
            setFetchError(err?.message || 'Failed to fetch network');
            toast.error('Failed to fetch network');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial bootstrap — resolve the platform root exactly once.
    useEffect(() => {
        fetchAndSetTree(null);
    }, [fetchAndSetTree]);

    // Scroll a newly-focused/highlighted node into view once its tree has rendered.
    useEffect(() => {
        if (!tree || !highlightedId) return;
        const el = document.getElementById(`tree-node-${highlightedId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        const timer = setTimeout(() => setHighlightedId(null), 2000);
        return () => clearTimeout(timer);
    }, [tree, highlightedId]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        let cancelled = false;
        async function runSearch() {
            if (!debouncedSearch) { setSearchResults([]); return; }
            try {
                const res = await searchNetwork(debouncedSearch);
                if (!cancelled) setSearchResults(res.matches || []);
            } catch {
                if (!cancelled) setSearchResults([]);
            }
        }
        runSearch();
        return () => { cancelled = true; };
    }, [debouncedSearch]);

    async function handleSelectMatch(match) {
        try {
            const { path } = await getNetworkPath(match.id);
            setBreadcrumb(path);
            setFocusedNodeId(match.id);
            setHighlightedId(match.id);
            fetchAndSetTree(match.id);
        } catch {
            toast.error('Failed to locate member');
        } finally {
            setSearch('');
            setSearchOpen(false);
        }
    }

    function handleBreadcrumbNavigate(index) {
        const entry = breadcrumb[index];
        if (!entry) return;
        setBreadcrumb(breadcrumb.slice(0, index + 1));
        setFocusedNodeId(entry.id);
        fetchAndSetTree(entry.id);
    }

    function handleFocusNode(node) {
        setBreadcrumb([...breadcrumb, { id: node.id, username: node.username, name: node.name }]);
        setFocusedNodeId(node.id);
        fetchAndSetTree(node.id);
    }

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
                    <h2 className="text-base sm:text-lg font-medium text-gray-900">Network Tree ({summary.total} members)</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{summary.active}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Active (Purchased)</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{summary.left}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Left Position</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-purple-600">{summary.right}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Right Position</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <TreeBreadcrumb path={breadcrumb} onNavigate={handleBreadcrumbNavigate} rootLabel="Root" />
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
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
                                                onClick={() => handleSelectMatch(m)}
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

                    <div className="mb-4 text-xs sm:text-sm text-gray-500">
                        Click nodes to view details. Click &quot;View subtree&quot; to drill into a member&apos;s network.
                    </div>

                    {fetchError ? (
                        <div className="text-center py-12 space-y-3">
                            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 rounded-full px-6 py-2 text-sm font-medium border border-red-100">
                                {fetchError}
                            </div>
                            <div>
                                <button
                                    onClick={() => fetchAndSetTree(focusedNodeId)}
                                    className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : !tree ? (
                        <div className="text-center py-12 text-gray-500">
                            No network data available
                        </div>
                    ) : (
                        <div className="relative bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                                <div className="text-xs text-center text-gray-500 font-medium py-1">{Math.round(zoom * 100)}%</div>
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

                            <div
                                ref={containerRef}
                                className="overflow-auto h-[420px] touch-none"
                                style={{ cursor: 'grab', userSelect: 'none' }}
                                onWheel={handleWheel}
                            >
                                <div style={{ minWidth: '100%', minHeight: '400px', display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out', width: `${100 / zoom}%` }}>
                                        <AdminTreeView
                                            data={tree}
                                            onNodeClick={(node) => setSelectedNode(node)}
                                            onFocusNode={handleFocusNode}
                                            highlightedId={highlightedId}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedNode && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 pt-20" onClick={() => setSelectedNode(null)}>
                    <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg font-medium shadow-md">
                                    {(selectedNode.name || selectedNode.username || 'U').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">{selectedNode.name || 'User'}</h3>
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
                                    <span>Referred By: {selectedNode.referredBy || '—'}</span>
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
