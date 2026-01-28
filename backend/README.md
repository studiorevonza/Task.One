# Backend Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## Database Setup

1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/
   - During installation, set a password for the postgres user

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE tasq_one;
   
   # Exit psql
   \q
   ```

3. **Run Database Schema**
   ```bash
   # Navigate to database directory
   cd database
   
   # Run the schema file
   psql -U postgres -d tasq_one -f schema.sql
   ```

## Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

4. **Update .env file**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=tasq_one
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password_here
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_change_this
   JWT_EXPIRES_IN=24h
   
   # CORS Configuration
   CLIENT_URL=http://localhost:3000
   ```

5. **Start the backend server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Verify backend is running**
   - Visit: http://localhost:3001/api/health
   - You should see: `{"status":"OK","timestamp":"...","uptime":...}`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats/overview` - Get task statistics

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/stats` - Get project statistics

## Testing the API

You can test the API using curl or Postman:

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Frontend Integration

The frontend is configured to connect to the backend at `http://localhost:3001`. Make sure both the frontend and backend servers are running:

1. **Start backend**: `cd backend && npm run dev`
2. **Start frontend**: `npm run dev` (from root directory)
3. **Access app**: http://localhost:3000

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in .env file
- Check if database `tasq_one` exists

### Port Conflicts
- Change PORT in .env if 3001 is already in use
- Update CLIENT_URL in .env if frontend runs on different port

### Authentication Issues
- Ensure JWT_SECRET is set in .env
- Check that tokens are being stored in localStorage
- Verify CORS configuration allows your frontend origin

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in .env
2. Use a production database (not local PostgreSQL)
3. Set a strong JWT_SECRET
4. Configure proper SSL/HTTPS
5. Use process managers like PM2 for deployment
6. Set up reverse proxy (nginx/apache)
7. Configure proper logging and monitoring