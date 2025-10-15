#!/bin/bash

echo "🚀 Starting IntelliOps AI Co-Pilot Local Development"
echo "=================================================="

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21+ first."
    echo "   Visit: https://golang.org/dl/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   brew services start mongodb/brew/mongodb-community"
    echo "   or"
    echo "   sudo systemctl start mongod"
    echo ""
    echo "Continuing anyway... (backend will fail to connect to database)"
fi

# Set environment variables
export MONGODB_URI="mongodb://localhost:27017"
export DATABASE_NAME="intelliops"
export JWT_SECRET="dev-secret-key-change-in-production"
export JWT_EXPIRES_IN="24h"
export PORT="8080"
export GIN_MODE="debug"
export OPENAI_API_KEY="${OPENAI_API_KEY:-}"
export OPENAI_MODEL="gpt-3.5-turbo"
export CORS_ORIGIN="http://localhost:3000"

echo "🔧 Setting up backend..."

# Go to backend directory
cd backend

# Install dependencies
echo "📦 Installing Go dependencies..."
go mod tidy

# Start backend in background
echo "🚀 Starting backend server on port 8080..."
go run main.go &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend failed to start. Check the logs above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Go back to root directory
cd ..

echo "🎨 Setting up frontend..."

# Go to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo "🚀 Starting frontend development server on port 3000..."
echo ""
echo "🎉 Development environment is ready!"
echo "=================================================="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8080"
echo "MongoDB: mongodb://localhost:27017"
echo ""
echo "Default admin credentials:"
echo "Email: admin@intelliops.com"
echo "Password: password"
echo ""
echo "Press Ctrl+C to stop all services"

# Start frontend (this will block)
npm start

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM
