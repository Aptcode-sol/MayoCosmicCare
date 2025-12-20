"use client"
import { ReactNode } from 'react'
import DashboardSidebar from './DashboardSidebar'

interface DashboardLayoutProps {
    children: ReactNode
    user?: { username?: string; email?: string } | null
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardSidebar user={user} />

            {/* Main Content */}
            <main className="lg:pl-64 pt-20 pb-20 lg:pb-8">
                <div className="container mx-auto px-4 lg:px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
