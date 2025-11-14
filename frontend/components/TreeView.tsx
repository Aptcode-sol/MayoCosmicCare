"use client"
import { useEffect, useRef } from 'react'
import Tree from 'react-d3-tree'

type TreeNode = {
    name: string
    attributes?: Record<string, any>
    children?: TreeNode[]
}

export default function TreeView({ data, onNodeClick, onAdd, onSponsor }: { data: TreeNode; onNodeClick?: (node: any) => void, onAdd?: (node: any) => void, onSponsor?: (node: any) => void }) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const translate = { x: 0, y: 50 }

    useEffect(() => {
        if (containerRef.current) {
            translate.x = containerRef.current.offsetWidth / 2
        }
    }, [])

    const renderNode = ({ nodeDatum, toggleNode }: any) => (
        <g>
            <rect width={180} height={70} x={-90} y={-35} rx={8} ry={8} fill="#fff" stroke="#e5e7eb" />
            <text fill="#111827" x={0} y={-8} fontSize={14} fontWeight={700} textAnchor="middle">{nodeDatum.name}</text>
            {nodeDatum.attributes && (
                <text fill="#6b7280" x={0} y={12} fontSize={12} textAnchor="middle">{nodeDatum.attributes.position || ''} • ₹{nodeDatum.attributes.wallet || 0}</text>
            )}
            <foreignObject x={60} y={-30} width={80} height={80}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => onNodeClick?.(nodeDatum)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">View</button>
                    <button onClick={() => onAdd?.(nodeDatum)} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Add</button>
                    <button onClick={() => onSponsor?.(nodeDatum)} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Sponsor</button>
                </div>
            </foreignObject>
        </g>
    )

    return (
        <div ref={containerRef} style={{ width: '100%', height: '600px' }}>
            <Tree
                data={data}
                translate={translate}
                pathFunc="elbow"
                orientation="vertical"
                nodeSize={{ x: 220, y: 140 }}
                renderCustomNodeElement={renderNode}
            />
        </div>
    )
}
