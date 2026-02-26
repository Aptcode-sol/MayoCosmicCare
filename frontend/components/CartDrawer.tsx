"use client";
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Button } from '@/components/ui/Button';
import { load } from '@cashfreepayments/cashfree-js';
import { createOrder, verifyPayment, downloadReceipt } from '../lib/services/payment';
import { me } from '../lib/services/auth';
import toast from 'react-hot-toast';
import SponsorSelectModal from './SponsorSelectModal';

export default function CartDrawer() {
    const { items, removeFromCart, updateQuantity, total, isOpen, setIsOpen, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Handle animation states
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true);
                });
            });
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Logic for Cashfree - KYC CHECK REMOVED (only needed for withdrawal)
    const processCheckout = async (sponsorId?: string) => {
        setLoading(true);
        try {
            // 0. Verify Auth only (no KYC check for purchase)
            let user;
            try {
                const res = await me();
                user = res.user || res;
            } catch (e) {
                toast.error('Please login to checkout');
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

            const activeSponsorId = sponsorId || (hasSponsor ? undefined : undefined);

            const { payment_session_id, order_id } = await createOrder(orderItems, activeSponsorId);

            // 3. Open Cashfree
            let cashfree: any = null
            try {
                if (typeof window === 'undefined') throw new Error('window is undefined')
                cashfree = await load({ mode: "production" }) // Change to production in prod
            } catch (err) {
                console.error('Cashfree load error', err)
                toast.error('Payment service unavailable')
                setLoading(false)
                return
            }

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
                    // console.log("Payment Completed");
                    try {
                        const verifyRes = await verifyPayment(order_id);
                        if (verifyRes.status === 'PAID') {
                            toast.success('Order Placed Successfully!');
                            clearCart();
                            setIsOpen(false);

                            // Auto-download receipt PDF
                            if (verifyRes.dbOrderId) {
                                const downloadToast = toast.loading('Generating receipt...');
                                try {
                                    await downloadReceipt(verifyRes.dbOrderId);
                                    toast.success('Receipt downloaded!', { id: downloadToast });
                                } catch {
                                    toast.dismiss(downloadToast);
                                    toast('Receipt download failed. You can download it from your orders.', { icon: 'ℹ️' });
                                }
                            }
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

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop with fade animation */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />

            {/* Drawer with slide animation */}
            <div className={`relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col transition-transform duration-300 ease-in-out will-change-transform ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Your Cart ({items.length})</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            <p>Your cart is empty.</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex gap-4 border-b pb-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{item.name}</h3>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                        </button>
                                        <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </div>

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
                    <div className="p-6 pb-24 md:pb-6 border-t bg-gray-50">
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
