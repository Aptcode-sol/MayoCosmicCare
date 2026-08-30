/**
 * Transaction sign helpers.
 *
 * The stored `amount` is not a reliable indicator of direction: WITHDRAW rows are
 * written negative, but PURCHASE rows are written as the positive product price
 * (backend/src/services/purchaseService.js). So direction comes from the type
 * first, and only falls back to the stored sign for anything not listed here.
 */
export const DEBIT_TX_TYPES = ['PURCHASE', 'WITHDRAW', 'ADMIN_DEBIT'];

export function isDebitTx(type, amount) {
    return DEBIT_TX_TYPES.includes(type) || Number(amount) < 0;
}
