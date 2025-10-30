# SIWE Login Testing Guide

## 🎯 Test Objectives

Verify the complete SIWE (Sign-In with Ethereum) login flow works correctly from wallet connection to authenticated state.

## ✅ Acceptance Criteria Checklist

Based on the requirements, verify:

- [ ] **连接钱包成功后可立即发起签名请求**
- [ ] **签名被拒绝时显示友好错误提示**
- [ ] **签名成功后跳转到产品列表页面**
- [ ] **JWT 保存在 SecureStore，下次打开自动登录**
- [ ] **可以执行 logout 清除认证状态**
- [ ] **错误处理覆盖所有失败场景**

## 📱 Testing Steps

### 1. Initial State Test
1. **Fresh Install**
   - Kill any existing app instance
   - Clear app data/cache
   - Start app fresh

2. **Expected Behavior**
   - Shows "Connect Wallet" button
   - No user authenticated state
   - No errors displayed

### 2. Wallet Connection Flow
1. **Click "Connect Wallet"**
   - AppKit modal should open
   - Shows available wallets (MetaMask, Trust, etc.)

2. **Select Wallet & Connect**
   - Wallet app opens (or browser extension)
   - Approve connection request
   - Returns to app

3. **Expected Result**
   - Wallet connected state shown
   - Address displayed as `0xAb...1234` format
   - Automatically triggers SIWE signing

### 3. SIWE Signing Flow
1. **Automatic Sign Request**
   - After wallet connection, sign request appears
   - Message shows:
     ```
     localhost:3001 wants you to sign in with your Ethereum account:
     [your address]

     Sign in to Cohe Capital

     URI: http://localhost:3001
     Version: 1
     Chain ID: 97
     Nonce: [generated nonce]
     Issued At: [timestamp]
     ```

2. **Sign Message**
   - Review message in wallet
   - Approve signature

3. **Expected Result**
   - Shows "Signing in with wallet..." loading state
   - Backend verification occurs
   - Success: Shows "Signed In" with address
   - Auto-navigation to Products screen after 1 second

### 4. Error Scenarios

#### Test: User Rejects Signature
1. Connect wallet
2. When sign request appears, click "Reject"
3. **Expected**:
   - Error: "Sign-in cancelled"
   - Alert shown with error
   - Can retry by clicking "Sign In" button

#### Test: Network Error
1. Disconnect backend (stop API server)
2. Try to connect wallet
3. **Expected**:
   - Error: "Network error. Please check your connection"
   - Alert shown

#### Test: Expired Nonce
1. Wait for nonce to expire (if implemented)
2. Try to sign
3. **Expected**:
   - Error: "Login expired. Please try again"
   - Can retry connection

### 5. Persistence Test
1. **Successfully Login**
2. **Kill App Completely**
3. **Reopen App**
4. **Expected**:
   - Automatically authenticated
   - Shows user address
   - Navigates to Products screen
   - No need to reconnect wallet

### 6. Logout Test
1. **From Authenticated State**
2. **Trigger Logout** (if UI available)
3. **Expected**:
   - Returns to Connect screen
   - JWT cleared from SecureStore
   - Must reconnect to authenticate

## 🛠️ Debug Commands

### Check Mobile App Logs
```bash
# View React Native logs
npx react-native log-android
# or
npx react-native log-ios

# Check console logs in terminal running Metro
```

### Verify Backend SIWE Endpoints
```bash
# Test nonce endpoint
curl http://localhost:3001/auth/siwe/nonce

# Expected response:
{
  "nonce": "random-string",
  "domain": "localhost:3001",
  "uri": "http://localhost:3001",
  "chainId": 97
}
```

### Check Stored JWT
```javascript
// In React Native Debugger console:
import * as SecureStore from 'expo-secure-store';
const token = await SecureStore.getItemAsync('auth_jwt_token');
console.log('Stored JWT:', token);
```

## 🐛 Common Issues & Solutions

### Issue: Wallet doesn't open
- **Check**: Is wallet app installed on device?
- **Solution**: Install MetaMask/Trust Wallet
- **Alternative**: Use WalletConnect QR code scanning

### Issue: Sign request doesn't appear
- **Check**: Console for errors after connection
- **Check**: Is backend running on correct port?
- **Solution**: Ensure API_BASE_URL is correct

### Issue: 400 Error from pulse.walletconnect.org
- **Status**: Non-blocking, telemetry service
- **Impact**: None on core functionality
- **Can ignore**: Yes

### Issue: "Network error" on sign
- **Check**: Backend running?
- **Check**: Correct API_BASE_URL in .env?
- **Check**: Device can reach backend?
- **Solution**:
  ```bash
  # For physical device, use machine's IP
  EXPO_PUBLIC_API_BASE=http://192.168.1.100:3001
  ```

## 📊 Test Results Template

```markdown
## SIWE Login Test Results

**Date**: [DATE]
**Tester**: [NAME]
**Device**: [iOS/Android] [Version]
**Wallet**: [MetaMask/Trust/etc]

### Test Cases

| Test Case | Pass/Fail | Notes |
|-----------|-----------|-------|
| Initial state shows Connect button | ✅/❌ | |
| Wallet connection opens modal | ✅/❌ | |
| Connection triggers auto-sign | ✅/❌ | |
| Successful sign navigates to Products | ✅/❌ | |
| Reject signature shows error | ✅/❌ | |
| JWT persists after app restart | ✅/❌ | |
| Logout clears authentication | ✅/❌ | |

### Issues Found
1. [Describe any issues]

### Screenshots
[Attach relevant screenshots]
```

## 🚀 Running the Test

### Start Backend
```bash
# Terminal 1
pnpm --filter api dev
```

### Start Mobile App
```bash
# Terminal 2
pnpm --filter mobile start -- --clear
```

### Open on Device
- **iOS Simulator**: Press `i`
- **Android Emulator**: Press `a`
- **Physical Device**: Scan QR with Expo Go

## ✅ Success Criteria

The SIWE implementation is considered complete when:

1. ✅ All test cases pass
2. ✅ Error handling works for all scenarios
3. ✅ JWT persistence works correctly
4. ✅ UI states transition smoothly
5. ✅ No console errors during normal flow

## 📝 Notes

- Ensure both backend and mobile app are running
- Use BSC Testnet (chainId: 97) for testing
- Have test wallet with some BNB for gas (if needed)
- Backend must have SIWE endpoints implemented at `/auth/siwe/*`