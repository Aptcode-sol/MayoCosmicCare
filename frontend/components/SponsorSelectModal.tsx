"use client"
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import useDebounce from '@/lib/useDebounce'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface Sponsor {
    id: string
    username: string
    email: string
}

interface SponsorSelectModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (sponsor: Sponsor) => void
}

export default function SponsorSelectModal({ isOpen, onClose, onSelect }: SponsorSelectModalProps) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<Sponsor[]>([])
    const [loading, setLoading] = useState(false)
    const debouncedQuery = useDebounce(query, 500)
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

    useEffect(() => {
        if (!isOpen) {
            setQuery('')
            setSuggestions([])
        }
    }, [isOpen])

    useEffect(() => {
        let mounted = true
        const search = async () => {
            if (!debouncedQuery || debouncedQuery.trim().length < 2) {
                setSuggestions([])
                return
            }
            setLoading(true)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/users/search?q=${encodeURIComponent(debouncedQuery)}`)
                if (res.ok) {
                    const data = await res.json()
                    if (mounted) {
                        setSuggestions(data.users || [])
                    }
                }
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        search()
        return () => { mounted = false }
    }, [debouncedQuery])

    if (!isOpen) return null

    // Create and manage a dedicated container for the portal so we don't rely on
    // direct use of document.body across synchronous render/unmounts.
    useEffect(() => {
        if (!isOpen) return
        if (typeof document === 'undefined') return
        const el = document.createElement('div')
        document.body.appendChild(el)
        setPortalContainer(el)
        return () => {
            // Only remove if still connected to avoid NotFoundError
            try {
                if (el.isConnected) document.body.removeChild(el)
            } catch (e) {
                // ignore cleanup errors
            }
            setPortalContainer(null)
        }
    }, [isOpen])

    if (!portalContainer) return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-white shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <CardHeader>
                    <CardTitle className="text-xl">Select a Sponsor</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        A sponsor is required for your first purchase to connect you to the network.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            placeholder="Search by ID, username, or email..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                        {loading && <p className="text-xs text-gray-500 animate-pulse">Searching...</p>}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 border-t pt-2">
                        {suggestions.length === 0 && query.length > 2 && !loading && (
                            <p className="text-sm text-center text-gray-500 py-4">No sponsors found.</p>
                        )}
                        {suggestions.map(sponsor => (
                            <div
                                key={sponsor.id}
                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 hover:border-indigo-200 cursor-pointer transition-colors group"
                                onClick={() => {
                                    // Check if the user searched for a specific placement code (username/id + digit)
                                    // If so, pass that CODE (query) as the ID so backend handles placement
                                    const q = query.trim();
                                    const isCode = /^\d$/.test(q.slice(-1));
                                    if (isCode) {
                                        const stripped = q.slice(0, -1);
                                        if (
                                            stripped.toLowerCase() === sponsor.username.toLowerCase() ||
                                            stripped === sponsor.id ||
                                            stripped.toLowerCase() === sponsor.email.toLowerCase()
                                        ) {
                                            onSelect({ ...sponsor, id: q }); // Send 'john0' instead of uuid
                                            return;
                                        }
                                    }
                                    onSelect(sponsor);
                                }}
                            >
                                <div className="overflow-hidden">
                                    <div className="font-medium text-gray-900 group-hover:text-indigo-700">{sponsor.username}</div>
                                    <div className="text-xs text-gray-500 truncate">{sponsor.email}</div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">ID: {sponsor.id}</div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-indigo-600">
                                    Select
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>,
        document.body
    )
}
