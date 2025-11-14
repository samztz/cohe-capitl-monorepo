# 🧪 API Test Suite - Quick Reference

## 🚀 Run All Tests

```bash
./apps/api/tests/run-all-tests.sh
```

**Expected Output**: All tests pass with 100% success rate ✅

## 📊 Test Statistics

| Category | Count | Description |
|----------|-------|-------------|
| 📦 Unit Tests | 4 | Fast, isolated tests (no API needed) |
| 🔗 Integration Tests | 3 | API endpoint tests (requires API running) |
| 🎯 E2E Tests | 2 | Full workflow tests |
| **Total** | **9** | Complete test coverage |

## 🔍 Quick Test Commands

### Run by Type

```bash
# Unit tests only (fastest)
for f in tests/unit/*.test.js; do node "$f"; done

# Integration tests only (API must be running)
for f in tests/integration/*.test.{js,sh}; do
  [[ "$f" == *.sh ]] && bash "$f" || node "$f"
done

# E2E tests only
for f in tests/e2e/*.test.js; do node "$f"; done
```

### Run Individual Test

```bash
# Any JavaScript test
node tests/unit/siwe-nonce-format.test.js

# Shell script test
bash tests/integration/api-nonce-endpoint.test.sh
```

## 📁 Test File Locations

```
tests/
├── unit/
│   ├── siwe-basic.test.js              # SIWE message parsing basics
│   ├── siwe-nonce-format.test.js       # Nonce format validation
│   ├── siwe-message-format.test.js     # Message structure validation
│   └── siwe-message-builder.test.js    # Message builder function
│
├── integration/
│   ├── api-nonce-endpoint.test.sh      # /auth/siwe/nonce endpoint
│   ├── policy-api.test.js              # Policy CRUD endpoints
│   └── policy-api-auth.test.js         # Authenticated policy ops
│
└── e2e/
    ├── siwe-auth-flow.test.js          # Complete auth flow
    └── siwe-complete-flow.test.js      # Full verification test
```

## ⚡ Prerequisites

| Test Type | Requires API | Requires DB | Speed |
|-----------|--------------|-------------|-------|
| Unit | ❌ No | ❌ No | ⚡ <1s |
| Integration | ✅ Yes | ✅ Yes | 🐢 1-3s |
| E2E | ❌ No | ❌ No | ⚡ <1s |

**Start API**: `pnpm --filter api dev`

## 🎨 Output Legend

| Symbol | Meaning | Color |
|--------|---------|-------|
| ✓ | Test passed | 🟢 Green |
| ✗ | Test failed | 🔴 Red |
| ⚠ | Test skipped | 🟡 Yellow |
| ▶ | Test running | 🔵 Blue |

## 🐛 Common Issues

### "API server is NOT running"

**Solution**: Start the API server
```bash
cd apps/api
pnpm dev
```

### "Permission denied"

**Solution**: Make script executable
```bash
chmod +x tests/run-all-tests.sh
```

### Test fails unexpectedly

**Debug steps**:
1. Run the specific test alone: `node tests/unit/test-name.test.js`
2. Check test output for error details
3. Verify API is running (for integration tests)
4. Check database connection

## 📈 Success Metrics

**Healthy Project**:
- ✅ All tests pass (100%)
- ⏱️ Unit tests run in <1 second
- 🟢 No skipped tests (when API is running)

**Before Committing**:
```bash
./apps/api/tests/run-all-tests.sh
# ✓ ALL TESTS PASSED! 🎉
# Only then proceed with git commit
```

## 🔧 Adding New Tests

1. **Choose test type**: Unit/Integration/E2E
2. **Create file**: `tests/<type>/your-test.test.js`
3. **Follow pattern**: Exit 0 on success, 1 on failure
4. **Test it**: Run `run-all-tests.sh` to verify

**Template**:
```javascript
console.log('=== Your Test Name ===\n');

try {
  // Your test logic
  if (condition) {
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

## 📚 Full Documentation

See [README.md](./README.md) for complete documentation.

---

**Last Updated**: 2025-11-14
**Maintained by**: Cohe Capital Team
