"use client"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/Button"
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import AnimateOnScroll from '@/components/AnimateOnScroll'
import { listPublic } from '../lib/services/products'

export default function Home() {
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await listPublic()
                const products = res?.products ?? res ?? []

                // For now, let's treat products with keyFeatures or specific names as featured
                const featured = products.filter((p: any) =>
                    p.keyFeatures ||
                    p.name.toLowerCase().includes('mattress') ||
                    p.name.toLowerCase().includes('magnetic')
                )

                if (featured.length > 0) {
                    setFeaturedProducts(featured)
                }
            } catch (err) {
                console.error("Failed to fetch products for landing page:", err)
            }
        }
        fetchProducts()
    }, [])

    // Auto-scroll logic
    useEffect(() => {
        if (featuredProducts.length <= 1) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % featuredProducts.length)
        }, 5000) // Change every 5 seconds

        return () => clearInterval(interval)
    }, [featuredProducts])

    const currentProduct = featuredProducts[currentIndex]

    return (
        <div className="bg-white">
            {/* Hero Section - Full Screen */}
            <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
                <AnimateOnScroll animation="fade-up" className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100/80 mb-8 border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Welcome to Mayo Cosmic Care</span>
                    </div>

                    <h1 className="text-5xl lg:text-8xl font-light text-gray-900 mb-8 leading-[1.1] tracking-tight">
                        Premium Wellness<br />
                        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">Products</span>
                    </h1>

                    <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Discover our curated collection of premium wellness products and start your journey towards financial freedom with our partner network.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-full" asChild>
                            <Link href="/products">Shop Products</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full" asChild>
                            <Link href="/register">Become a Partner</Link>
                        </Button>
                    </div>
                </AnimateOnScroll>
            </section>

            {/* Dynamic Featured Product Section */}
            {currentProduct && (
                <section className="relative py-32 px-6 overflow-hidden bg-[#080808] min-h-[90vh] flex items-center">
                    {/* Dramatic radial glow backdrop */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px]" />
                        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-gray-500/10 rounded-full blur-[80px]" />
                        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gray-500/10 rounded-full blur-[80px]" />
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10 w-full">
                        {/* Header */}
                        <div className="text-center mb-32 relative h-[160px] flex flex-col items-center justify-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8 absolute top-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                <span className="text-xs font-semibold text-white/70 uppercase tracking-[0.2em]">Featured Selection</span>
                            </div>

                            {/* Title Container - We map all titles and absolute position them, fading in the active one */}
                            <div className="relative w-full h-[180px] lg:h-[120px] mt-12">
                                {featuredProducts.map((p, idx) => (
                                    <h2
                                        key={p.id}
                                        className={`absolute inset-0 text-5xl lg:text-8xl font-light text-white tracking-tight leading-[1.05] transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    >
                                        {p.name.split(' ').slice(0, -1).join(' ')}<br />
                                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
                                            {p.name.split(' ').slice(-1)}
                                        </span>
                                    </h2>
                                ))}
                            </div>
                        </div>

                        {/* Feature Cards */}
                        <div className="grid lg:grid-cols-3 gap-6 mb-20 relative">
                            {/* Map exactly 3 slots. In each slot, crossfade the feature for the current product. */}
                            {[0, 1, 2].map((cardIndex) => (
                                <div key={cardIndex} className="group relative rounded-2xl border border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 transition-all duration-500 overflow-hidden p-6 lg:p-10">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-2xl" />
                                    <span className="absolute top-4 right-6 text-7xl font-black text-white/5 select-none leading-none">{(cardIndex + 1).toString().padStart(2, '0')}</span>

                                    <div className="relative z-10 w-full grid">
                                        {featuredProducts.map((p, pIdx) => {
                                            const feature = (p.keyFeatures || '').split('\n').filter((f: string) => f.trim())[cardIndex];
                                            if (!feature) return null; // If a product has less than 3 features

                                            return (
                                                <div
                                                    key={`${p.id}-feature-${cardIndex}`}
                                                    className={`col-start-1 row-start-1 transition-opacity duration-1000 ease-in-out ${pIdx === currentIndex ? 'opacity-100 z-10 delay-150' : 'opacity-0 z-0 pointer-events-none'}`}
                                                >
                                                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-4 group-hover:translate-x-1 transition-transform">{feature.split(':')[0]}</h3>
                                                    <p className="text-gray-400 text-sm lg:text-base leading-relaxed line-clamp-3">{feature.includes(':') ? feature.split(':').slice(1).join(':').trim() : feature}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Description Section — dark panel with glow border */}
                        <div className="relative rounded-3xl border border-white/10 bg-white/5 p-10 lg:p-14 mb-20">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                            <div className="text-center relative flex flex-col items-center">
                                <h3 className="text-3xl lg:text-4xl font-light text-white tracking-tight mb-8">
                                    Comprehensive <span className="font-semibold">Description</span>
                                </h3>
                                {/* Mobile clamped, Desktop fully visible, Grid ensures consistent parent height without jumping */}
                                <div className="relative w-full grid">
                                    {featuredProducts.map((p, idx) => (
                                        <p
                                            key={`desc-${p.id}`}
                                            className={`col-start-1 row-start-1 text-lg lg:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed line-clamp-4 lg:line-clamp-none transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10 delay-300' : 'opacity-0 z-0 pointer-events-none'}`}
                                        >
                                            {p.description}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Navigation dots and CTA */}
                        <div className="flex flex-col items-center gap-8 relative z-20">
                            {featuredProducts.length > 1 && (
                                <div className="flex gap-2 mb-4">
                                    {featuredProducts.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentIndex(i)}
                                            className={`w-2 h-2 rounded-full transition-all duration-500 ${currentIndex === i ? 'bg-white w-8' : 'bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                            )}
                            {/* Crossfading Buttons */}
                            <div className="relative h-14 w-[300px] flex justify-center">
                                {featuredProducts.map((p, idx) => (
                                    <div
                                        key={`btn-${p.id}`}
                                        className={`absolute transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                                    >
                                        <Button size="lg" className="h-14 px-12 text-base rounded-full bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all duration-300" asChild>
                                            <Link href={`/products/${p.id}`}>Explore {p.name} →</Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Stats Section - Full Screen */}

            {/* Features Section - Full Screen */}
            <section className="min-h-screen flex items-center justify-center px-6 py-24">
                <div className="max-w-7xl mx-auto w-full">
                    <AnimateOnScroll animation="fade-up">
                        <div className="text-center mb-24">
                            <h2 className="text-3xl lg:text-5xl font-light text-gray-900 mb-6 tracking-tight">
                                Designed for Your Success
                            </h2>
                            <p className="text-gray-500 text-lg max-w-xl mx-auto">
                                We provide the tools and infrastructure you need to build a thriving business.
                            </p>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <AnimateOnScroll animation="fade-up" delay={0}>
                            <div className="group p-8 rounded-2xl transition hover:bg-gray-50">
                                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 group-hover:bg-gray-200">
                                    <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-light text-gray-900 mb-4">Instant Commissions</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Experience the speed of real-time payouts. Direct bonuses are credited instantly when your referrals make a purchase.
                                </p>
                            </div>
                        </AnimateOnScroll>

                        <AnimateOnScroll animation="fade-up" delay={150}>
                            <div className="group p-8 rounded-2xl transition hover:bg-gray-50">
                                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 group-hover:bg-gray-200">
                                    <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-light text-gray-900 mb-4">Team Network Structure</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Leverage our powerful two-tier team structure to build balanced teams and maximize your earning potential through spillover.
                                </p>
                            </div>
                        </AnimateOnScroll>

                        <AnimateOnScroll animation="fade-up" delay={300}>
                            <div className="group p-8 rounded-2xl transition hover:bg-gray-50">
                                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 group-hover:bg-gray-200">
                                    <svg className="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-light text-gray-900 mb-4">Analytics Dashboard</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Monitor your business growth with our comprehensive dashboard. Track sales, team performance, and commissions in real-time.
                                </p>
                            </div>
                        </AnimateOnScroll>
                    </div>
                </div>
            </section>

            {/* Stats Section - Full Screen */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080808] px-6 py-24 sm:py-32">
                {/* Radial glow backdrop matching product section */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/5 rounded-full blur-[120px]" />
                    <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-gray-500/10 rounded-full blur-[80px]" />
                    <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-gray-500/10 rounded-full blur-[80px]" />
                </div>
                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <AnimateOnScroll animation="fade-up">
                        <div className="text-center mb-24">
                            <h2 className="text-3xl lg:text-5xl font-light text-white mb-6 tracking-tight">
                                Trusted by Leading Partners
                            </h2>
                            <p className="text-gray-400 text-lg max-w-xl mx-auto">
                                Join a rapidly growing community of wellness enthusiasts and entrepreneurs.
                            </p>
                        </div>
                    </AnimateOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <AnimateOnScroll animation="fade-up" delay={0}>
                            <Card className="border-0 shadow-none bg-transparent">
                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-6xl lg:text-7xl font-light text-white mb-2">10K+</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Active Partners</p>
                                    <p className="mt-2 text-gray-500">Building their future</p>
                                </CardContent>
                            </Card>
                        </AnimateOnScroll>

                        <AnimateOnScroll animation="fade-up" delay={150}>
                            <Card className="border-0 shadow-none bg-transparent md:border-x border-white/10 rounded-none">
                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-6xl lg:text-7xl font-light text-white mb-2">₹2M+</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Commissions Paid</p>
                                    <p className="mt-2 text-gray-500">To our qualified partners</p>
                                </CardContent>
                            </Card>
                        </AnimateOnScroll>

                        <AnimateOnScroll animation="fade-up" delay={300}>
                            <Card className="border-0 shadow-none bg-transparent">
                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-6xl lg:text-7xl font-light text-white mb-2">50+</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Premium Products</p>
                                    <p className="mt-2 text-gray-500">Curated for excellence</p>
                                </CardContent>
                            </Card>
                        </AnimateOnScroll>
                    </div>
                </div>
            </section>


            {/* CTA Section - Full Screen */}
            <section className="min-h-screen flex items-center justify-center bg-white px-6 py-24">
                <AnimateOnScroll animation="fade-up" className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl lg:text-7xl font-light text-gray-900 mb-8 tracking-tight leading-tight">
                        Ready to Transform<br />Your Future?
                    </h2>
                    <p className="text-xl text-gray-500 mb-12 max-w-xl mx-auto leading-relaxed">
                        Join thousands of successful partners who have chosen Mayo Cosmic Care as their path to wellness and financial freedom.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-gray-900 text-white hover:bg-gray-800" asChild>
                            <Link href="/register">Get Started Now</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="h-16 px-10 text-lg rounded-full bg-transparent text-gray-900 border-gray-200 hover:bg-gray-50" asChild>
                            <Link href="/products">View Products</Link>
                        </Button>
                    </div>
                </AnimateOnScroll>
            </section>
        </div >
    )
}
