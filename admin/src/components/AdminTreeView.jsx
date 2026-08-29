// TreeView component for admin dashboard.
// Renders one focused slice of the binary tree (the currently-focused node plus a
// fixed few levels below it) — NOT the whole network. Drilling into a member
// re-centers the whole view via onFocusNode; see NetworkPage.jsx for the
// focus/breadcrumb state this depends on.

function TreeNode({ node, onNodeClick, onFocusNode, highlightedId, isLeft }) {
    if (!node) {
        return (
            <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <span className="mt-2 text-xs text-gray-400">Empty</span>
            </div>
        );
    }

    const displayName = node.name || node.fullName || node.full_name || node.firstName || node.firstname || node.first_name || node.username || 'User';
    const initials = displayName
        .split(/[\s_-]/)
        .map(s => s[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const leftCount = Number(node.leftMemberCount || 0);
    const rightCount = Number(node.rightMemberCount || 0);
    const leftBV = Number(node.leftBV || 0);
    const rightBV = Number(node.rightBV || 0);
    const showBV = leftBV > 0 || rightBV > 0;

    // This node has descendants below it that weren't included in the currently-
    // focused slice — show "View subtree" to drill in instead of an expand toggle.
    const hasMoreBelow = Boolean(!node.left && !node.right && (leftCount > 0 || rightCount > 0));
    const hasChildren = Boolean(node.left || node.right || hasMoreBelow);

    const borderColor = node.position === 'LEFT'
        ? 'border-indigo-500'
        : node.position === 'RIGHT'
            ? 'border-pink-500'
            : 'border-amber-500';

    const bgGradient = node.position === 'LEFT'
        ? 'from-indigo-500 to-indigo-600'
        : node.position === 'RIGHT'
            ? 'from-pink-500 to-pink-600'
            : 'from-amber-500 to-amber-600';

    const isHighlighted = highlightedId === node.id;

    return (
        <div className="flex flex-col items-center">
            {/* Node Card */}
            <div
                id={`tree-node-${node.id}`}
                className={`relative bg-white rounded-2xl shadow-lg border-2 ${borderColor} p-4 min-w-[160px] cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${isHighlighted ? 'ring-4 ring-yellow-400' : ''}`}
                onClick={() => onNodeClick?.(node)}
            >
                {/* Avatar */}
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{displayName}</div>
                        <div className="text-xs text-gray-500">{node.username || node.position || 'ROOT'}</div>
                    </div>
                </div>


                {/* Business Volume, Wallet, and Status Info */}
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* BV Display - Only show if BV > 0 */}
                        {showBV && (
                            <>
                                <div className="bg-indigo-50 rounded px-2 py-1 text-center">
                                    <div className="text-indigo-600 font-bold">{leftBV}</div>
                                    <div className="text-indigo-500 text-[10px]">L BV</div>
                                </div>
                                <div className="bg-pink-50 rounded px-2 py-1 text-center">
                                    <div className="text-pink-600 font-bold">{rightBV}</div>
                                    <div className="text-pink-500 text-[10px]">R BV</div>
                                </div>
                            </>
                        )}
                        {/* Member Count Display - Always show */}
                        <div className="bg-indigo-50 rounded px-2 py-1 text-center">
                            <div className="text-indigo-600 font-bold">{leftCount}</div>
                            <div className="text-indigo-500 text-[10px]">Left</div>
                        </div>
                        <div className="bg-pink-50 rounded px-2 py-1 text-center">
                            <div className="text-pink-600 font-bold">{rightCount}</div>
                            <div className="text-pink-500 text-[10px]">Right</div>
                        </div>
                    </div>

                    {/* Wallet Balance - now below counts, above status */}
                    <div className="bg-emerald-50/50 rounded-lg px-2 py-1 text-center">
                        <span className="font-medium text-emerald-700 text-xs">₹{(node.walletBalance || 0).toLocaleString()}</span>
                    </div>

                    {/* Purchased Badge */}
                    <div className={`${node.hasPurchased ? 'bg-green-50' : 'bg-gray-50'} rounded-lg px-2 py-1 text-center`}>
                        <span className={`text-xs font-medium ${node.hasPurchased ? 'text-green-700' : 'text-gray-400'}`}>
                            {node.hasPurchased ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {/* Drill-in affordance: re-centers the whole view on this node's subtree */}
                {hasMoreBelow && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onFocusNode?.(node); }}
                        className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1 px-2 h-6 rounded-full bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors shadow-sm text-[10px] font-medium whitespace-nowrap"
                        title="View this member's network"
                    >
                        View subtree
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Children (always fully rendered — the current slice is bounded by fetch depth) */}
            {hasChildren && (node.left || node.right) && (
                <div className="relative mt-8">
                    {/* Vertical line from parent */}
                    <div className="absolute top-0 left-1/2 w-0.5 h-6 -mt-6 bg-gray-300 transform -translate-x-1/2"></div>

                    {/* Horizontal line connecting children */}
                    <div className="absolute top-0 left-1/4 w-1/2 h-0.5 bg-gray-300"></div>

                    <div className="flex gap-8 pt-6">
                        {/* Left Child */}
                        <div className="relative">
                            <div className="absolute top-0 left-1/2 w-0.5 h-6 -mt-6 bg-gray-300 transform -translate-x-1/2"></div>
                            <TreeNode
                                node={node.left || null}
                                onNodeClick={onNodeClick}
                                onFocusNode={onFocusNode}
                                highlightedId={highlightedId}
                                isLeft={true}
                            />
                        </div>

                        {/* Right Child */}
                        <div className="relative">
                            <div className="absolute top-0 left-1/2 w-0.5 h-6 -mt-6 bg-gray-300 transform -translate-x-1/2"></div>
                            <TreeNode
                                node={node.right || null}
                                onNodeClick={onNodeClick}
                                onFocusNode={onFocusNode}
                                highlightedId={highlightedId}
                                isLeft={false}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminTreeView({ data, onNodeClick, onFocusNode, highlightedId }) {
    if (!data) {
        return (
            <div className="flex items-center justify-center p-12 text-gray-500">
                No network data available
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto pb-8">
            <div className="min-w-max flex justify-center p-8">
                <TreeNode
                    node={data}
                    onNodeClick={onNodeClick}
                    onFocusNode={onFocusNode}
                    highlightedId={highlightedId}
                />
            </div>
        </div>
    );
}
