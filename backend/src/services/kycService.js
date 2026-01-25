const axios = require('axios');
const prisma = require('../prismaClient');
const crypto = require('crypto');

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
const BASE_URL = process.env.CASHFREE_ENV === 'PROD'
    ? 'https://api.cashfree.com/verification'
    : 'https://sandbox.cashfree.com/verification';

async function getHeaders() {
    return {
        'x-client-id': CASHFREE_CLIENT_ID,
        'x-client-secret': CASHFREE_CLIENT_SECRET,
        'Content-Type': 'application/json'
    };
}

/**
 * Initialize KYC session by generating DigiLocker URL
 */
async function initKyc(userId) {
    if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
        throw new Error('KYC Configuration missing');
    }

    // verification_id max 50 chars
    // Format: "K_" + timestamp (13) + "_" + user_suffix (6) = ~22 chars
    const verificationId = 'K_' + Date.now() + '_' + userId.slice(-6);

    // Create URL API
    // https://www.cashfree.com/docs/api-reference/vrs/v2/digilocker/create-digilocker-url
    try {
        const payload = {
            verification_id: verificationId,
            document_requested: [
                "AADHAAR",
                "PAN"
            ],
            // Cashfree requires HTTPS. In dev, https://localhost:3000 might warn but satisfies API
            redirect_url: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard/profile` : 'https://localhost:3000/dashboard/profile'
        };

        const response = await axios.post(`${BASE_URL}/digilocker`, payload, {
            headers: await getHeaders()
        });
        console.log("called", response.data);
        // Response should contain the URL
        // API response structure: { link: "...", verification_id: "..." } usually
        // Adjust check to handle response.data.link or response.data.url
        const url = response.data.url || response.data.link;

        if (url) {
            // Update user record
            await prisma.user.update({
                where: { id: userId },
                data: {
                    kycRefId: verificationId,
                    kycStatus: "IN_PROGRESS"
                }
            });
            return { url: url, verificationId };
        } else {
            console.error('[KYC] Cashfree response error (no url/link):', response.data);
            throw new Error('Failed to generate KYC URL');
        }

    } catch (error) {
        console.error('[KYC] Init Error:', `${BASE_URL}/digilocker`, error.response?.status, error.response?.data || error.message);
        throw new Error('KYC Service Unavailable');
    }
}

/**
 * Check KYC Status and Fetch Documents if Verified
 */
async function checkStatus(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.kycRefId) {
        throw new Error('KYC not initiated');
    }

    try {
        // Get Verification Status
        // GET /digilocker?verification_id=...
        const statusRes = await axios.get(`${BASE_URL}/digilocker`, {
            headers: await getHeaders(),
            params: { verification_id: user.kycRefId }
        });

        const data = statusRes.data;
        // Possible statuses: PENDING, AUTHENTICATED, EXPIRED, CONSENT_DENIED
        // Note: Actual API response field might vary, adjusting based on typical Cashfree structure
        // Usually it returns { status: "AUTHENTICATED", ... }

        let newStatus = user.kycStatus;

        if (data.status === 'AUTHENTICATED' || data.status === 'SUCCESS') {
            newStatus = 'VERIFIED';
            console.log('[KYC] User Authenticated. Details:', data.user_details);

            // Fetch Documents
            let pan = user.pan;
            let aadhaar = user.aadhaar;

            // Try fetch AADHAAR
            try {
                // Endpoint: /digilocker/document/{document_type}?verification_id={verificationId}
                const docRes = await axios.get(`${BASE_URL}/digilocker/document/AADHAAR`, {
                    headers: await getHeaders(),
                    params: { verification_id: user.kycRefId }
                });
                if (docRes.data) {
                    console.log('[KYC] Aadhaar Doc Data:', docRes.data);
                    // Adjust based on actual response structure
                    const attrs = docRes.data.mapped_attributes || docRes.data;
                    aadhaar = attrs.uid || attrs.aadhaar_number || aadhaar;
                }
            } catch (e) {
                console.error('[KYC] Failed to fetch Aadhaar doc.', `${BASE_URL}/digilocker/document/AADHAAR`, e.response?.status, e.message);
            }

            // Try fetch PAN
            try {
                const docRes = await axios.get(`${BASE_URL}/digilocker/document/PAN`, {
                    headers: await getHeaders(),
                    params: { verification_id: user.kycRefId }
                });
                if (docRes.data) {
                    console.log('[KYC] PAN Doc Data:', docRes.data);
                    const attrs = docRes.data.mapped_attributes || docRes.data;
                    pan = attrs.pan_number || attrs.pan || pan;
                }
            } catch (e) {
                console.error('[KYC] Failed to fetch PAN doc.', `${BASE_URL}/digilocker/document/PAN`, e.response?.status, e.message);
            }

            await prisma.user.update({
                where: { id: userId },
                data: {
                    kycStatus: 'VERIFIED',
                    // Save name if we have it from status details
                    // username: data.user_details?.name || user.username, // Optional: don't overwrite username with real name unless desired
                    pan,
                    aadhaar
                }
            });

            return { status: 'VERIFIED', pan, aadhaar };

        } else if (data.status === 'CONSENT_DENIED' || data.status === 'EXPIRED' || data.status === 'FAILED') {
            newStatus = 'FAILED';
            await prisma.user.update({
                where: { id: userId },
                data: { kycStatus: 'FAILED' }
            });
        }

        return { status: user.kycStatus }; // Return current status if unchanged

    } catch (error) {
        console.error('[KYC] Status Check Error:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { initKyc, checkStatus };
