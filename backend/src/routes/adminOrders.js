const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth'); // Assuming authorizeAdmin exists or check role manually

const checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// Get All Orders (Admin)
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { username: true, email: true }
                },
                items: true
            }
        });
        res.json(orders);
    } catch (error) {
        console.error('Admin Get Orders Error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Update Order Status / Tracking
router.patch('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { status, trackingNumber, carrier } = req.body;
        const orderId = req.params.id;

        const updateData = {};
        if (status) updateData.status = status;
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (carrier) updateData.carrier = carrier;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error('Admin Update Order Error:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

module.exports = router;
