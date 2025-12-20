"use client"
import { useState } from 'react'
import { setSponsor } from '../lib/services/admin'
import toast from 'react-hot-toast'
import { parseApiError } from '../lib/api'

export default function SponsorModal({ open, userId, onClose, onSponsored }: { open: boolean, userId?: string | null, onClose: () => void, onSponsored?: () => void }) {
    const [sponsorId, setSponsorId] = useState('')
    const [loading, setLoading] = useState(false)

    if (!open) return null

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        if (!userId) return toast.error('No user specified')
        setLoading(true)
        try {
            await setSponsor(userId!, sponsorId)
            toast.success('Sponsor updated')
            onSponsored?.()
            onClose()
        } catch (err: unknown) {
            const { message } = parseApiError(err)
            toast.error(String(message))
        } finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-2">Set Sponsor for {userId}</h3>
                <form onSubmit={submit} className="space-y-3">
                    <input required value={sponsorId} onChange={e => setSponsorId(e.target.value)} placeholder="Sponsor User ID" className="w-full border px-3 py-2 rounded" />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? 'Updating...' : 'Update'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
