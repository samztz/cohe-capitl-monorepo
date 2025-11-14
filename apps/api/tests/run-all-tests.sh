#!/bin/bash

# ============================================
# Cohe Capital API Test Suite
# ============================================
# Comprehensive test runner for backend API
# Tests SIWE authentication, policy APIs, etc.
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Test results array
declare -a TEST_RESULTS

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║                                                              ║${NC}"
echo -e "${BOLD}${CYAN}║           Cohe Capital API Test Suite Runner                ║${NC}"
echo -e "${BOLD}${CYAN}║                                                              ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section header
print_section() {
    echo ""
    echo -e "${BOLD}${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${MAGENTA}  $1${NC}"
    echo -e "${BOLD}${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to run a test
run_test() {
    local test_file="$1"
    local test_name="$2"
    local test_type="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "${BLUE}▶${NC} Running: ${BOLD}$test_name${NC}"

    local output
    local exit_code

    # Run the test and capture output
    if [[ "$test_file" == *.sh ]]; then
        # Shell script test
        output=$(bash "$test_file" 2>&1)
        exit_code=$?
    else
        # JavaScript test
        output=$(node "$test_file" 2>&1)
        exit_code=$?
    fi

    # Check result
    if [ $exit_code -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} ${GREEN}PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("${GREEN}✓${NC} [$test_type] $test_name")
    else
        echo -e "  ${RED}✗${NC} ${RED}FAILED${NC}"
        echo -e "  ${RED}Error output:${NC}"
        echo "$output" | sed 's/^/    /' | head -20
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("${RED}✗${NC} [$test_type] $test_name - FAILED")
    fi

    echo ""
}

# ============================================
# Unit Tests
# ============================================
print_section "📦 Unit Tests"

if [ -d "$SCRIPT_DIR/unit" ]; then
    for test_file in "$SCRIPT_DIR/unit"/*.test.js; do
        if [ -f "$test_file" ]; then
            test_name=$(basename "$test_file" .test.js)
            run_test "$test_file" "$test_name" "UNIT"
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} No unit tests found"
fi

# ============================================
# Integration Tests
# ============================================
print_section "🔗 Integration Tests"

# Check if API is running
API_URL="http://localhost:3001"
if curl -s "$API_URL/health" > /dev/null 2>&1 || curl -s "$API_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API server is running at $API_URL"
    echo ""

    if [ -d "$SCRIPT_DIR/integration" ]; then
        for test_file in "$SCRIPT_DIR/integration"/*.test.{js,sh}; do
            if [ -f "$test_file" ]; then
                test_name=$(basename "$test_file" | sed 's/\.test\.\(js\|sh\)$//')
                run_test "$test_file" "$test_name" "INTEGRATION"
            fi
        done
    else
        echo -e "${YELLOW}⚠${NC} No integration tests found"
    fi
else
    echo -e "${YELLOW}⚠${NC} API server is NOT running at $API_URL"
    echo -e "${YELLOW}  Skipping integration tests...${NC}"
    echo -e "${YELLOW}  Start API with: pnpm --filter api dev${NC}"

    # Count skipped tests
    if [ -d "$SCRIPT_DIR/integration" ]; then
        for test_file in "$SCRIPT_DIR/integration"/*.test.{js,sh}; do
            if [ -f "$test_file" ]; then
                TOTAL_TESTS=$((TOTAL_TESTS + 1))
                SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
                test_name=$(basename "$test_file" | sed 's/\.test\.\(js\|sh\)$//')
                TEST_RESULTS+=("${YELLOW}⊘${NC} [INTEGRATION] $test_name - SKIPPED")
            fi
        done
    fi
fi

# ============================================
# E2E Tests
# ============================================
print_section "🎯 End-to-End Tests"

if [ -d "$SCRIPT_DIR/e2e" ]; then
    for test_file in "$SCRIPT_DIR/e2e"/*.test.js; do
        if [ -f "$test_file" ]; then
            test_name=$(basename "$test_file" .test.js)
            run_test "$test_file" "$test_name" "E2E"
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} No E2E tests found"
fi

# ============================================
# Test Summary
# ============================================
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║                      Test Summary                            ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Print all test results
for result in "${TEST_RESULTS[@]}"; do
    echo -e "  $result"
done

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Calculate percentages
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_PERCENT=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    FAIL_PERCENT=$((FAILED_TESTS * 100 / TOTAL_TESTS))
    SKIP_PERCENT=$((SKIPPED_TESTS * 100 / TOTAL_TESTS))
else
    PASS_PERCENT=0
    FAIL_PERCENT=0
    SKIP_PERCENT=0
fi

# Print statistics
echo -e "  ${BOLD}Total Tests:${NC}    $TOTAL_TESTS"
echo -e "  ${GREEN}${BOLD}Passed:${NC}         $PASSED_TESTS (${PASS_PERCENT}%)"
echo -e "  ${RED}${BOLD}Failed:${NC}         $FAILED_TESTS (${FAIL_PERCENT}%)"
if [ $SKIPPED_TESTS -gt 0 ]; then
    echo -e "  ${YELLOW}${BOLD}Skipped:${NC}        $SKIPPED_TESTS (${SKIP_PERCENT}%)"
fi

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Print final result with progress bar
if [ $TOTAL_TESTS -eq 0 ]; then
    echo -e "${YELLOW}⚠  No tests found${NC}"
    exit 0
elif [ $FAILED_TESTS -eq 0 ] && [ $SKIPPED_TESTS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓  ALL TESTS PASSED!${NC} 🎉"
    echo ""
    # Print progress bar
    echo -e "  ${GREEN}████████████████████████████████████████${NC} 100%"
    echo ""
    exit 0
elif [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${YELLOW}${BOLD}⚠  TESTS PASSED (with skips)${NC}"
    echo ""
    # Print progress bar
    bar_length=40
    filled=$((PASSED_TESTS * bar_length / TOTAL_TESTS))
    empty=$((bar_length - filled))
    printf "  ${GREEN}"
    printf '█%.0s' $(seq 1 $filled)
    printf "${YELLOW}"
    printf '░%.0s' $(seq 1 $empty)
    printf "${NC} ${PASS_PERCENT}%%\n"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}✗  SOME TESTS FAILED${NC}"
    echo ""
    # Print progress bar
    bar_length=40
    passed_filled=$((PASSED_TESTS * bar_length / TOTAL_TESTS))
    failed_filled=$((FAILED_TESTS * bar_length / TOTAL_TESTS))
    skipped_filled=$((SKIPPED_TESTS * bar_length / TOTAL_TESTS))

    printf "  ${GREEN}"
    printf '█%.0s' $(seq 1 $passed_filled)
    printf "${RED}"
    printf '█%.0s' $(seq 1 $failed_filled)
    if [ $skipped_filled -gt 0 ]; then
        printf "${YELLOW}"
        printf '░%.0s' $(seq 1 $skipped_filled)
    fi
    printf "${NC}\n"
    echo ""
    exit 1
fi
