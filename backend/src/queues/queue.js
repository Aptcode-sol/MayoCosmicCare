const { Queue } = require('bullmq');

// Only enable Redis if explicitly set to 'true'
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

let matchingQueue = null;
let receiptEmailQueue = null;

if (REDIS_ENABLED) {
    const IORedis = require('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    try {
        const connection = new IORedis(redisUrl, {
            maxRetriesPerRequest: null,
            lazyConnect: true
        });

        matchingQueue = new Queue('matching', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 }
            }
        });

        receiptEmailQueue = new Queue('receipt-email', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 10000 }
            }
        });
    } catch (err) {
        console.warn('Could not initialize queues:', err.message);
    }
}

// Export a wrapper that checks if queue is available
module.exports = {
    matchingQueue,
    receiptEmailQueue,
    addMatchingJob: async (userId) => {
        if (matchingQueue) {
            return await matchingQueue.add('process-matching', { userId });
        } else {
            // Fallback: process matching synchronously without queue
            console.log('Queue not available, processing matching synchronously for', userId);
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            try {
                const { processMatchingBonus } = require('../services/commissionService');
                await processMatchingBonus(prisma, userId);
            } catch (err) {
                console.error('Sync matching processing failed:', err.message);
            } finally {
                await prisma.$disconnect();
            }
        }
    },
    addReceiptEmailJob: async (orderId) => {
        if (receiptEmailQueue) {
            console.log(`[QUEUE] Enqueuing receipt email job for order: ${orderId}`);
            return await receiptEmailQueue.add('send-receipt', { orderId });
        } else {
            // Fallback: send receipt synchronously
            console.log('[QUEUE] Redis not available, sending receipt email synchronously for order:', orderId);
            try {
                const { getOrderDataForReceipt, renderReceiptHtml, generateReceiptPdf } = require('../services/receiptService');
                const { sendReceiptEmail } = require('../services/emailService');
                const prisma = require('../prismaClient');

                const orderData = await getOrderDataForReceipt(orderId);
                const order = await prisma.order.findUnique({
                    where: { id: orderId },
                    include: { user: true }
                });

                if (order && order.user) {
                    const html = renderReceiptHtml(orderData);
                    const pdfBuffer = await generateReceiptPdf(orderData);
                    await sendReceiptEmail(order.user.email, orderData.receiptNo, html, pdfBuffer);
                }
            } catch (err) {
                console.error('[QUEUE] Sync receipt email failed:', err.message);
            }
        }
    }
};

