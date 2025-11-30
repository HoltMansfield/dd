#!/bin/bash

# Create e2e-test-runs directory if it doesn't exist
mkdir -p e2e-test-runs

# Run E2E tests and capture output
echo "🧪 Running E2E tests..."
npm run test:e2e > e2e-test-runs/e2e-test-output.log 2>&1
EXIT_CODE=$?

# Extract test summary
echo ""
echo "📊 Test Results:"
echo "================"
grep -E "passed|failed" e2e-test-runs/e2e-test-output.log | tail -1

# Check exit code
if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ ALL TESTS PASSED"
    echo ""
    exit 0
else
    echo ""
    echo "❌ TESTS FAILED"
    echo ""
    echo "Error details:"
    grep -A 5 "Error:" e2e-test-runs/e2e-test-output.log | head -20
    exit 1
fi
