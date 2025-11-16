# Web Payment Page Integration Status

## ✅ Completed Work

### 1. Backend - Treasury Settings Module
**Location**: `apps/api/src/modules/settings/`

- ✅ Created Setting model in Prisma schema
- ✅ Created SettingsService with treasury address management
- ✅ Created SettingsController with API endpoints:
  - `GET /admin/settings/treasury` - Get treasury address
  - `PUT /admin/settings/treasury` - Update treasury address (Admin only)
- ✅ Integrated SettingsModule into AppModule
- ✅ Database migrated with `db push`
- ✅ API builds successfully

**Treasury Address Priority**:
1. Database (Setting table)
2. Environment variable (`TREASURY_ADDRESS`)
3. null (not configured - error)

### 2. Payment Assets Helper
**Location**: `apps/web/src/pay/assets.ts`

- ✅ Created `buildPaymentAsset()` function for AppKit Pay
- ✅ Supports native tokens (ETH, BNB) and ERC20 (USDT, USDC)
- ✅ Network identifier mapping (eip155:{chainId})
- ✅ Token metadata helpers
- ✅ Amount validation with precision control

### 3. Payment Page Structure
**Location**: `apps/web/src/app/policy/payment/[policyId]/page.tsx`

- ✅ Created payment page component
- ✅ Policy/Product data loading
- ✅ Treasury address fetching (API → env fallback)
- ✅ Payment gating logic (status, deadline, network checks)
- ✅ Manual txHash confirmation UI
- ✅ Pure HTML/CSS UI (no external UI library dependencies)

### 4. Configuration Updates
- ✅ Updated `apps/web/package.json` dev port to 3000 (AppKit Pay requirement)
- ✅ Installed `@reown/appkit-pay` package

## ⚠️ Pending Issues

### 1. AppKit Pay Integration
**Problem**: `usePay` hook not found in `@reown/appkit-pay` package

**Current Error**:
```
Type error: Module '"@reown/appkit-pay"' has no exported member 'usePay'.
```

**Possible Solutions**:
1. Check Reown AppKit Pay documentation for correct API usage
2. Verify package version compatibility
3. May need to use different import or API approach

**Alternative Approaches**:
- Use AppKit modal directly with payment config
- Use `@reown/appkit/react` with payment features
- Implement custom payment modal

### 2. Admin Settings Page
**Not Yet Implemented**: `apps/admin/app/(dashboard)/settings/page.tsx`

**Required Features**:
- Form to update treasury address
- Validation (0x + 40 hex characters)
- Success/error feedback
- i18n support (zh-TW)

### 3. Testing
**Not Yet Executed**:
- End-to-end payment flow
- AppKit Pay modal integration
- Treasury address API endpoints
- Payment confirmation flow

## 📋 Next Steps

### Immediate (Fix AppKit Pay Integration)

1. **Check Reown Documentation**:
   ```bash
   # Visit https://docs.reown.com/appkit/pay
   # Check correct API for payment modal
   ```

2. **Update Payment Page**:
   - Fix `usePay` import or use correct API
   - Test AppKit Pay modal opens
   - Verify payment asset format

3. **Alternative Implementation** (if `usePay` unavailable):
   ```typescript
   // Option 1: Use AppKit modal with payment config
   import { useAppKit } from '@reown/appkit/react'

   const { open } = useAppKit()
   await open({ view: 'Pay', ...paymentConfig })

   // Option 2: Use payment-specific modal
   import { openPaymentModal } from '@reown/appkit-pay'
   await openPaymentModal({ ... })
   ```

### Short-term (Complete Integration)

1. **Create Admin Settings Page**:
   ```typescript
   // apps/admin/app/(dashboard)/settings/page.tsx
   - Form with treasury address input
   - PUT /admin/settings/treasury on submit
   - Validation and feedback
   ```

2. **Enable Reown Dashboard Payments**:
   - Log in to https://cloud.reown.com
   - Navigate to Project → Payments
   - Enable payments feature
   - Configure payment assets

3. **Testing with Base Sepolia**:
   ```typescript
   // For initial testing, use Base Sepolia testnet
   const testAsset = buildPaymentAsset({
     chainId: 84532, // Base Sepolia
     tokenAddress: '0x0000000000000000000000000000000000000000',
     name: 'Test Insurance'
   })
   ```

4. **Verify Complete Flow**:
   - Admin approves policy → status = APPROVED_AWAITING_PAYMENT
   - User navigates to `/policy/payment/{id}`
   - Payment page loads with correct data
   - "Pay with Exchange" button opens AppKit Pay
   - Payment succeeds → backend confirms → policy ACTIVE
   - Fallback: manual txHash entry works

### Long-term (Production Readiness)

1. **Switch to Production Assets**:
   - Update `buildPaymentAsset` for BSC Mainnet (chainId: 56)
   - Configure USDT address: `0x55d398326f99059fF775485246999027B3197955`
   - Test with real BSC testnet (chainId: 97)

2. **Error Handling**:
   - Payment timeout handling
   - Network mismatch errors
   - Insufficient funds
   - Transaction failures

3. **Security Audit**:
   - Treasury address validation
   - Payment amount verification
   - txHash uniqueness checks
   - Replay attack prevention

## 🔧 Files Modified

### Backend
```
apps/api/prisma/schema.prisma (Added Setting model)
apps/api/src/app.module.ts (Added SettingsModule)
apps/api/src/modules/settings/settings.module.ts (New)
apps/api/src/modules/settings/settings.service.ts (New)
apps/api/src/modules/settings/settings.controller.ts (New)
apps/api/src/modules/settings/dto/update-treasury.dto.ts (New)
```

### Frontend
```
apps/web/package.json (Port 3030 → 3000)
apps/web/src/pay/assets.ts (New - Payment asset helpers)
apps/web/src/app/policy/payment/[policyId]/page.tsx (New - Payment page)
```

## 📖 Documentation References

- Reown AppKit: https://docs.reown.com/appkit
- AppKit Pay: https://docs.reown.com/appkit/pay
- AppKit React: https://docs.reown.com/appkit/react/core/installation

## 🚀 Quick Start for Testing

1. **Start Backend**:
   ```bash
   cd apps/api
   pnpm dev
   # Runs on http://localhost:3001
   ```

2. **Start Web App**:
   ```bash
   cd apps/web
   pnpm dev
   # Runs on http://localhost:3000 (Required for AppKit Pay)
   ```

3. **Configure Treasury** (via API or env):
   ```bash
   # Option 1: Environment variable
   echo "TREASURY_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" >> .env

   # Option 2: API (requires JWT token)
   curl -X PUT http://localhost:3001/admin/settings/treasury \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "Content-Type: application/json" \
     -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
   ```

4. **Test Payment Flow**:
   - Create policy → Admin approves → Navigate to payment page
   - URL: `http://localhost:3000/policy/payment/{policyId}`
   - Fix AppKit Pay integration first!

## ⚠️ Known Limitations

1. **Port Restriction**: Web app MUST run on port 3000 for AppKit Pay (Reown restriction)
2. **Network Support**: AppKit Pay may have limited BSC support - test with Base Sepolia first
3. **Wallet Connection**: Requires AppKit wallet connection before payment
4. **Admin Auth**: Treasury settings require JWT authentication

## 📝 Notes for Continuation

When resuming this work, prioritize:
1. Fix `usePay` import - check Reown docs for correct API
2. Test AppKit Pay modal opening
3. Create Admin settings page
4. End-to-end payment testing

The backend Treasury API is fully functional and tested. The frontend payment page structure is complete but needs AppKit Pay API fix.
