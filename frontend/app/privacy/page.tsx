import Link from 'next/link'

export const metadata = {
    title: 'Privacy Policy | Mayo Cosmic Care',
    description: 'Privacy Policy for Mayo Cosmic Care Pvt Ltd — how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-4xl mx-auto px-6 py-24">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Back to Home</Link>
                    <h1 className="text-4xl font-light text-gray-900 mt-6 mb-3 tracking-tight">Privacy Policy</h1>
                    <p className="text-gray-500 text-sm">Last updated: February 2025 &nbsp;|&nbsp; Effective Date: February 2025</p>
                    <div className="w-12 h-0.5 bg-gray-900 mt-6" />
                </div>

                <div className="prose prose-gray max-w-none space-y-10 text-gray-600 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                        <p>
                            Mayo Cosmic Care Pvt Ltd ("Company", "we", "our", or "us") operates a direct selling and
                            multi-level marketing (MLM) platform at <strong>mayocosmiccare.com</strong>. This Privacy
                            Policy explains how we collect, use, disclose, and safeguard your information when you
                            register as a partner, purchase products, or use any service on our platform.
                        </p>
                        <p className="mt-3">
                            By registering or using our platform, you agree to the collection and use of your information
                            in accordance with this policy. If you do not agree, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
                        <h3 className="text-base font-semibold text-gray-800 mb-2">2.1 Registration & Identity</h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Full name, username, and email address</li>
                            <li>Phone number and residential address</li>
                            <li>Bank account or UPI details (for commission disbursement)</li>
                            <li>Government ID (if required for KYC and regulatory compliance)</li>
                            <li>Sponsor ID / Referral code used during registration</li>
                        </ul>

                        <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">2.2 Network & Business Activity</h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Your sponsor (upline) and the partners you've introduced (downline)</li>
                            <li>Binary tree position (left/right leg placement) and pair counts</li>
                            <li>Purchase history, order IDs, and product selections</li>
                            <li>Commission earnings, wallet balance, and payout history</li>
                            <li>Rank achievements and achievement milestones</li>
                        </ul>

                        <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">2.3 Technical Information</h3>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>IP address, browser type, and device information</li>
                            <li>Login timestamps and session activity</li>
                            <li>Pages visited and features used within the dashboard</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Management:</strong> To create and maintain your partner account, verify your identity, and provide customer support.</li>
                            <li><strong>Order Processing:</strong> To process product purchases, generate invoices, and manage deliveries.</li>
                            <li><strong>Network Tracking:</strong> To build and display your binary network tree, track referrals, and compute pair-matching for commissions.</li>
                            <li><strong>Commission Calculation:</strong> To calculate and credit direct bonuses, binary matching bonuses, leadership bonuses, and other incentives accurately.</li>
                            <li><strong>Payouts:</strong> To transfer commissions and bonuses to your registered bank account or wallet.</li>
                            <li><strong>Compliance:</strong> To fulfill legal, tax, and regulatory obligations, including TDS deductions where applicable under Indian tax law.</li>
                            <li><strong>Communication:</strong> To send OTP verifications, order confirmations, commission alerts, rank updates, and important platform notices.</li>
                            <li><strong>Platform Improvement:</strong> To analyze usage patterns and improve features, performance, and security of our platform.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Sharing of Information</h2>
                        <p>We do <strong>not</strong> sell your personal information to third parties. We may share your information only in the following limited circumstances:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong>Within your network (limited):</strong> Your username and sponsor ID may be visible to your downline members during registration. Your full personal details are never shared with your downline.</li>
                            <li><strong>Payment processors:</strong> Bank account details are shared with payment gateways solely for commission disbursement purposes.</li>
                            <li><strong>Legal authorities:</strong> If required by law, court order, or government regulation, we may disclose information to the relevant authorities.</li>
                            <li><strong>Service providers:</strong> Trusted third-party services (e.g., email services, SMS providers) used strictly to operate our platform — bound by confidentiality agreements.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
                        <p>
                            We retain your personal data for as long as your account is active or as required to provide
                            services. Financial records (transactions, commissions, payouts) are retained for a minimum of
                            7 years in compliance with Indian financial regulations. Upon account deletion, non-financial
                            personal data will be purged within 90 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
                        <p>
                            We implement industry-standard security measures including encrypted data transmission (HTTPS),
                            hashed password storage, OTP-based authentication, and secure session management. While we
                            strive to protect your data, no method of internet transmission is 100% secure and we cannot
                            guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li>Access the personal data we hold about you</li>
                            <li>Request correction of inaccurate information</li>
                            <li>Request deletion of your account and associated data (subject to legal retention requirements)</li>
                            <li>Opt out of non-essential communications</li>
                            <li>Lodge a complaint with the relevant data protection authority</li>
                        </ul>
                        <p className="mt-3">To exercise any of these rights, contact us at <strong>support@mayocosmiccare.com</strong>.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
                        <p>
                            Our platform is intended for adults (18 years and above). We do not knowingly collect personal
                            information from minors. If we discover that a minor has registered, we will immediately
                            deactivate the account and delete associated data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy periodically. Changes will be posted on this page with an
                            updated effective date. Continued use of the platform after changes constitutes acceptance of
                            the revised policy. We encourage partners to review this page periodically.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
                        <p>For any privacy-related questions or concerns, please contact:</p>
                        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="font-semibold text-gray-900">Mayo Cosmic Care Pvt Ltd</p>
                            <p className="text-sm mt-1">Email: <a href="mailto:support@mayocosmiccare.com" className="text-gray-700 underline">support@mayocosmiccare.com</a></p>
                            <p className="text-sm">India</p>
                        </div>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-100 flex gap-6 text-sm text-gray-400">
                    <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
                    <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
                </div>
            </div>
        </div>
    )
}
