import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Footer from "@/components/Footer"

export default function Home() {
    return (
        <div className="bg-white">
            {/* Hero Section - Full Screen */}
            <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in-up">
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
                            <a href="/products">Shop Products</a>
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full" asChild>
                            <a href="/register">Become a Partner</a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Stats Section - Full Screen */}
            <section className="min-h-screen flex items-center justify-center bg-gray-950 px-6 border-y border-gray-900">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="text-center mb-24">
                        <h2 className="text-3xl lg:text-5xl font-light text-white mb-6 tracking-tight">
                            Trusted by Leading Partners
                        </h2>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto">
                            Join a rapidly growing community of wellness enthusiasts and entrepreneurs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <Card className="border-0 shadow-none bg-transparent">
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-6xl lg:text-7xl font-light text-white mb-2">10K+</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Active Partners</p>
                                <p className="mt-2 text-gray-500">Building their future</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-none bg-transparent md:border-x border-gray-800 rounded-none">
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-6xl lg:text-7xl font-light text-white mb-2">₹2M+</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Commissions Paid</p>
                                <p className="mt-2 text-gray-500">To our qualified partners</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-none bg-transparent">
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-6xl lg:text-7xl font-light text-white mb-2">50+</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Premium Products</p>
                                <p className="mt-2 text-gray-500">Curated for excellence</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Features Section - Full Screen */}
            <section className="min-h-screen flex items-center justify-center px-6 py-24">
                <div className="max-w-7xl mx-auto w-full">
                    <div className="text-center mb-24">
                        <h2 className="text-3xl lg:text-5xl font-light text-gray-900 mb-6 tracking-tight">
                            Designed for Your Success
                        </h2>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto">
                            We provide the tools and infrastructure you need to build a thriving business.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
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
                    </div>
                </div>
            </section>

            {/* CTA Section - Full Screen */}
            <section className="min-h-screen flex items-center justify-center bg-gray-950 px-6 py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl lg:text-7xl font-light text-white mb-8 tracking-tight leading-tight">
                        Ready to Transform<br />Your Future?
                    </h2>
                    <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
                        Join thousands of successful partners who have chosen Mayo Cosmic Care as their path to wellness and financial freedom.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-white text-gray-900 hover:bg-gray-100" asChild>
                            <a href="/register">Get Started Now</a>
                        </Button>
                        <Button variant="outline" size="lg" className="h-16 px-10 text-lg rounded-full bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white" asChild>
                            <a href="/products">View Products</a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    )
}

