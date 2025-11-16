# Test Scripts

This folder contains manual test scripts for API testing and validation.

## Files

- **test-api.mjs** - API endpoint testing script (Node.js ES module)
- **test-policy-creation.sh** - Shell script for testing policy creation workflow
- **test-simple.sh** - Simple API test script

## Usage

### test-api.mjs
```bash
node scripts/tests/test-api.mjs
```

### test-policy-creation.sh
```bash
bash scripts/tests/test-policy-creation.sh
```

### test-simple.sh
```bash
bash scripts/tests/test-simple.sh
```

## Notes

These scripts are intended for manual testing and debugging during development. For automated testing, see the test suites in individual apps (e.g., `apps/api/test/`).
