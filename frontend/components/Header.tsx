"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import UserAvatar from './UserAvatar'

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        setIsLoggedIn(!!token)
    }, [])

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <nav className="container mx-auto px-4 lg:px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="text-2xl font-semibold text-gray-800 tracking-tight">
                            MLM <span className="text-[#8b7355]">Network</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition uppercase tracking-wide">
                            Home
                        </Link>
                        <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition uppercase tracking-wide">
                            Products
                        </Link>
                        {isLoggedIn && (
                            <>
                                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition uppercase tracking-wide">
                                    Dashboard
                                </Link>
                                <Link href="/tree" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition uppercase tracking-wide">
                                    Network
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center gap-3">
                        {isLoggedIn ? (
                            <UserAvatar />
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition px-4 py-2">
                                    Login
                                </Link>
                                <Link href="/register" className="btn-primary text-sm">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 text-gray-700 hover:text-[#8b7355] transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200">
                        <div className="flex flex-col gap-4">
                            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition uppercase tracking-wide">
                                Home
                            </Link>
                            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition uppercase tracking-wide">
                                Products
                            </Link>
                            {isLoggedIn ? (
                                <>
                                    <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition uppercase tracking-wide">
                                        Dashboard
                                    </Link>
                                    <Link href="/tree" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition uppercase tracking-wide">
                                        Network
                                    </Link>
                                    <UserAvatar />
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-[#8b7355] transition">
                                        Login
                                    </Link>
                                    <Link href="/register" className="btn-primary text-sm inline-block text-center">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    )
}
