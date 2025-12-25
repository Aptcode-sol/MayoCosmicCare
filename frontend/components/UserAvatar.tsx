"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getUser } from '../lib/services/users'
import { me } from '../lib/services/auth'

export default function UserAvatar() {
    const [username, setUsername] = useState('')
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        let mounted = true

        async function resolveName() {
            const token = localStorage.getItem('accessToken')
            if (!token) return

            // 1) Try decode token
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                const nameFromToken = payload.username || payload.name || ''
                if (nameFromToken) {
                    if (!mounted) return
                    setUsername(nameFromToken)
                    return
                }
            } catch {
                // ignore decode errors and continue to server fallbacks
            }

            // 2) Try /api/auth/me via axios service (ensures auth/refresh behavior is applied)
            try {
                const res = await me()
                const u = res?.user || res || null
                if (u?.username || u?.name) {
                    if (mounted) setUsername(u.username || u.name)
                    return
                }

                // 3) If only id returned, fetch public user record
                if (u?.id) {
                    try {
                        const ud = await getUser(u.id)
                        const full = ud?.user || ud
                        if (full?.username || full?.name) {
                            if (mounted) setUsername(full.username || full.name)
                            return
                        }
                    } catch {
                        // ignore
                    }
                }
            } catch {
                // ignore - user may be unauthenticated
            }

            if (mounted) setUsername('User')
        }

        resolveName()

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => { mounted = false; document.removeEventListener('mousedown', handleClickOutside) }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        toast.success('Logged out successfully')
        router.push('/login')
    }

    const initials = username
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition"
            >
                <div className="w-10 h-10 rounded-full bg-[#8b7355] flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
                    {initials}
                </div>
            </button>

            {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{username}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Manage your account</p>
                    </div>
                    <a
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                        Dashboard
                    </a>
                    <a
                        href="/dashboard/tree"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                        Network Tree
                    </a>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-200 mt-2"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}
