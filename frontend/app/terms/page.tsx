import Link from 'next/link'

export const metadata = {
    title: 'Terms of Service | Mayo Cosmic Care',
    description: 'Terms of Service for Mayo Cosmic Care Pvt Ltd — rules governing use of our platform, products, and partner network.',
}

export default function TermsOfServicePage() {
    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-4xl mx-auto px-6 py-24">
                {/* Header */}
                <div className="mb-12">
                    <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Back to Home</Link>
                    <h1 className="text-4xl font-light text-gray-900 mt-6 mb-3 tracking-tight">Terms of Service</h1>
                    <p className="text-gray-500 text-sm">Last updated: February 2025 &nbsp;|&nbsp; Effective Date: February 2025</p>
                    <div className="w-12 h-0.5 bg-gray-900 mt-6" />
                </div>

                <div className="prose prose-gray max-w-none space-y-10 text-gray-600 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
                        <p>
                            These Terms of Service ("Terms") constitute a legally binding agreement between you ("Partner",
                            "Member", or "User") and Mayo Cosmic Care Pvt Ltd ("Company", "we", "us", or "our").
                            By registering on our platform, purchasing a product, or using any of our services, you confirm
                            that you have read, understood, and agreed to be bound by these Terms and our{' '}
                            <Link href="/privacy" className="text-gray-900 underline">Privacy Policy</Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">2. About Mayo Cosmic Care</h2>
                        <p>
                            Mayo Cosmic Care Pvt Ltd is a direct selling company operating under a structured Multi-Level
                            Marketing (MLM) model in India. We sell premium wellness products — including Bio-Magnetic
                            Mattresses and related health/wellness items — through a network of independent partners who
                            earn commissions by purchasing products and introducing new members to the network.
                        </p>
                        <p className="mt-3">
                            We comply with the applicable laws governing direct selling businesses in India, including
                            guidelines issued by the Ministry of Consumer Affairs, Food and Public Distribution.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>You must be at least <strong>18 years of age</strong> to register as a partner or purchase products.</li>
                            <li>You must be a resident of India or a jurisdiction where our services are legally available.</li>
                            <li>You must provide accurate, truthful, and complete information during registration.</li>
                            <li>Each individual may only hold <strong>one partner account</strong>. Multiple accounts by the same person are prohibited.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Partner Registration & Sponsor Requirement</h2>
                        <p>
                            To become an active partner on the Mayo Cosmic Care network, you must:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Register using a valid <strong>Sponsor ID</strong> provided by an existing active partner. The sponsor is the person who introduced you to the network.</li>
                            <li>Complete your first product purchase, which activates your partner account and places you within the binary network tree.</li>
                            <li>Your placement in the network (left or right leg under your sponsor) determines your binary tree position and affects pair commission calculations.</li>
                        </ul>
                        <p className="mt-3 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100">
                            ⚠ <strong>Important:</strong> Registration alone does not entitle you to commissions. Your account must be activated through a product purchase
                            using a valid sponsor referral.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Products & Purchases</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>All products are sold at the listed price at the time of purchase. Prices are subject to change without prior notice.</li>
                            <li>Partners purchasing through the platform receive products at the <strong>partner price</strong>, which reflects the discounted rate available to network members.</li>
                            <li>Products are for personal use and genuine consumption. Purchasing solely to qualify for commissions without intent to use the product is prohibited.</li>
                            <li>All sales are final unless the product is defective or damaged in transit. Refund requests must be raised within 7 days of delivery.</li>
                            <li>The Company reserves the right to cancel orders that appear fraudulent or in violation of these Terms.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Commission & Earnings Structure</h2>
                        <h3 className="text-base font-semibold text-gray-800 mb-2">6.1 Types of Income</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Direct Bonus:</strong> Earned when you directly sponsor a new partner who makes their first purchase. Credited immediately to your wallet.</li>
                            <li><strong>Binary Matching Bonus:</strong> Earned based on the pairing of sales volume in your left and right legs. Pairs are calculated based on completed units on both sides of your binary tree.</li>
                            <li><strong>Leadership / Rank Bonus:</strong> Additional bonuses available when you achieve specific rank milestones (e.g., Associate Executive, Team Leader, Manager, Director, etc.) based on total pair counts within your network.</li>
                        </ul>

                        <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">6.2 Commission Rules</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Commissions are calculated based on actual verified purchases within your network. Unverified or cancelled orders do not count.</li>
                            <li>Tax Deducted at Source (TDS) will be deducted from commission payouts as per Indian Income Tax regulations.</li>
                            <li>The Company reserves the right to modify commission rates, eligibility criteria, and payout schedules with 30 days' notice to partners.</li>
                            <li>Commission manipulation, fraudulent referrals, or any attempt to game the system will result in immediate account termination and forfeiture of pending commissions.</li>
                        </ul>

                        <h3 className="text-base font-semibold text-gray-800 mt-5 mb-2">6.3 Earnings Disclaimer</h3>
                        <p className="text-sm bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                            Earnings from the network are not guaranteed. Your income depends entirely on your own sales
                            activity and the activity of your downline network. Past earnings of other partners are not
                            a guarantee of your future results. Mayo Cosmic Care does not promise fixed income or returns
                            of any kind.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Network & Referral Rules</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>You may refer as many new partners as you wish. There is no cap on the width of your direct referrals.</li>
                            <li>You are responsible for the accuracy of information you provide to prospective partners when introducing them to the business.</li>
                            <li><strong>You must not make false income claims, exaggerate earnings potential, or misrepresent the Company's products</strong> to recruit new members.</li>
                            <li>Buying or selling sponsor IDs, placement positions, or accounts is strictly prohibited and will result in permanent termination.</li>
                            <li>You must not recruit members under your network using coercive or deceptive tactics.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Wallet & Payouts</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Commissions are credited to your in-platform wallet. You may request a withdrawal at any time, subject to the minimum withdrawal threshold.</li>
                            <li>Payouts are processed to your registered bank account within the standard processing window (typically 3–7 business days).</li>
                            <li>You are responsible for providing accurate bank details. The Company is not liable for failed transfers due to incorrect information provided by you.</li>
                            <li>Wallet balances have no expiry. However, accounts inactive for more than 24 months may be subject to administrative review.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Account Suspension & Termination</h2>
                        <p>The Company may suspend or permanently terminate your account, without prior notice, if you:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>Provide false or misleading information during registration or KYC</li>
                            <li>Engage in fraudulent purchases or commission manipulation</li>
                            <li>Create multiple accounts</li>
                            <li>Violate any section of these Terms</li>
                            <li>Make defamatory or false statements about the Company or its products</li>
                            <li>Conduct any activity that brings the Company into legal or reputational risk</li>
                        </ul>
                        <p className="mt-3">Upon termination, pending commissions may be forfeited depending on the nature of the violation.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Prohibited Activities</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Impersonating another partner or Company representative</li>
                            <li>Using the platform to distribute spam, malware, or offensive content</li>
                            <li>Attempting to reverse-engineer or hack any part of the platform</li>
                            <li>Engaging in pyramid-scheme recruitment (focusing purely on recruitment with no real product sales)</li>
                            <li>Making medical or therapeutic claims about Company products that have not been approved by the Company</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, Mayo Cosmic Care Pvt Ltd shall not be liable for any
                            indirect, incidental, special, consequential, or punitive damages, including loss of income,
                            loss of data, or loss of business opportunity, arising from your use of or inability to use
                            our platform or services. Our total liability to you shall not exceed the amount paid by you
                            for the specific product or service that gave rise to the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law & Dispute Resolution</h2>
                        <p>
                            These Terms are governed by the laws of <strong>India</strong>. Any disputes arising from or
                            relating to these Terms shall be subject to the exclusive jurisdiction of the courts located
                            in India. We encourage partners to first contact our support team at{' '}
                            <a href="mailto:support@mayocosmiccare.com" className="text-gray-900 underline">support@mayocosmiccare.com</a>{' '}
                            to attempt to resolve disputes informally before pursuing legal action.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. Updated Terms will be posted on this
                            page with a revised effective date. Continued use of the platform after changes constitutes
                            acceptance. If changes materially affect your rights, we will notify you via email or an
                            in-platform notification.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Us</h2>
                        <p>For questions about these Terms or any platform-related concerns, contact us at:</p>
                        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="font-semibold text-gray-900">Mayo Cosmic Care Pvt Ltd</p>
                            <p className="text-sm mt-1">Email: <a href="mailto:support@mayocosmiccare.com" className="text-gray-700 underline">support@mayocosmiccare.com</a></p>
                            <p className="text-sm">India</p>
                        </div>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-100 flex gap-6 text-sm text-gray-400">
                    <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
                    <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
                </div>
            </div>
        </div>
    )
}
