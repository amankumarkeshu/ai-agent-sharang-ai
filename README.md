# IntelliOps AI Co-Pilot

An AI-powered operations assistant for MSPs that automatically triages tickets, predicts incidents, and assigns technicians intelligently.

## 🚀 Features

- **AI Auto-Triage**: Automatically categorizes and prioritizes service requests using OpenAI GPT
- **Smart Assignment**: Assigns the right technician based on skills and availability
- **Real-time Dashboard**: Live monitoring of tickets and technician status
- **Role-based Access**: Admin and Technician user roles with JWT authentication
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **RESTful API**: Comprehensive backend API built with Go and Gin framework
- **Docker Ready**: Complete containerized deployment with Docker Compose

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Go 1.21 + Gin framework
- **Database**: MongoDB 7.0
- **AI Integration**: OpenAI API (configurable for local LLM)
- **Deployment**: Docker Compose (multi-container setup)
- **Authentication**: JWT-based with role-based access control

## 🚀 Quick Start

### Option 1: Production Deployment
```bash
# Clone the repository
git clone <repository-url>
cd intelliops-ai-copilot

# Copy environment file and configure
cp env.example .env
# Edit .env with your OpenAI API key and other settings

# Start all services
./start-prod.sh
```

### Option 2: Development Environment
```bash
# Clone the repository
git clone <repository-url>
cd intelliops-ai-copilot

# Start backend services (MongoDB + API)
./start-dev.sh

# In another terminal, start frontend
cd frontend
npm install
npm start
```

### Option 3: Manual Docker Compose
```bash
# Start all services
docker-compose up -d

# Or for development
docker-compose -f docker-compose.dev.yml up -d
```

## 📁 Project Structure

```
intelliops-ai-copilot/
├── frontend/                    # React TypeScript application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/           # React contexts (Auth)
│   │   ├── services/           # API service layer
│   │   ├── types/              # TypeScript type definitions
│   │   └── App.tsx             # Main app component
│   ├── public/                 # Static assets
│   ├── Dockerfile              # Frontend container config
│   └── nginx.conf              # Nginx configuration
├── backend/                     # Go API server
│   ├── config/                 # Configuration management
│   ├── database/               # Database connection
│   ├── handlers/               # HTTP handlers
│   ├── middleware/             # Custom middleware
│   ├── models/                 # Data models
│   ├── main.go                 # Application entry point
│   └── Dockerfile              # Backend container config
├── docker-compose.yml          # Production deployment
├── docker-compose.dev.yml      # Development deployment
├── start-prod.sh               # Production startup script
├── start-dev.sh                # Development startup script
└── README.md                   # This file
```

## 🔧 Development

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ (for frontend development)
- Go 1.21+ (for backend development)
- MongoDB (or use Docker)

### Backend Development
```bash
cd backend

# Install dependencies
go mod tidy

# Set environment variables
export MONGODB_URI="mongodb://localhost:27017"
export JWT_SECRET="your-secret-key"
export OPENAI_API_KEY="your-openai-key"

# Run the server
go run main.go
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 📝 API Documentation

### Base URL
- Development: `http://localhost:8080/api`
- Production: `http://localhost:8080/api`

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "technician"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

### Ticket Management Endpoints

#### List Tickets
```http
GET /api/tickets?status=open&priority=high&page=1&limit=10
Authorization: Bearer <jwt-token>
```

#### Create Ticket
```http
POST /api/tickets
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Network connectivity issue",
  "description": "Users cannot access the internet",
  "category": "Network Issue",
  "priority": "high"
}
```

#### Update Ticket
```http
PUT /api/tickets/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "status": "in_progress",
  "assignedTo": "technician-id"
}
```

#### Delete Ticket
```http
DELETE /api/tickets/:id
Authorization: Bearer <jwt-token>
```

### AI Triage Endpoints

#### Auto-Triage Ticket
```http
POST /api/ai/triage
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Server is down",
  "description": "The main server is not responding to requests"
}
```

Response:
```json
{
  "category": "Hardware Issue",
  "summary": "Server hardware failure affecting all services",
  "priority": "critical",
  "suggestedTechnician": "Ravi Kumar",
  "confidence": 0.95,
  "reasoning": "Based on the description, this appears to be a critical server hardware issue"
}
```

#### Get Technicians
```http
GET /api/ai/technicians
Authorization: Bearer <jwt-token>
```

## 🐳 Docker Deployment

### Production Deployment
```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development Deployment
```bash
# Start only backend services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Services
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **MongoDB**: mongodb://localhost:27017

## 🔐 Default Credentials

The application creates a default admin user on first startup:
- **Email**: admin@intelliops.com
- **Password**: password

⚠️ **Important**: Change these credentials in production!

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `intelliops` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key-here` |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `PORT` | Backend server port | `8080` |
| `GIN_MODE` | Gin framework mode | `debug` |
| `OPENAI_API_KEY` | OpenAI API key | (required for AI features) |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-3.5-turbo` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

### OpenAI Configuration

To enable AI auto-triage features:
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Set the `OPENAI_API_KEY` environment variable
3. Restart the backend service

Without OpenAI API key, the system will use mock AI triage responses.

## 🚀 Features in Detail

### AI Auto-Triage
- Analyzes ticket title and description
- Categorizes issues (Network, Hardware, Software, Security, Performance, Other)
- Assigns priority levels (Low, Medium, High, Critical)
- Suggests appropriate technicians
- Provides confidence scores and reasoning

### Ticket Management
- Create, read, update, delete tickets
- Filter by status, priority, category
- Search functionality
- Real-time updates
- Assignment to technicians

### User Management
- JWT-based authentication
- Role-based access control (Admin, Technician)
- Secure password hashing
- Session management

### Modern UI
- Responsive design
- Dark/light theme support
- Real-time updates
- Intuitive user experience
- Mobile-friendly

## 🛠️ Troubleshooting

### Common Issues

1. **Backend not starting**
   - Check MongoDB connection
   - Verify environment variables
   - Check logs: `docker-compose logs backend`

2. **Frontend not loading**
   - Check if backend is running
   - Verify API URL configuration
   - Check browser console for errors

3. **AI triage not working**
   - Verify OpenAI API key is set
   - Check API key permissions
   - Check backend logs for errors

4. **Database connection issues**
   - Ensure MongoDB is running
   - Check connection string
   - Verify database credentials

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for MSPs and IT Operations Teams**
