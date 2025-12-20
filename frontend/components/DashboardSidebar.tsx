"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: 'home' },
    { href: '/team-overview', label: 'Team Stats', icon: 'users' },
    { href: '/incentives', label: 'Incentives', icon: 'gift' },
    { href: '/team-listing', label: 'Team Listing', icon: 'list' },
    { href: '/matching-report', label: 'Matching Report', icon: 'chart' },
    { href: '/wallet', label: 'Wallet', icon: 'wallet' },
]

const icons: Record<string, ReactNode> = {
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    gift: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />,
    list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    wallet: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
}

interface DashboardSidebarProps {
    user?: { username?: string; email?: string } | null
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
    const pathname = usePathname()

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-20 bg-white border-r border-gray-200">
                {/* User Info */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium text-sm">
                            {(user?.username || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.username || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {icons[item.icon]}
                                </svg>
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
                <div className="flex justify-around py-2">
                    {navItems.slice(0, 5).map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 px-3 py-2 text-xs ${isActive ? 'text-gray-900' : 'text-gray-500'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {icons[item.icon]}
                                </svg>
                                <span className="truncate">{item.label.split(' ')[0]}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
