"use client"
import { useEffect, useState } from 'react'
import { getMyTree } from '../../lib/services/referrals'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import AddMemberModal from '../../components/AddMemberModal'
import SponsorModal from '../../components/SponsorModal'
const TreeView = dynamic(() => import('../../components/TreeView'), { ssr: false })

type Node = {
    id: string
    username?: string
    position?: string
    createdAt?: string
    walletBalance?: number
    children?: Node[]
}

type TreeNodeReturn = {
    id: string
    name: string
    attributes: {
        position?: string
        wallet?: number
        createdAt?: string
    }
    children: TreeNodeReturn[]
}

function mapToTree(node: Node): TreeNodeReturn {
    return {
        id: node.id,
        name: node.username || node.id || '—',
        attributes: {
            position: node.position,
            wallet: node.walletBalance,
            createdAt: node.createdAt,
        },
        children: node.children ? node.children.map(mapToTree) : []
    }
}

function ProfileModal({ node, onClose }: { node: Node | null, onClose: () => void }) {
    if (!node) return null
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-2">{node.username || 'Profile'}</h3>
                <p className="text-sm text-gray-600">ID: {node.id}</p>
                <p className="text-sm text-gray-600">Position: {node.position || '—'}</p>
                <p className="text-sm text-gray-600">Joined: {node.createdAt ? new Date(node.createdAt).toLocaleString() : '—'}</p>
                <p className="text-sm text-gray-600">Wallet: ₹{node.walletBalance ?? 0}</p>
                <div className="mt-4 text-right">
                    <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Close</button>
                </div>
            </div>
        </div>
    )
}

function ReferralNode({ node, onView }: { node: Node, onView: (n: Node) => void }) {
    const [open, setOpen] = useState(true)
    return (
        <div className="border rounded p-3 bg-white">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="font-semibold">{node.username || '—'}</div>
                    <div className="text-xs text-gray-500">ID: {node.id} • {node.position || '—'}</div>
                    <div className="text-xs text-gray-500">Joined: {node.createdAt ? new Date(node.createdAt).toLocaleDateString() : '—'}</div>
                    <div className="text-xs text-gray-600">Wallet: ₹{node.walletBalance ?? 0}</div>
                </div>
                <div className="flex flex-col gap-2">
                    {node.children && node.children.length > 0 && (
                        <button onClick={() => setOpen(!open)} className="px-2 py-1 bg-gray-100 rounded">{open ? 'Collapse' : 'Expand'}</button>
                    )}
                    <button onClick={() => onView(node)} className="px-2 py-1 bg-blue-600 text-white rounded">View</button>
                </div>
            </div>

            {open && node.children && node.children.length > 0 && (
                <div className="mt-3 ml-4 space-y-2">
                    {node.children.map((c) => (
                        <ReferralNode key={c.id} node={c} onView={onView} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function Tree() {
    const router = useRouter();
    const [tree, setTree] = useState<Node | null>(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('')
    const [selected, setSelected] = useState<Node | null>(null)
    const [addOpen, setAddOpen] = useState(false)
    const [addParentId, setAddParentId] = useState<string | null>(null)
    const [sponsorOpen, setSponsorOpen] = useState(false)
    const [sponsorUserId, setSponsorUserId] = useState<string | null>(null)

    useEffect(() => { fetchTree() }, [])

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (!token) return
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const es = new EventSource(`${base}/api/sse/payouts`)
        es.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data)
                // data: payout with userId and amount
                setTree(prev => {
                    if (!prev) return prev
                    function walk(node: any) {
                        if (node.id === data.userId) {
                            node.walletBalance = (node.walletBalance || 0) + data.amount
                        }
                        if (node.children) node.children.forEach(walk)
                    }
                    const copy = JSON.parse(JSON.stringify(prev))
                    walk(copy)
                    return copy
                })
            } catch (err) { }
        }
        return () => es.close()
    }, [])

    async function fetchTree() {
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) return router.push('/login')
            const res = await getMyTree(6)
            // normalize data: attach walletBalance / createdAt if present
            setTree(res.tree)
        } catch (err: any) {
            setMsg(err.response?.data?.error || err.message)
        } finally { setLoading(false) }
    }

    function onAdd(node: any) {
        setAddParentId(node.id)
        setAddOpen(true)
    }

    function onSponsor(node: any) {
        setSponsorUserId(node.id)
        setSponsorOpen(true)
    }

    if (loading) return <p className="p-8">Loading...</p>

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Your Binary Tree</h1>
            {msg && <div className="mb-4">{msg}</div>}
            {tree ? (
                <div>
                    <TreeView data={mapToTree(tree)} onNodeClick={(n: any) => setSelected({ id: n.id, username: n.name, position: n.attributes?.position, createdAt: n.attributes?.createdAt, walletBalance: n.attributes?.wallet })} onAdd={onAdd} onSponsor={onSponsor} />
                    <AddMemberModal open={addOpen} parentId={addParentId} onClose={() => setAddOpen(false)} onCreated={fetchTree} />
                    <SponsorModal open={sponsorOpen} userId={sponsorUserId} onClose={() => setSponsorOpen(false)} onSponsored={fetchTree} />
                </div>
            ) : (
                <p>No referrals yet.</p>
            )}
            <ProfileModal node={selected} onClose={() => setSelected(null)} />
        </main>
    )
}
