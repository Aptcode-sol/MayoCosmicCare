"use client";
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Button } from '@/components/ui/Button';
import { load } from '@cashfreepayments/cashfree-js';
import { createOrder, verifyPayment } from '../lib/services/payment';
import { me } from '../lib/services/auth';
import toast from 'react-hot-toast';
import SponsorSelectModal from './SponsorSelectModal';

export default function CartDrawer() {
    const { items, removeFromCart, total, isOpen, setIsOpen, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [sponsorModalOpen, setSponsorModalOpen] = useState(false);

    // Logic for Cashfree
    const processCheckout = async (sponsorId?: string) => {
        setLoading(true);
        try {
            // 0. Verify Auth & KYC
            let user;
            try {
                const res = await me();
                user = res.user || res;
            } catch (e) {
                toast.error('Please login to checkout');
                setLoading(false);
                return;
            }

            if (user.role !== 'ADMIN' && user.kycStatus !== 'VERIFIED') {
                toast.error('KYC Verification Required. Please complete KYC in your profile.');
                setTimeout(() => window.location.href = '/dashboard/profile', 2000);
                setLoading(false);
                return;
            }

            // 1. Sponsor Check
            const hasSponsor = user.sponsorId && user.sponsorId !== '';
            if (!hasSponsor && user.role !== 'ADMIN' && !sponsorId) {
                setSponsorModalOpen(true);
                setLoading(false);
                return;
            }

            // 2. Create Order
            const orderItems = items.map(i => ({
                productId: i.id,
                quantity: i.quantity,
                price: i.price
            }));

            const activeSponsorId = sponsorId || (hasSponsor ? undefined : undefined); // code handles it if passed

            const { payment_session_id, order_id } = await createOrder(orderItems, activeSponsorId);

            // 3. Open Cashfree
            const cashfree = await load({ mode: "sandbox" }); // Change to production in prod

            const checkoutOptions = {
                paymentSessionId: payment_session_id,
                redirectTarget: "_modal"
            };

            cashfree.checkout(checkoutOptions).then(async (result: any) => {
                if (result.error) {
                    console.log("User closed popup or error", result.error);
                    toast.error("Payment cancelled or failed");
                }
                if (result.paymentDetails) {
                    console.log("Payment Completed");
                    // Verify on server
                    try {
                        const verifyRes = await verifyPayment(order_id);
                        if (verifyRes.status === 'PAID') {
                            toast.success('Order Placed Successfully!');
                            clearCart();
                            setIsOpen(false);
                        } else {
                            toast.error('Payment status: ' + verifyRes.status);
                        }
                    } catch (e) {
                        toast.error('Verification failed. Please contact support if money deducted.');
                    }
                }
                setLoading(false);
            });

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Checkout failed');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Your Cart ({items.length})</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            Your cart is empty.
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex gap-4 border-b pb-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                                    <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-500 text-sm hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 border-t bg-gray-50">
                        <div className="flex justify-between items-center mb-4 text-lg font-semibold">
                            <span>Total</span>
                            <span>₹{total.toLocaleString()}</span>
                        </div>
                        <Button
                            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                            onClick={() => processCheckout()}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Proceed to Checkout'}
                        </Button>
                    </div>
                )}
            </div>

            <SponsorSelectModal
                isOpen={sponsorModalOpen}
                onClose={() => setSponsorModalOpen(false)}
                onSelect={(s) => {
                    setSponsorModalOpen(false);
                    processCheckout(s.id);
                }}
            />
        </div>
    );
}
