"use client"
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import UserAvatar from './UserAvatar'
import { Button } from "./ui/Button"
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false)
    const { items, setIsOpen } = useCart()
    const { isLoggedIn, isLoading } = useAuth()

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <nav className="container mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative w-8 h-8">
                        <Image
                            src="/MCC2.png"
                            alt="Mayo Cosmic Care Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
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
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Cart Button - Only show when logged in */}
                    {isLoggedIn && (
                        <button
                            onClick={() => setIsOpen(true)}
                            className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            {items.length > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                    {items.length}
                                </span>
                            )}
                        </button>
                    )}

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center gap-4">
                        {isLoading ? (
                            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                        ) : isLoggedIn ? (
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
                </div>

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
