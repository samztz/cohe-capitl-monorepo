# Cohe Capital API Test Suite

Complete test suite for the backend API, including SIWE authentication, policy management, and more.

## 📁 Directory Structure

```
tests/
├── unit/                           # Unit tests (isolated, no dependencies)
│   ├── siwe-basic.test.js         # Basic SIWE message parsing
│   ├── siwe-nonce-format.test.js  # Nonce format validation (UUID, alphanumeric)
│   ├── siwe-message-format.test.js # SIWE message format validation
│   └── siwe-message-builder.test.js # Message builder function tests
│
├── integration/                    # Integration tests (requires API running)
│   ├── api-nonce-endpoint.test.sh # API nonce endpoint validation
│   ├── policy-api.test.js         # Policy API endpoints
│   └── policy-api-auth.test.js    # Policy API with authentication
│
├── e2e/                            # End-to-end tests (full flow)
│   ├── siwe-auth-flow.test.js     # Complete SIWE authentication flow
│   └── siwe-complete-flow.test.js # Full verification test
│
├── run-all-tests.sh                # Main test runner script
└── README.md                       # This file
```

## 🚀 Quick Start

### Run All Tests

```bash
# From the api directory
./tests/run-all-tests.sh

# Or from monorepo root
./apps/api/tests/run-all-tests.sh
```

### Run Specific Test Types

```bash
# Unit tests only (no API required)
for test in tests/unit/*.test.js; do node "$test"; done

# Integration tests only (API must be running)
for test in tests/integration/*.test.{js,sh}; do
  if [[ "$test" == *.sh ]]; then bash "$test"; else node "$test"; fi
done

# E2E tests only
for test in tests/e2e/*.test.js; do node "$test"; done
```

### Run Individual Tests

```bash
# JavaScript tests
node tests/unit/siwe-nonce-format.test.js

# Shell script tests
bash tests/integration/api-nonce-endpoint.test.sh
```

## 📋 Prerequisites

### Unit Tests
- ✅ No dependencies
- ✅ Can run offline
- ✅ Fast execution

### Integration Tests
- ⚠️ **Requires API server running** on `http://localhost:3001`
- ⚠️ Requires database connection
- Start API with: `pnpm --filter api dev`

### E2E Tests
- ✅ No API dependency (simulates full flow)
- ✅ Tests message formatting and validation logic

## 📊 Test Output

The test runner provides:
- ✅ **Colored output** for easy reading
- ✅ **Progress indicators** for each test
- ✅ **Summary statistics** (total, passed, failed, skipped)
- ✅ **Progress bar** visualization
- ✅ **Exit codes** (0 = all passed, 1 = some failed)

### Example Output

```
╔══════════════════════════════════════════════════════════════╗
║           Cohe Capital API Test Suite Runner                ║
╚══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📦 Unit Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ Running: siwe-nonce-format
  ✓ PASSED

▶ Running: siwe-message-format
  ✓ PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔗 Integration Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ API server is running at http://localhost:3001

▶ Running: api-nonce-endpoint
  ✓ PASSED

╔══════════════════════════════════════════════════════════════╗
║                      Test Summary                            ║
╚══════════════════════════════════════════════════════════════╝

  ✓ [UNIT] siwe-nonce-format
  ✓ [UNIT] siwe-message-format
  ✓ [INTEGRATION] api-nonce-endpoint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total Tests:    9
  Passed:         9 (100%)
  Failed:         0 (0%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓  ALL TESTS PASSED! 🎉

  ████████████████████████████████████████ 100%
```

## 🔧 Test Categories

### Unit Tests (tests/unit/)

**Purpose**: Test individual functions and logic in isolation

**Tests**:
- `siwe-basic.test.js` - Basic SIWE message parsing
- `siwe-nonce-format.test.js` - Validates nonce format requirements
  - ❌ UUID with hyphens (e.g., `79ac432d-57ab-4a3b-a5aa-ff10e2d0e09a`)
  - ✅ UUID without hyphens (e.g., `79ac432d57ab4a3ba5aaff10e2d0e09a`)
  - ✅ Alphanumeric strings (e.g., `wD5bHPxpRSfXWkYNK8m3v`)
- `siwe-message-format.test.js` - Validates SIWE message structure
  - Statement placement
  - Blank line requirements
  - Line count validation
- `siwe-message-builder.test.js` - Tests message formatting function
  - With statement field
  - Without statement field
  - Correct blank line placement

### Integration Tests (tests/integration/)

**Purpose**: Test API endpoints with real server

**Tests**:
- `api-nonce-endpoint.test.sh` - Tests `/auth/siwe/nonce` endpoint
  - Validates response format
  - Checks nonce length (32 chars)
  - Verifies alphanumeric-only (no hyphens)
- `policy-api.test.js` - Tests policy CRUD operations
- `policy-api-auth.test.js` - Tests policy operations with JWT auth

### E2E Tests (tests/e2e/)

**Purpose**: Test complete workflows end-to-end

**Tests**:
- `siwe-auth-flow.test.js` - Complete SIWE authentication flow
  1. Backend generates nonce
  2. Frontend formats SIWE message
  3. Backend parses and validates
  4. Nonce verification matches
- `siwe-complete-flow.test.js` - Comprehensive verification
  - Nonce format validation
  - Message format validation
  - Backend simulation
  - E2E flow simulation

## 🛠️ Adding New Tests

### 1. Unit Test

Create `tests/unit/your-feature.test.js`:

```javascript
const { yourFunction } = require('../../dist/src/utils/yourModule');

console.log('=== Your Feature Test ===\n');

try {
  const result = yourFunction(testInput);

  if (result === expected) {
    console.log('✅ Test passed');
    process.exit(0);
  } else {
    console.log('❌ Test failed');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
```

### 2. Integration Test

Create `tests/integration/your-api.test.js`:

```javascript
const API_URL = 'http://localhost:3001';

async function testYourEndpoint() {
  const response = await fetch(`${API_URL}/your/endpoint`);

  if (!response.ok) {
    throw new Error('API request failed');
  }

  const data = await response.json();
  console.log('✅ API test passed');
  return true;
}

testYourEndpoint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
```

### 3. E2E Test

Create `tests/e2e/your-flow.test.js`:

```javascript
console.log('=== Your E2E Flow Test ===\n');

let allPassed = true;

// Step 1
console.log('Step 1: ...');
if (/* test condition */) {
  console.log('  ✅ PASS');
} else {
  console.log('  ❌ FAIL');
  allPassed = false;
}

// Step 2
console.log('Step 2: ...');
// ...

process.exit(allPassed ? 0 : 1);
```

## 📝 Best Practices

1. **Exit Codes**: Always use `process.exit(0)` for success, `process.exit(1)` for failure
2. **Clear Output**: Use emoji and clear messages (✅ ❌ ⚠️)
3. **Error Handling**: Wrap async code in try-catch
4. **Descriptive Names**: Use clear, descriptive test file names
5. **Isolated Tests**: Each test should be independent
6. **Fast Feedback**: Keep unit tests fast (<100ms each)

## 🐛 Troubleshooting

### Integration Tests Skipped

**Problem**: Tests show "API server is NOT running"

**Solution**:
```bash
# Start the API server in another terminal
cd apps/api
pnpm dev

# Or run in background
pnpm --filter api dev &
```

### Test Fails But Code Looks Correct

**Problem**: Test fails unexpectedly

**Debug Steps**:
1. Run the test individually with verbose output
2. Check console logs in the test file
3. Verify API server is running (for integration tests)
4. Check database connection
5. Review recent code changes

### Permission Denied

**Problem**: `./tests/run-all-tests.sh: Permission denied`

**Solution**:
```bash
chmod +x tests/run-all-tests.sh
```

## 📚 Related Documentation

- [SIWE Authentication Flow](../../docs/CHANGELOG.md)
- [API Documentation](../README.md)
- [Backend Architecture](../../docs/project_state.md)

## 🎯 CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run API Tests
  run: |
    cd apps/api
    pnpm install
    pnpm build
    pnpm dev &  # Start API in background
    sleep 5     # Wait for API to be ready
    ./tests/run-all-tests.sh
```

## 📊 Test Coverage Goals

- ✅ Unit Tests: >80% code coverage
- ✅ Integration Tests: All API endpoints
- ✅ E2E Tests: All critical user flows

---

**Maintained by**: Cohe Capital Team
**Last Updated**: 2025-11-14
