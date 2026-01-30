# Stress Test Purchase Modification - Revert Instructions

## What Changed

The `stress-test-custom.js` file has been modified to automatically complete mattress purchases for each user after registration. This temporarily bypasses the payment gateway for testing purposes.

## Modified Sections

All temporary changes are marked with clear comment blocks:

```javascript
// ============================================================================
// TEMPORARY: Auto-complete purchase (bypasses payment gateway)
// TODO: REMOVE THIS SECTION when payment gateway is fully integrated
// ============================================================================
```

## How to Revert (Restore Payment Gateway Flow)

### Option 1: Use the Backup File

```powershell
cd c:\Users\sanke\Documents\MLM\backend
Copy-Item stress-test-custom.js.backup stress-test-custom.js -Force
```

### Option 2: Manual Removal

Remove or comment out these specific sections:

**1. In `registerUser` function - Remove KYC bypass (around line 120-125):**

```javascript
// DELETE or COMMENT OUT these lines:
await prisma.user.update({
  where: { id: res.id },
  data: { kycStatus: "VERIFIED" },
});
```

**2. In `registerUser` function - Remove auto-purchase (around line 126-135):**

```javascript
// DELETE or COMMENT OUT these lines:
await makePurchase(res.id, email, password, productId);
```

**3. Remove the `makePurchase` function (around line 175-195):**

```javascript
// DELETE the entire makePurchase function and its comment block
```

**3. Restore original `markAsPurchased` call in `registerUser`:**

```javascript
// Add back after user registration:
await markAsPurchased(res.id);
```

**4. Remove `productId` parameter from:**

- `registerUser()` function signature
- `buildBinaryTree()` function signature
- All calls to `registerUser()` and `buildBinaryTree()`
- Remove `productId` from queue objects

## Current Behavior

- Each user is registered
- KYC status is automatically set to VERIFIED (bypasses KYC requirement)
- User is immediately logged in
- Purchase API is called (`/products/:productId/purchase`)
- Purchase completes instantly (bypassing payment gateway)
- Tree building continues

## After Reverting

- Users will need to complete payment through the Cashfree gateway
- The `hasPurchased` flag will only be set after successful payment
- Users without `hasPurchased=true` cannot sponsor others

## Files Modified

- `backend/stress-test-custom.js` (modified)
- `backend/stress-test-custom.js.backup` (original backup)
