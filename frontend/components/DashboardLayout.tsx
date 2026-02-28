"use client"
import { ReactNode, useState, useEffect } from 'react'
import DashboardSidebar from './DashboardSidebar'

interface DashboardLayoutProps {
    children: ReactNode
    user?: { username?: string; name?: string; email?: string } | null
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
    // Initialize state from localStorage synchronously to prevent flash on navigation
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const pinned = localStorage.getItem('sidebar_pinned') === 'true'
            const expanded = localStorage.getItem('sidebar_expanded') === 'true'
            return pinned || expanded
        }
        return false
    })
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [isPinned, setIsPinned] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar_pinned') === 'true'
        }
        return false
    })

    // Persist state to localStorage
    useEffect(() => {
        localStorage.setItem('sidebar_expanded', String(isExpanded))
        localStorage.setItem('sidebar_pinned', String(isPinned))
    }, [isExpanded, isPinned])

    // Communicate sidebar width to Header layout
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty(
                '--sidebar-width',
                isExpanded ? '16rem' : '5rem'
            )
        }
        return () => {
            if (typeof document !== 'undefined') {
                document.documentElement.style.setProperty('--sidebar-width', '0px')
            }
        }
    }, [isExpanded])

    // Wrap setIsExpanded to enforce pinned-always-expanded logic without cascading renders
    const handleSetIsExpanded = (value: boolean | ((prev: boolean) => boolean)) => {
        setIsExpanded(prev => {
            const next = typeof value === 'function' ? value(prev) : value
            // Don't allow collapsing when pinned
            if (isPinned && !next) return true
            return next
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-12">
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                style={{ top: 'var(--header-offset, 4rem)' }}
                className="lg:hidden fixed left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Open menu"
            >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Mobile Sidebar Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <DashboardSidebar
                user={user}
                isExpanded={isExpanded}
                setIsExpanded={handleSetIsExpanded}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isHovering={isHovering}
                setIsHovering={setIsHovering}
                isPinned={isPinned}
                setIsPinned={setIsPinned}
            />

            {/* Main Content */}
            <main className={`
                flex-1 pt-8 pb-20 lg:pb-8
                transition-all duration-300 ease-in-out
                ${isExpanded ? 'lg:ml-64' : 'lg:ml-20'}
            `}>
                <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    )
}