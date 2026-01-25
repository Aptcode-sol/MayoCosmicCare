import api from '../../lib/api';

export interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
}

export interface PaymentInitiateResponse {
    payment_session_id: string;
    order_id: string;
}

export async function createOrder(items: OrderItem[], sponsorId?: string): Promise<PaymentInitiateResponse> {
    const res = await api.post('/api/payment/create-order', { items, sponsorId });
    return res.data;
}

export async function verifyPayment(orderId: string): Promise<{ status: string }> {
    const res = await api.post('/api/payment/verify', { orderId });
    return res.data;
}
