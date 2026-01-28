"use client"
import { ReactNode, useState, useEffect } from 'react'
import DashboardSidebar from './DashboardSidebar'

interface DashboardLayoutProps {
    children: ReactNode
    user?: { username?: string; name?: string; email?: string } | null
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
    // Initialize state from localStorage (SSR-safe)
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar_expanded') === 'true'
        }
        return false
    })

    // Persist state to localStorage
    useEffect(() => {
        localStorage.setItem('sidebar_expanded', String(isExpanded))
    }, [isExpanded])

    return (
        <div className="min-h-screen bg-gray-50 pt-12">
            <DashboardSidebar
                user={user}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
            />

            {/* Main Content */}
            <main className={`
                flex-1 pt-8 pb-20 lg:pb-8
                transition-all duration-300 ease-in-out
                ${isExpanded ? 'lg:ml-64' : 'lg:ml-20'}
            `}>
                <div className="container mx-auto px-4 lg:px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
