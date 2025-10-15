# Local Development Setup (Without Docker)

This guide will help you run the IntelliOps AI Co-Pilot application locally without Docker.

## Prerequisites

1. **Go 1.21+** - [Download here](https://golang.org/dl/)
2. **Node.js 16+** - [Download here](https://nodejs.org/)
3. **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)

## Step 1: Install Prerequisites

### Install Go
```bash
# On macOS with Homebrew
brew install go

# Verify installation
go version
```

### Install Node.js
```bash
# On macOS with Homebrew
brew install node

# Verify installation
node --version
npm --version
```

### Install MongoDB
```bash
# On macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community
```

## Step 2: Setup Backend

```bash
cd backend

# Install Go dependencies
go mod tidy

# Set environment variables
export MONGODB_URI="mongodb://localhost:27017"
export DATABASE_NAME="intelliops"
export JWT_SECRET="your-secret-key-here"
export OPENAI_API_KEY="your-openai-api-key-here"
export PORT="8080"
export GIN_MODE="debug"

# Run the backend server
go run main.go
```

The backend will start on `http://localhost:8080`

## Step 3: Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

## Step 4: Access the Application

1. Open your browser and go to `http://localhost:3000`
2. Use the default admin credentials:
   - **Email**: admin@intelliops.com
   - **Password**: password

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running: `brew services list | grep mongodb`
   - Check connection string in environment variables

2. **Go Module Issues**
   - Run `go clean -modcache` and then `go mod tidy`
   - Make sure you're using Go 1.21+

3. **Port Already in Use**
   - Change the PORT environment variable
   - Kill any process using port 8080: `lsof -ti:8080 | xargs kill -9`

### Frontend Issues

1. **Node Modules Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

2. **API Connection Issues**
   - Make sure backend is running on port 8080
   - Check browser console for CORS errors

## Development Workflow

1. **Backend Changes**: The server will auto-reload when you make changes
2. **Frontend Changes**: The React dev server will hot-reload automatically
3. **Database Changes**: Restart the backend server after model changes

## Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=intelliops
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
PORT=8080
GIN_MODE=debug
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
CORS_ORIGIN=http://localhost:3000
```

## API Testing

You can test the API using curl or Postman:

```bash
# Health check
curl http://localhost:8080/health

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@intelliops.com","password":"password"}'

# Create ticket (replace TOKEN with actual JWT token)
curl -X POST http://localhost:8080/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Test Issue","description":"This is a test ticket"}'
```

## Next Steps

Once you have the local setup working:

1. **Install Docker** for production deployment
2. **Configure OpenAI API** for AI triage features
3. **Customize the application** for your specific needs
4. **Add more features** like real-time notifications, advanced analytics, etc.

## Need Help?

- Check the main README.md for detailed documentation
- Review the API documentation in the README
- Check the troubleshooting section above
- Create an issue if you encounter problems
