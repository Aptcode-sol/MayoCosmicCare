"use client"
import type { TreeNodeData } from '@/lib/types/tree'

interface TreeViewProps {
    data: TreeNodeData
    onNodeClick?: (node: TreeNodeData) => void
    onFocusNode?: (node: TreeNodeData) => void
    highlightedId?: string | null
}

function TreeNode({
    node,
    onNodeClick,
    onFocusNode,
    highlightedId,
    isLeft
}: {
    node: TreeNodeData | null
    onNodeClick?: (node: TreeNodeData) => void
    onFocusNode?: (node: TreeNodeData) => void
    highlightedId?: string | null
    isLeft?: boolean
}) {
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
        )
    }

    const leftCount = Number(node.leftMemberCount || 0)
    const rightCount = Number(node.rightMemberCount || 0)

    // This node has descendants below it, but they weren't included in the
    // currently-focused slice — show "View subtree" to drill in instead of them.
    const hasMoreBelow = Boolean(!node.left && !node.right && (leftCount > 0 || rightCount > 0))
    const hasChildren = Boolean(node.left || node.right || hasMoreBelow)

    const displayName = node.name || node.username || 'User'
    const initials = displayName
        .split(/[\s_-]/)
        .map((s: string) => s[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const showCounts = leftCount > 0 || rightCount > 0

    const borderColor = isLeft === undefined
        ? 'border-amber-500'
        : isLeft
            ? 'border-indigo-500'
            : 'border-pink-500'

    const bgGradient = isLeft === undefined
        ? 'from-amber-500 to-amber-600'
        : isLeft
            ? 'from-indigo-500 to-indigo-600'
            : 'from-pink-500 to-pink-600'

    const isHighlighted = highlightedId === node.id

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

                {/* Wallet Balance & Left/Right Counts */}
                <div className="mt-3 space-y-2 w-full text-xs">
                    <div className="bg-green-50 rounded-lg px-2 py-1 text-center">
                        <span className="font-medium text-green-700">₹{(node.walletBalance || 0).toLocaleString()}</span>
                    </div>
                    {showCounts && (
                        <div className="grid grid-cols-2 gap-1">
                            <div className="bg-indigo-50 rounded px-1.5 py-1 text-center">
                                <div className="text-indigo-600 font-bold text-sm">{leftCount}</div>
                                <div className="text-indigo-500 text-[10px]">Left</div>
                            </div>
                            <div className="bg-pink-50 rounded px-1.5 py-1 text-center">
                                <div className="text-pink-600 font-bold text-sm">{rightCount}</div>
                                <div className="text-pink-500 text-[10px]">Right</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Drill-in affordance: re-centers the whole view on this node's subtree */}
                {hasMoreBelow && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onFocusNode?.(node) }}
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
    )
}

export default function TreeView({ data, onNodeClick, onFocusNode, highlightedId }: TreeViewProps) {
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
    )
}
