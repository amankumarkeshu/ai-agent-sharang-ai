#!/bin/bash

echo "🚀 Starting IntelliOps AI Co-Pilot Development Environment"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your OpenAI API key and other configurations"
fi

# Start MongoDB and Backend
echo "🐳 Starting MongoDB and Backend services..."
docker-compose -f docker-compose.dev.yml up -d mongodb backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Check if backend is responding
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend is ready!"
else
    echo "❌ Backend failed to start. Check logs with: docker-compose -f docker-compose.dev.yml logs backend"
    exit 1
fi

# Start frontend in development mode
echo "🎨 Starting Frontend development server..."
cd frontend
npm start &

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
echo "To stop all services: docker-compose -f docker-compose.dev.yml down"
echo "To view logs: docker-compose -f docker-compose.dev.yml logs -f"
