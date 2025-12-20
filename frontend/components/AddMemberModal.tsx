"use client"
import { useState } from 'react'
import { register } from '../lib/services/auth'
import toast from 'react-hot-toast'
import { parseApiError } from '../lib/api'

export default function AddMemberModal({ open, parentId, onClose, onCreated }: { open: boolean, parentId?: string | null, onClose: () => void, onCreated?: () => void }) {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    if (!open) return null

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!parentId) return toast.error('No parent selected')
        setLoading(true)
        try {
            await register({ username, email, password, sponsorId: parentId })
            toast.success('Member created')
            onCreated?.()
            onClose()
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            toast.error(String(message))
        } finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-2">Add Member under {parentId}</h3>
                <form onSubmit={submit} className="space-y-3">
                    <input required value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full border px-3 py-2 rounded" />
                    <input required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full border px-3 py-2 rounded" />
                    <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full border px-3 py-2 rounded" />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="px-3 py-1 bg-green-600 text-white rounded">{loading ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
