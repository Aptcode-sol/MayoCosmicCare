"use client"
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import UserAvatar from './UserAvatar'
import { Button } from "./ui/Button"
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Header() {
    const pathname = usePathname()
    const { items, setIsOpen } = useCart()
    const { isLoggedIn, isLoading } = useAuth()
    const [mounted, setMounted] = useState(false)
    const [isHidden, setIsHidden] = useState(false)
    const lastScrollYRef = useRef(0)
    const tickingRef = useRef(false)
    const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path))

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const onScroll = () => {
            if (!tickingRef.current) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY

                    // Hide on scroll down, show on scroll up
                    // Only hide if we've scrolled more than 100px from top
                    if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
                        setIsHidden(true)
                    } else if (currentScrollY < lastScrollYRef.current) {
                        setIsHidden(false)
                    }

                    lastScrollYRef.current = currentScrollY
                    tickingRef.current = false
                })
                tickingRef.current = true
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty(
                '--header-offset',
                isHidden ? '0.75rem' : '4rem'
            )
        }
    }, [isHidden])

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-transform duration-300 ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
                <nav className={`w-full md:container md:mx-auto px-4 md:px-6 h-20 flex md:grid md:grid-cols-3 items-center ${mounted && !isLoading && !isLoggedIn ? 'justify-between' : 'justify-center md:justify-between'}`}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group min-w-0">
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <Image
                                src="/MCC_Light.png"
                                alt="Mayo Cosmic Care Logo"
                                fill
                                sizes="32px"
                                className="object-contain"
                            />
                        </div>
                        <span className="text-xl font-semibold text-gray-900 tracking-tight group-hover:text-gray-600 transition-colors">
                            <span className="hidden md:inline">Mayo Cosmic Care</span>
                            <span className="md:hidden text-md whitespace-nowrap">Mayo Cosmic Care</span>
                        </span>
                    </Link>

                    {/* Center Nav Links - truly centered */}
                    <div className="hidden md:flex items-center justify-center gap-10">
                        <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                            Home
                        </Link>
                        <Link href="/products" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                            Products
                        </Link>
                        {mounted && isLoggedIn && (
                            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                Dashboard
                            </Link>
                        )}
                    </div>

                    {/* Right - Cart + Auth */}
                    <div className="flex items-center justify-end gap-4">
                        {/* Cart Button - Only show when logged in */}
                        {mounted && isLoggedIn && (
                            <button
                                onClick={() => setIsOpen(true)}
                                className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors hidden md:inline-flex"
                            >
                                {/* Use same cart icon as mobile bottom nav */}
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {items.length > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                        {items.length}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Auth Section */}
                        <div className="hidden md:flex items-center gap-4">
                            {!mounted ? (
                                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                            ) : isLoading ? (
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

                        {/* Mobile Login Button - Only on mobile when not logged in */}
                        {mounted && !isLoading && !isLoggedIn && (
                            <div className="md:hidden">
                                <Button size="sm" asChild>
                                    <Link href="/login">Login</Link>
                                </Button>
                            </div>
                        )}

                    </div>
                </nav>
            </header>

            {/* Mobile Bottom Navigation Bar - Only when logged in */}
            {mounted && isLoggedIn && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[100] pb-safe">
                    <div className="flex items-center justify-around py-2 px-4">
                        <Link href="/" onClick={() => setIsOpen(false)} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${isActive('/') && !isActive('/dashboard') ? 'text-gray-900 bg-gray-100' : 'text-gray-500'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-xs font-medium">Home</span>
                        </Link>

                        <Link href="/products" onClick={() => setIsOpen(false)} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${isActive('/products') ? 'text-gray-900 bg-gray-100' : 'text-gray-500'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <span className="text-xs font-medium">Products</span>
                        </Link>

                        <button
                            onClick={() => setIsOpen(true)}
                            className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors text-gray-500 relative"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {items.length > 0 && (
                                <span className="absolute top-0 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                                    {items.length}
                                </span>
                            )}
                            <span className="text-xs font-medium">Cart</span>
                        </button>

                        <Link href="/dashboard" onClick={() => setIsOpen(false)} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${isActive('/dashboard') ? 'text-gray-900 bg-gray-100' : 'text-gray-500'}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span className="text-xs font-medium">Dashboard</span>
                        </Link>
                    </div>
                </div>
            )}
        </>
    )
}

