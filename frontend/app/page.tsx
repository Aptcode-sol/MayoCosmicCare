import { Button } from "@/components/ui/Button"
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import AnimateOnScroll from '@/components/AnimateOnScroll'

export default function Home() {
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

            {/* Bio Energy Mattress Product Section */}
            <section className="py-24 px-6 bg-gradient-to-b from-emerald-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <AnimateOnScroll animation="fade-up">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 mb-6">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-sm font-medium text-emerald-700">Featured Product</span>
                            </div>
                            <h2 className="text-4xl lg:text-6xl font-light text-gray-900 mb-6 tracking-tight">
                                Bio Energy <span className="font-semibold text-emerald-600">Mattress</span>
                            </h2>
                            <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                                World&apos;s most advanced natural rare earth bio energy technology for improved blood circulation and oxygen levels
                            </p>
                        </div>
                    </AnimateOnScroll>

                    {/* Main Features Grid */}
                    <div className="grid lg:grid-cols-3 gap-8 mb-16">
                        <AnimateOnScroll animation="fade-up" delay={0}>
                            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Blood Circulation</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Enhances smooth blood flow from head to toe, naturally improving oxygen delivery to all 78 vital organs
                                </p>
                            </div>
                        </AnimateOnScroll>

                        <AnimateOnScroll animation="fade-up" delay={150}>
                            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Energy Boost</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Absorbs glucose & fatty acids, converting them into high energy while reducing fatigue and tiredness
                                </p>
                            </div>
                        </AnimateOnScroll>

                        <AnimateOnScroll animation="fade-up" delay={300}>
                            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Deep Sleep</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Experience restorative deep sleep that helps your body heal, recover, and rejuvenate naturally
                                </p>
                            </div>
                        </AnimateOnScroll>
                    </div>

                    {/* Health Benefits */}
                    <AnimateOnScroll animation="fade-up" delay={100}>
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-10 lg:p-16">
                            <h3 className="text-3xl font-light text-white mb-10 text-center">
                                Comprehensive Health Benefits
                            </h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { icon: "💪", text: "Increases Strength & Resistance" },
                                    { icon: "🩸", text: "Controls BP & Cholesterol" },
                                    { icon: "🧠", text: "Improves Brain Health" },
                                    { icon: "🦴", text: "Helps Joint & Bone Pain" },
                                    { icon: "⚡", text: "Boosts Body Flexibility" },
                                    { icon: "🛡️", text: "EMF Radiation Protection" },
                                    { icon: "🌿", text: "Anti-Aging Benefits" },
                                    { icon: "✨", text: "Complete Body Detox" },
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                                        <span className="text-2xl">{benefit.icon}</span>
                                        <span className="text-white/90 text-sm font-medium">{benefit.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </AnimateOnScroll>

                    {/* Trust Badges */}
                    <AnimateOnScroll animation="fade-up" delay={200}>
                        <div className="flex flex-wrap justify-center gap-8 mt-16">
                            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md border border-gray-100">
                                <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium text-gray-700">100% Natural</span>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md border border-gray-100">
                                <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium text-gray-700">Scientifically Proven</span>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md border border-gray-100">
                                <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium text-gray-700">Zero Side Effects</span>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md border border-gray-100">
                                <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium text-gray-700">Drug-Free Therapy</span>
                            </div>
                        </div>
                    </AnimateOnScroll>

                    {/* CTA */}
                    <AnimateOnScroll animation="fade-up" delay={300}>
                        <div className="text-center mt-16">
                            <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-emerald-600 hover:bg-emerald-700" asChild>
                                <Link href="/products">Explore Bio Energy Mattress</Link>
                            </Button>
                        </div>
                    </AnimateOnScroll>
                </div>
            </section>

            {/* Stats Section - Full Screen */}
            <section className="min-h-screen flex items-center justify-center bg-gray-950 px-6 border-y border-gray-900">
                <div className="max-w-7xl mx-auto w-full">
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
                            <Card className="border-0 shadow-none bg-transparent md:border-x border-gray-800 rounded-none">
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
                                <h3 className="text-2xl font-light text-gray-900 mb-4">Binary Network</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Leverage our powerful binary structure to build balanced teams and maximize your earning potential through spillover.
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

            {/* CTA Section - Full Screen */}
            <section className="min-h-screen flex items-center justify-center bg-gray-950 px-6 py-24">
                <AnimateOnScroll animation="fade-up" className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl lg:text-7xl font-light text-white mb-8 tracking-tight leading-tight">
                        Ready to Transform<br />Your Future?
                    </h2>
                    <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
                        Join thousands of successful partners who have chosen Mayo Cosmic Care as their path to wellness and financial freedom.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-white text-gray-900 hover:bg-gray-100" asChild>
                            <Link href="/register">Get Started Now</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="h-16 px-10 text-lg rounded-full bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white" asChild>
                            <Link href="/products">View Products</Link>
                        </Button>
                    </div>
                </AnimateOnScroll>
            </section>
        </div>
    )
}
