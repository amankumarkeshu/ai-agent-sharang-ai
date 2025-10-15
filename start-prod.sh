#!/bin/bash

echo "🚀 Starting IntelliOps AI Co-Pilot Production Environment"
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
    echo "⚠️  Please update .env file with your production configurations"
    echo "   - Change JWT_SECRET to a secure random string"
    echo "   - Add your OpenAI API key"
    echo "   - Update database credentials"
    exit 1
fi

# Build and start all services
echo "🐳 Building and starting all services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if services are responding
echo "🔍 Checking service health..."

# Check backend
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend is ready!"
else
    echo "❌ Backend failed to start. Check logs with: docker-compose logs backend"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is ready!"
else
    echo "❌ Frontend failed to start. Check logs with: docker-compose logs frontend"
fi

echo ""
echo "🎉 Production environment is ready!"
echo "=================================================="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8080"
echo "MongoDB: mongodb://localhost:27017"
echo ""
echo "Default admin credentials:"
echo "Email: admin@intelliops.com"
echo "Password: password"
echo ""
echo "To stop all services: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo "To restart: docker-compose restart"
