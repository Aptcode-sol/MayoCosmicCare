"use client"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import UserAvatar from './UserAvatar'
import { Button } from "./ui/Button"

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    // Check auth status after hydration to avoid SSR mismatch
    useEffect(() => {
        try {
            setIsLoggedIn(!!localStorage.getItem('accessToken'))
        } catch {
            setIsLoggedIn(false)
        }
    }, [])

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <nav className="container mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-semibold text-gray-900 tracking-tight group-hover:text-gray-600 transition-colors">
                        Mayo Cosmic Care
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-10">
                    <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        Home
                    </Link>
                    <Link href="/products" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                        Products
                    </Link>
                    {isLoggedIn && (
                        <>
                            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/dashboard/tree" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                Network
                            </Link>
                        </>
                    )}
                </div>

                {/* Auth Section */}
                <div className="hidden md:flex items-center gap-4">
                    {isLoggedIn ? (
                        <UserAvatar />
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Get Started</Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden p-2 text-gray-500 hover:text-gray-900 transition"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {menuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 md:hidden shadow-lg animate-in slide-in-from-top-2">
                        <div className="flex flex-col gap-4">
                            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                Home
                            </Link>
                            <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                Products
                            </Link>
                            {isLoggedIn ? (
                                <>
                                    <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                        Dashboard
                                    </Link>
                                    <Link href="/dashboard/tree" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                        Network
                                    </Link>
                                    <div className="pt-4 border-t border-gray-100">
                                        <UserAvatar />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/login">Login</Link>
                                    </Button>
                                    <Button className="w-full" asChild>
                                        <Link href="/register">Get Started</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    )
}
