# IntelliOps AI Co-Pilot

An AI-powered operations assistant for MSPs that automatically triages tickets, predicts incidents, and assigns technicians intelligently.

## 🚀 Features

### Core Features
- **AI Auto-Triage**: Automatically categorizes and prioritizes service requests using OpenAI GPT or Local LLM
- **Smart Assignment**: Assigns the right technician based on skills and availability
- **Real-time Dashboard**: Live monitoring of tickets and technician status
- **Role-based Access**: Admin and Technician user roles with JWT authentication
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **RESTful API**: Comprehensive backend API built with Go and Gin framework
- **Docker Ready**: Complete containerized deployment with Docker Compose

### AI Features
- **Multiple AI Providers**: Support for OpenAI API and Local LLM integration
- **Intelligent Categorization**: Automatic ticket classification into 6 categories
- **Priority Assessment**: AI-driven priority assignment (Critical, High, Medium, Low)
- **Technician Suggestions**: Smart technician assignment based on expertise
- **Confidence Scoring**: AI provides confidence levels for quality assurance
- **Fallback System**: Graceful degradation to keyword-based triage when AI is unavailable

### User Experience
- **Interactive AI Triage**: One-click AI analysis with detailed suggestions
- **Admin Dashboard**: Comprehensive system overview and user management
- **Profile Management**: User profiles with ticket statistics and activity
- **Advanced Filtering**: Search and filter tickets by multiple criteria
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live ticket status updates and notifications

### Security & Compliance
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Granular permissions for different user types
- **Data Privacy**: Local LLM option for sensitive data requirements
- **Audit Trail**: Complete logging of user actions and system events

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Go 1.21 + Gin framework
- **Database**: MongoDB 7.0 (with in-memory fallback for development)
- **AI Integration**: OpenAI API + Local LLM support (Ollama, LM Studio, etc.)
- **Deployment**: Docker Compose (multi-container setup)
- **Authentication**: JWT-based with role-based access control

### AI Integration Options
1. **OpenAI API**: Cloud-based AI with GPT-3.5/GPT-4 models
2. **Local LLM**: On-premise AI with models like Llama 2, Code Llama, Mistral
3. **Hybrid Mode**: OpenAI as primary with local LLM fallback
4. **Mock Mode**: Keyword-based triage for development/testing

### Backend Architecture
- **Modular Design**: Separate handlers, middleware, and database layers
- **Multiple Backends**: Full MongoDB backend + Simplified in-memory backend
- **Graceful Fallbacks**: AI failures gracefully degrade to mock responses
- **Authorization**: Role-based access control with user ownership checks

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

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` | No |
| `DATABASE_NAME` | Database name | `intelliops` | No |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key-here` | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` | No |
| `PORT` | Backend server port | `8080` | No |
| `GIN_MODE` | Gin framework mode | `debug` | No |
| `AI_PROVIDER` | AI provider (`openai`, `local`, or `mock`) | `openai` | No |
| `OPENAI_API_KEY` | OpenAI API key | (empty) | For OpenAI |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-3.5-turbo` | No |
| `LOCAL_LLM_URL` | Local LLM API endpoint | (empty) | For Local LLM |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` | No |

### AI Configuration

#### Option 1: OpenAI API (Recommended for Production)
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Set environment variables:
   ```bash
   export AI_PROVIDER="openai"
   export OPENAI_API_KEY="your-openai-api-key"
   export OPENAI_MODEL="gpt-3.5-turbo"  # or "gpt-4"
   ```
3. Restart the backend service

**See [OPENAI_SETUP.md](OPENAI_SETUP.md) for detailed setup instructions.**

#### Option 2: Local LLM (Privacy-First)
1. Install a local LLM solution (Ollama, LM Studio, etc.)
2. Set environment variables:
   ```bash
   export AI_PROVIDER="local"
   export LOCAL_LLM_URL="http://localhost:11434"  # Ollama default
   ```
3. Restart the backend service

**See [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md) for detailed setup instructions.**

#### Option 3: Mock Mode (Development)
```bash
export AI_PROVIDER="mock"
```
Uses keyword-based triage for development and testing.

#### Fallback Behavior
- If OpenAI API fails → Falls back to mock triage
- If Local LLM fails → Falls back to mock triage
- Mock triage uses keyword matching for basic categorization

## 🚀 Features in Detail

### AI Auto-Triage
- **Multi-Provider Support**: OpenAI API, Local LLM, or Mock mode
- **Intelligent Analysis**: Deep understanding of technical issues
- **Category Classification**: Network, Hardware, Software, Security, Performance, Other
- **Priority Assessment**: Critical, High, Medium, Low based on business impact
- **Technician Matching**: Suggests best-fit technicians based on expertise
- **Confidence Scoring**: 0.0-1.0 confidence levels for quality assurance
- **Detailed Reasoning**: Explains categorization decisions
- **Graceful Fallbacks**: Continues working even when AI services are unavailable

### Advanced Ticket Management
- **Full CRUD Operations**: Create, read, update, delete with proper authorization
- **Smart Filtering**: Multi-criteria search and filtering
- **Real-time Updates**: Live status changes and notifications
- **Bulk Operations**: Admin can manage multiple tickets efficiently
- **Assignment System**: Intelligent technician assignment and workload balancing
- **Status Tracking**: Open → In Progress → Resolved → Closed workflow
- **Audit Trail**: Complete history of ticket changes and interactions

### User Management & Security
- **JWT Authentication**: Secure, stateless authentication
- **Role-based Authorization**: Admin and Technician roles with different permissions
- **User Ownership**: Users can only modify their own tickets (except admins)
- **Profile Management**: User profiles with statistics and activity tracking
- **Secure Password Handling**: bcrypt hashing with salt
- **Session Management**: Automatic token refresh and logout

### Admin Dashboard
- **System Overview**: Real-time statistics and metrics
- **User Management**: View and manage all system users
- **Ticket Analytics**: Comprehensive ticket analysis and reporting
- **Performance Monitoring**: Track AI triage accuracy and system performance
- **Bulk Operations**: Efficient management of multiple tickets and users

### Modern User Experience
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Interactive AI**: One-click AI triage with detailed suggestion display
- **Real-time Feedback**: Immediate responses and status updates
- **Intuitive Navigation**: Clean, modern interface with logical flow
- **Accessibility**: WCAG compliant design for all users
- **Progressive Enhancement**: Works even with JavaScript disabled

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
