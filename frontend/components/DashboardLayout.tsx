"use client"
import { ReactNode, useState, useEffect } from 'react'
import DashboardSidebar from './DashboardSidebar'

interface DashboardLayoutProps {
    children: ReactNode
    user?: { username?: string; name?: string; email?: string } | null
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
    // Initialize state - default false for SSR
    const [isExpanded, setIsExpanded] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Load from localStorage after mount
    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem('sidebar_expanded')
        if (saved === 'true') {
            setIsExpanded(true)
        }
    }, [])

    // Persist state to localStorage
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('sidebar_expanded', String(isExpanded))
        }
    }, [isExpanded, mounted])

    return (
        <div className="min-h-screen bg-gray-50 pt-12">
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden fixed left-2 top-4 z-[60] p-2 mr-2 rounded-xl bg-transparent hover:bg-gray-100 transition-colors"
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
                setIsExpanded={setIsExpanded}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
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
