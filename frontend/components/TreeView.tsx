"use client"
import { useState, useMemo } from 'react'

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

interface TreeViewProps {
    data: TreeNodeData
    onNodeClick?: (node: TreeNodeData) => void
}

function TreeNode({
    node,
    level = 0,
    onNodeClick,
    isLeft
}: {
    node: TreeNodeData | null
    level: number
    onNodeClick?: (node: TreeNodeData) => void
    isLeft?: boolean
}) {
    const [expanded, setExpanded] = useState(level < 2)

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

    const hasChildren = node.left || node.right
    const initials = (node.username || 'U')
        .split(/[\s_-]/)
        .map(s => s[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2)

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

    return (
        <div className="flex flex-col items-center">
            {/* Node Card */}
            <div
                className={`relative bg-white rounded-2xl shadow-lg border-2 ${borderColor} p-4 min-w-[160px] cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                onClick={() => onNodeClick?.(node)}
            >
                {/* Avatar */}
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{node.username || 'User'}</div>
                        <div className="text-xs text-gray-500">{node.position || 'ROOT'}</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-indigo-50 rounded-lg px-2 py-1.5 text-center">
                        <div className="font-bold text-indigo-600">{node.leftMemberCount || 0}</div>
                        <div className="text-gray-500">Left</div>
                    </div>
                    <div className="bg-pink-50 rounded-lg px-2 py-1.5 text-center">
                        <div className="font-bold text-pink-600">{node.rightMemberCount || 0}</div>
                        <div className="text-gray-500">Right</div>
                    </div>
                </div>

                {/* Wallet Badge */}
                <div className="mt-2 bg-green-50 rounded-lg px-2 py-1 text-center">
                    <span className="text-xs font-medium text-green-700">₹{(node.walletBalance || 0).toLocaleString()}</span>
                </div>

                {/* Expand/Collapse Button */}
                {hasChildren && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
                        className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        <svg
                            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Children */}
            {hasChildren && expanded && (
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
                                level={level + 1}
                                onNodeClick={onNodeClick}
                                isLeft={true}
                            />
                        </div>

                        {/* Right Child */}
                        <div className="relative">
                            <div className="absolute top-0 left-1/2 w-0.5 h-6 -mt-6 bg-gray-300 transform -translate-x-1/2"></div>
                            <TreeNode
                                node={node.right || null}
                                level={level + 1}
                                onNodeClick={onNodeClick}
                                isLeft={false}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function TreeView({ data, onNodeClick }: TreeViewProps) {
    return (
        <div className="w-full overflow-x-auto pb-8">
            <div className="min-w-max flex justify-center p-8">
                <TreeNode node={data} level={0} onNodeClick={onNodeClick} />
            </div>
        </div>
    )
}
