"use client"
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function UserAvatar() {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { user, logout } = useAuth()

    // Get username from auth context
    const username = user?.username || user?.name || 'User'

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = () => {
        setDropdownOpen(false)
        logout()
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
