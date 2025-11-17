export default function Home() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-24 lg:py-32 overflow-hidden">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                            <span className="block text-gray-900">Timeless Success</span>
                            <span className="block text-[#8b7355]">in Every Partnership</span>
                        </h1>
                        <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Build your network with elegance. Join a community where success meets sophistication, and every partnership is crafted with care.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="/products" className="btn-primary">
                                Explore Products
                            </a>
                            <a href="/register" className="btn-outline">
                                Join Network
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-[#f5f3f0]">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-[#8b7355] mb-2">10,000+</div>
                            <div className="text-gray-600 uppercase tracking-wide text-sm">Active Members</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-[#8b7355] mb-2">₹2M+</div>
                            <div className="text-gray-600 uppercase tracking-wide text-sm">Paid Out</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-[#8b7355] mb-2">50+</div>
                            <div className="text-gray-600 uppercase tracking-wide text-sm">Premium Products</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Exceptional <span className="text-[#8b7355]">Standards</span>
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            Our platform combines cutting-edge technology with timeless business principles to create lasting partnerships.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="elegant-card rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-[#8b7355]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Instant Commissions</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Earn direct bonuses instantly when your referrals make purchases. Real-time tracking and transparent payouts.
                            </p>
                        </div>

                        <div className="elegant-card rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-[#8b7355]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Binary Tree System</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Build balanced networks with our proven binary structure. Maximize earnings through strategic team placement.
                            </p>
                        </div>

                        <div className="elegant-card rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-[#8b7355]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-Time Dashboard</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Monitor your network, commissions, and growth with elegant, easy-to-use analytics and insights.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-[#f5f3f0]">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                            Start Your Journey
                        </h2>
                        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                            Join thousands of successful partners who have built their business with elegance and expertise. Your success story begins here.
                        </p>
                        <a href="/register" className="btn-primary">
                            Get Started Today
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        <div>
                            <div className="text-xl font-semibold text-gray-800 mb-4">
                                MLM <span className="text-[#8b7355]">Network</span>
                            </div>
                            <p className="text-sm text-gray-600">
                                Building partnerships with elegance and expertise since 2025.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-4 uppercase tracking-wide text-sm">Navigate</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/" className="text-gray-600 hover:text-[#8b7355] transition">Home</a></li>
                                <li><a href="/products" className="text-gray-600 hover:text-[#8b7355] transition">Products</a></li>
                                <li><a href="/dashboard" className="text-gray-600 hover:text-[#8b7355] transition">Dashboard</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-4 uppercase tracking-wide text-sm">Account</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/login" className="text-gray-600 hover:text-[#8b7355] transition">Login</a></li>
                                <li><a href="/register" className="text-gray-600 hover:text-[#8b7355] transition">Register</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-4 uppercase tracking-wide text-sm">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-gray-600 hover:text-[#8b7355] transition">Privacy Policy</a></li>
                                <li><a href="#" className="text-gray-600 hover:text-[#8b7355] transition">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 mt-12 pt-8 text-center">
                        <p className="text-sm text-gray-600">
                            © 2025 MLM Network. Crafted with passion and precision.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
