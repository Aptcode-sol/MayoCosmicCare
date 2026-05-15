"use client"
import { usePathname } from 'next/navigation'
import Footer from './Footer'

const AUTH_PATHS = ['/login', '/register']

export default function FooterClient() {
    const pathname = usePathname()
    if (AUTH_PATHS.includes(pathname)) return null
    return <Footer />
}
