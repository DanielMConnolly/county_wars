#!/bin/bash

# County Wars E2E Test Runner
# This script starts the necessary services and runs the Selenium tests

set -e  # Exit on any error

echo "🚀 Starting County Wars E2E Tests..."

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0

    echo "⏳ Waiting for $service_name to be ready..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi

        attempt=$((attempt + 1))
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
    done

    echo "❌ $service_name failed to start after $((max_attempts * 2)) seconds"
    return 1
}

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
if check_port 3001; then
    echo "   Stopping server on port 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

if check_port 5174; then
    echo "   Stopping dev server on port 5174..."
    lsof -ti:5174 | xargs kill -9 2>/dev/null || true
fi

if check_port 5173; then
    echo "   Stopping dev server on port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

sleep 2

# Start the backend server
echo "🖥️  Starting backend server..."
npm run server &
SERVER_PID=$!

# Start the frontend dev server
echo "🌐 Starting frontend dev server..."
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    kill $SERVER_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true

    # Kill any remaining processes on our ports
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5174 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true

    echo "✨ Cleanup complete"
}

# Set up cleanup on script exit
trap cleanup EXIT

# Wait for services to be ready
wait_for_service "http://localhost:3001/api/stats" "Backend Server"
wait_for_service "http://localhost:5173" "Frontend Dev Server"

echo "🎯 All services ready! Running E2E tests..."

# Run the tests
npm run test:e2e

echo "🎉 E2E Tests completed!"
