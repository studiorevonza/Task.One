# tasq.one Backend

This is the backend API for the tasq.one application.

## Features

- User authentication (Google OAuth + JWT)
- Task management API
- Project management API
- Time tracking API
- User profile management
- Database integration (PostgreSQL)

## Environment Variables

Create a `.env` file in the root of the backend directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tasq_one
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=24h

# CORS Configuration
CLIENT_URL=http://localhost:3000

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Run the development server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Users
- `GET /api/users/:userId/profile` - Get user profile
- `PUT /api/users/:userId/profile` - Update user profile
- `GET /api/users/:userId/security` - Get security settings
- `PUT /api/users/:userId/security` - Update security settings

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/tasks/stats/overview` - Get task statistics

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get a specific project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project
- `GET /api/projects/:id/stats` - Get project statistics

### Time Tracking
- `GET /api/time` - Get time entries

### Health Check
- `GET /api/health` - Health check endpoint

## Deployment

For deployment to Render, see the main `DEPLOYMENT_GUIDE.md` file in the project root.

## Database Schema

The application uses MySQL with the following tables:
- `users` - User accounts
- `tasks` - Task management
- `projects` - Project management
- `time_entries` - Time tracking data

Run `database/mysql-schema.sql` to set up the initial database structure.

## Error Handling

The API returns structured error responses:
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["validation errors if applicable"]
}
```

## Security

- JWT-based authentication
- Input validation and sanitization
- Rate limiting
- CORS protection
- SQL injection prevention

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request