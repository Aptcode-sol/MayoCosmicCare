"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode } from 'react'

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: 'home' },
    { href: '/dashboard/team-overview', label: 'Team Stats', icon: 'users' },
    { href: '/dashboard/incentives', label: 'Incentives', icon: 'gift' },
    { href: '/dashboard/transactions', label: 'Transactions', icon: 'receipt' },
    { href: '/dashboard/team-listing', label: 'Team Listing', icon: 'list' },
    { href: '/dashboard/matching-report', label: 'Matching Report', icon: 'chart' },
    { href: '/dashboard/wallet', label: 'Wallet', icon: 'wallet' },
    { href: '/dashboard/orders', label: 'Orders', icon: 'orders' },
    { href: '/dashboard/tree', label: 'Network', icon: 'tree' },
    { href: '/dashboard/profile', label: 'Profile', icon: 'profile' },
]

const icons: Record<string, ReactNode> = {
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    gift: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />,
    receipt: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    wallet: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    orders: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
    tree: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    profile: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
}

interface DashboardSidebarProps {
    user?: { username?: string; name?: string; email?: string } | null
    isExpanded: boolean
    setIsExpanded: (expanded: boolean) => void
    isMobileMenuOpen?: boolean
    setIsMobileMenuOpen?: (open: boolean) => void
    isHovering?: boolean
    setIsHovering?: (hovering: boolean) => void
    isPinned?: boolean
    setIsPinned?: (pinned: boolean) => void
}

export default function DashboardSidebar({
    user,
    isExpanded,
    setIsExpanded,
    isMobileMenuOpen = false,
    setIsMobileMenuOpen,
    isHovering = false,
    setIsHovering,
    isPinned = false,
    setIsPinned
}: DashboardSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        router.push('/login')
    }

    const handleMobileLinkClick = () => {
        if (setIsMobileMenuOpen) {
            setIsMobileMenuOpen(false)
        }
    }

    // Handle mouse enter on desktop sidebar
    const handleMouseEnter = () => {
        if (setIsHovering) {
            setIsHovering(true)
        }
        setIsExpanded(true)
    }

    // Handle mouse leave on desktop sidebar - only collapse if NOT pinned
    const handleMouseLeave = () => {
        if (setIsHovering) {
            setIsHovering(false)
        }
        if (!isPinned) {
            setIsExpanded(false)
        }
    }

    return (
        <>
            {/* Mobile Sidebar */}
            <aside
                className={`
                    lg:hidden fixed left-0 top-0 h-full w-64 flex flex-col
                    bg-white border-r border-gray-200 z-[120]
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Mobile Header with Close Button */}
                <div className="h-20 flex items-center justify-between px-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            M
                        </div>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">
                            MCC Dashboard
                        </span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen?.(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
                    {navItems.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={handleMobileLinkClick}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-gradient-to-r from-violet-50 to-pink-50 text-violet-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }
                                `}
                            >
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {icons[item.icon]}
                                </svg>
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Mobile Logout */}
                <div className="p-3 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {icons.logout}
                        </svg>
                        <span className="text-sm font-medium whitespace-nowrap">
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Desktop Sidebar - Hidden on mobile, visible on lg+ */}
            <aside
                className={`
                    hidden lg:flex fixed left-0 top-0 h-full flex-col
                    bg-white border-r border-gray-200
                    transition-all duration-300 ease-in-out z-[200]
                    ${isExpanded ? 'w-64' : 'w-20'}
                `}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Hamburger Header */}
                <div className="h-20 flex items-center border-b border-gray-100 transition-all duration-300" style={{ gap: '12px', paddingLeft: '12px', paddingRight: '12px' }}>
                    {/* Hamburger Icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </div>
                    {/* Menu Text - Fades with expand */}
                    <span className="font-semibold text-gray-900 whitespace-nowrap" style={{
                        opacity: isExpanded ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                        transitionDelay: isExpanded ? '0.1s' : '0s',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        pointerEvents: isExpanded ? 'auto' : 'none'
                    }}>
                        Menu
                    </span>
                    {/* Pin Button */}
                    {isExpanded && (
                        <button
                            onClick={() => setIsPinned && setIsPinned(!isPinned)}
                            className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                        >
                            <svg className={`w-5 h-5 ${isPinned ? 'text-blue-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
                                <path d="M14 5h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" opacity="0.5" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-colors duration-300 ease-in-out group relative ${isActive ? 'bg-white text-black shadow-lg border border-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                style={{ paddingLeft: '12px', paddingRight: '12px' }}
                                title={item.label}
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {icons[item.icon]}
                                </svg>
                                <span style={{
                                    opacity: isExpanded ? 1 : 0,
                                    transition: 'opacity 0.2s ease',
                                    transitionDelay: isExpanded ? '0.1s' : '0s',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    pointerEvents: isExpanded ? 'auto' : 'none'
                                }}>
                                    {item.label}
                                </span>

                                {/* Tooltip for collapsed state */}
                                {!isExpanded && (
                                    <div className="hidden group-hover:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User Section */}
                <div className="border-t border-gray-100 p-3">
                    <div className="flex items-center py-3" style={{ gap: '12px', paddingLeft: '12px', paddingRight: '12px' }}>
                        {/* Avatar with emerald gradient matching landing page */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-900 to-gray-600 flex items-center justify-center text-white font-medium text-xs shrink-0">
                            {(user?.name || user?.username || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        {/* User Info - Visible when expanded */}
                        <div
                            className={`
                                flex-1 min-w-0 transition-all duration-300 ease-in-out
                                ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                            `}
                        >
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || user?.username || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.username}</p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className={`w-full flex items-center gap-3 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-300 ease-in-out group relative`}
                        style={{ paddingLeft: '12px', paddingRight: '12px' }}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {icons.logout}
                        </svg>
                        <span
                            className={`
                                whitespace-nowrap transition-all duration-300 ease-in-out
                                ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}
                            `}
                        >
                            Logout
                        </span>

                        {/* Tooltip for collapsed state */}
                        {!isExpanded && (
                            <div className="hidden group-hover:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                                Logout
                            </div>
                        )}
                    </button>
                </div>
            </aside>
        </>
    )
}