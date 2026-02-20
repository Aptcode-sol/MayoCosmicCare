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

export async function verifyPayment(orderId: string): Promise<{ status: string; dbOrderId?: string }> {
    const res = await api.post('/api/payment/verify', { orderId });
    return res.data;
}

export async function downloadReceipt(dbOrderId: string): Promise<void> {
    try {
        const res = await api.get(`/api/receipt/${dbOrderId}/download`, {
            responseType: 'blob'
        });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receipt_${dbOrderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Receipt download failed:', err);
        throw err;
    }
}
