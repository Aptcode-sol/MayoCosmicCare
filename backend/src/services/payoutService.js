const axios = require('axios');
const prisma = require('../prismaClient');

const CLIENT_ID = process.env.CASHFREE_PAYOUT_CLIENT_ID;
const CLIENT_SECRET = process.env.CASHFREE_PAYOUT_CLIENT_SECRET;
const ENV = process.env.CASHFREE_ENV === 'PROD' ? 'PROD' : 'TEST';

// Correct Payouts V2 Hosts
// const BASE_URL = ENV === 'PROD'
//     ? 'https://payout-api.cashfree.com'
//     : 'https://payout-gamma.cashfree.com';

const BASE_URL = 'https://payout-api.cashfree.com';

async function getHeaders() {
    return {
        'x-client-id': CLIENT_ID,
        'x-client-secret': CLIENT_SECRET,
        'x-api-version': '2024-01-01',
        'Content-Type': 'application/json'
    };
}

/**
 * Add Beneficiary (V2)
 * Endpoint: /payout/beneficiary
 */
async function addBeneficiary(user, bankDetails) {
    const beneId = `BENE_${user.id}`;

    // V2 Payload - Nested Structure
    const payload = {
        beneficiary_id: beneId,
        beneficiary_name: bankDetails.name || user.username,
        beneficiary_contact_details: {
            beneficiary_email: bankDetails.email || user.email,
            beneficiary_phone: bankDetails.phone || user.phone,
            beneficiary_address: "India"
        },
        beneficiary_instrument_details: {}
    };

    if (bankDetails.vpa) {
        payload.beneficiary_instrument_details.vpa = bankDetails.vpa;
    } else {
        payload.beneficiary_instrument_details.bank_account_number = bankDetails.accountInfo.bankAccount;
        payload.beneficiary_instrument_details.ifsc = bankDetails.accountInfo.ifsc;
    }

    try {
        // console.log('[PAYOUT] Adding beneficiary:', beneId);
        // Note: URL includes /payout context
        await axios.post(`${BASE_URL}/payout/beneficiary`, payload, { headers: await getHeaders() });
        return beneId;
    } catch (err) {
        if (err.response && err.response.status === 409) {
            // console.log('[PAYOUT] Beneficiary already exists, proceeding.');
            return beneId;
        }
        console.error('[PAYOUT] Add Beneficiary Failed:', err.response?.data || err.message);
        throw new Error('Failed to register beneficiary: ' + (err.response?.data?.message || err.message));
    }
}

async function requestPayout(userId, amount, bankDetails) {
    if (amount < 1000) throw new Error('Minimum withdrawal amount is 1000');

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < amount) throw new Error('Insufficient balance');

    const withdrawal = await prisma.withdrawal.create({
        data: {
            userId,
            amount,
            status: 'PENDING',
            bankDetails: JSON.stringify(bankDetails)
        }
    });

    await prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } }
    });

    return withdrawal;
}

async function executePayout(withdrawalId) {
    // ... validation ...
    const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: { user: true }
    });
    if (!withdrawal) throw new Error('Withdrawal not found');
    if (withdrawal.status !== 'PENDING') throw new Error('Withdrawal not pending');

    const bankDetails = JSON.parse(withdrawal.bankDetails || '{}');
    const isUpi = !!bankDetails.vpa;
    const isBank = !!(bankDetails.accountInfo?.bankAccount && bankDetails.accountInfo?.ifsc);

    if (!isUpi && !isBank) throw new Error('Invalid payout details');

    try {
        // 1. Add Beneficiary
        const beneId = await addBeneficiary(withdrawal.user, bankDetails);

        // 2. Init Transfer (V2 Direct)
        // detailed transferId logic to ensure <40 chars
        // Since we REJECT on failure, withdrawal.id is unique per attempt.
        const transferId = `TX_${withdrawal.id}`;

        const payload = {
            transfer_amount: withdrawal.amount,
            transfer_id: transferId,
            transfer_mode: isUpi ? "upi" : "banktransfer",
            transfer_remarks: "Payout",
            beneficiary_details: {
                beneficiary_id: beneId,
                beneficiary_name: bankDetails.name || withdrawal.user.username,
                beneficiary_contact_details: {
                    beneficiary_email: bankDetails.email || withdrawal.user.email,
                    beneficiary_phone: bankDetails.phone || withdrawal.user.phone,
                    beneficiary_address: "India"
                },
                beneficiary_instrument_details: isUpi ? { vpa: bankDetails.vpa } : {
                    bank_account_number: bankDetails.accountInfo.bankAccount,
                    ifsc: bankDetails.accountInfo.ifsc
                }
            }
        };
        // ... request ...

        // console.log('[PAYOUT] Initiating Transfer:', JSON.stringify(payload));
        const res = await axios.post(`${BASE_URL}/payout/transfers`, payload, { headers: await getHeaders() });
        let data = res.data;

        // 3. Update Status
        // console.log('[PAYOUT] Cashfree Response:', JSON.stringify(data, null, 2));

        // If RECEIVED, check status again immediately
        if (data.status === 'RECEIVED') {
            try {
                // console.log(`[PAYOUT] Status is RECEIVED, checking endpoint for update...`);
                // Short delay to allow propagation
                await new Promise(resolve => setTimeout(resolve, 1000));
                const statusRes = await axios.get(`${BASE_URL}/payout/transfers?transfer_id=${transferId}`, {
                    headers: await getHeaders()
                });
                data = statusRes.data;
                // console.log('[PAYOUT] Polled Status Response:', JSON.stringify(data, null, 2));
            } catch (pollErr) {
                console.warn('[PAYOUT] Could not poll status immediately:', pollErr.message);
            }
        }

        const validStatuses = ['SUCCESS', 'PENDING', 'PROCESSING', 'RECEIVED', 'APPROVAL_PENDING'];

        if (validStatuses.includes(data.status)) {
            // Map Cashfree Status to DB Status
            // PENDING/RECEIVED -> APPROVED (Processing)
            // SUCCESS -> COMPLETED
            let dbStatus = 'APPROVED';
            if (data.status === 'SUCCESS') {
                dbStatus = 'COMPLETED'; // New final status
            }

            await prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: dbStatus,
                    cfTransferId: data.cf_transfer_id || transferId,
                    cfStatus: data.status,
                    approvedAt: new Date(),
                    approvedBy: 'SYSTEM'
                } // Note: status 'APPROVED' here implies "Processing/Initiated" in our current flow unless we add a specific PROCESSING enum. 
                // But user asked for "pending -> transaction initiated -> Success/Failure".
                // 'APPROVED' currently serves as "Initiated".
            });
        } else {
            const reason = data.subCode || data.message || 'Unknown error';
            throw new Error(`Transfer failed: ${data.status} - ${reason}`);
        }

        return data;

    } catch (err) {
        console.error('[PAYOUT] Execution Failed:', err.response?.data || err.message);
        // Refund logic
        await prisma.$transaction([
            prisma.withdrawal.update({ where: { id: withdrawalId }, data: { status: 'REJECTED' } }),
            prisma.wallet.update({ where: { userId: withdrawal.userId }, data: { balance: { increment: withdrawal.amount } } })
        ]);
        throw new Error('Payout failed: ' + (err.response?.data?.message || err.message));
    }
}

async function checkTransferStatus(withdrawalId) {
    const withdrawal = await prisma.withdrawal.findUnique({
        where: { id: withdrawalId }
    });

    if (!withdrawal || !withdrawal.cfTransferId) {
        throw new Error('Withdrawal not found or no transfer ID');
    }

    try {
        const transferId = withdrawal.cfTransferId;

        let url = `${BASE_URL}/payout/transfers`;
        // Prefer our TransferID for lookup if possible, usually safer to query by what we sent if we have it
        // based on logs, we sent TX_..., and CF returns cf_transfer_id as numeric string.
        // API allows transfer_id (ours) or cf_transfer_id.
        // If we saved the CF ID (numeric), use it.
        const isCfId = /^\d+$/.test(transferId);

        if (isCfId) {
            url += `?cf_transfer_id=${transferId}`;
        } else {
            url += `?transfer_id=${transferId}`;
        }

        const res = await axios.get(url, { headers: await getHeaders() });
        const data = res.data;
        // console.log(`[PAYOUT] Polling Status for ${withdrawalId}: ${data.status}`);

        // Update DB based on new status
        // Cashfree 'SUCCESS' -> Web 'COMPLETED'
        // Cashfree 'FAILED' -> Web 'REJECTED' (Refund)

        if (data.status === 'SUCCESS' && withdrawal.status !== 'COMPLETED') {
            await prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: 'COMPLETED',
                    cfStatus: data.status
                }
            });
        } else if (['FAILED', 'REJECTED', 'REVERSED'].includes(data.status) && withdrawal.status !== 'REJECTED') {
            // console.log(`[PAYOUT] Marking withdrawal ${withdrawalId} as REJECTED due to ${data.status}`);
            await prisma.$transaction([
                prisma.withdrawal.update({
                    where: { id: withdrawalId },
                    data: { status: 'REJECTED', cfStatus: data.status }
                }),
                prisma.wallet.update({
                    where: { userId: withdrawal.userId },
                    data: { balance: { increment: withdrawal.amount } }
                })
            ]);
        } else if (data.status !== withdrawal.cfStatus) {
            // Just update cfStatus if it changed (e.g. RECEIVED -> PROCESSING)
            await prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: { cfStatus: data.status }
            });
        }

        return data;
    } catch (err) {
        console.error(`[PAYOUT] Check Status Failed for ${withdrawalId}:`, err.message);
        throw err;
    }
}

async function listWithdrawals(status) {
    const where = status ? { status } : {};
    return await prisma.withdrawal.findMany({
        where,
        include: { user: { select: { username: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' }
    });
}

module.exports = { requestPayout, executePayout, listWithdrawals, checkTransferStatus };
