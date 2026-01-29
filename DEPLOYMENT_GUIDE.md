# Deployment Guide for tasq.one

This guide will help you deploy the tasq.one application to Render.com with a complete setup including both frontend and backend services.

## Prerequisites

- GitHub repository with your code pushed
- Render account (https://render.com)
- MySQL database (Render will create this for you)

## Deployment Steps

### 1. Prepare Your Repository

1. Push all your code to a GitHub repository
2. Make sure the `render.yaml` file is in your repository root
3. Ensure both frontend and backend code are committed

### 2. Deploy to Render

1. Go to https://dashboard.render.com
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` configuration

### 3. Configure Environment Variables

After deployment starts, you'll need to configure these environment variables in the Render dashboard:

#### For the Backend Service:
- `DB_HOST` - MySQL hostname (provided by Render)
- `DB_PORT` - MySQL port (usually 3306)
- `DB_NAME` - MySQL database name
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `JWT_SECRET` - Secret key for JWT tokens (generate a strong one)

### 4. Database Setup

Render will automatically create a MySQL database for you. You'll need to:

1. Wait for the database to be provisioned
2. Get the connection details from the database service page
3. Add the database connection details to your backend service environment variables
4. Apply the MySQL schema from `database/mysql-schema.sql`

### 5. Custom Domain (Optional)

1. In your Render dashboard, go to your web service
2. Click on "Domains" tab
3. Add your custom domain
4. Update DNS records as instructed

## Architecture Overview

The deployment consists of:
- **Frontend**: React application served by Nginx
- **Backend**: Node.js/Express API server
- **Database**: PostgreSQL managed by Render
- **Load Balancer**: Nginx reverse proxy handling routing

## Environment Configuration

### Frontend Environment Variables
These are handled by the Vite build process:
- `VITE_API_URL` - Points to your backend API URL (e.g., https://your-app.onrender.com/api)

### Backend Environment Variables
Configure these in your Render dashboard:
- `NODE_ENV` - Set to `production`
- `PORT` - Port number (Render sets this automatically)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASS` - Database password
- `JWT_SECRET` - JWT secret key
- `CLIENT_URL` - Frontend URL for CORS

## Monitoring and Maintenance

### Health Checks
- Frontend: `/` route serves static files
- Backend: `/api/health` endpoint

### Logs
Access logs through the Render dashboard under your services

### Scaling
- Free tier: 1 web service instance
- Paid tiers: Auto-scaling based on traffic

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify database environment variables
   - Check database firewall settings

2. **API Requests Failing**
   - Confirm CORS settings
   - Verify API endpoints

3. **Static Assets Not Loading**
   - Check nginx configuration
   - Verify build process

### Health Check URLs:
- Frontend: `https://your-app.onrender.com/`
- Backend API: `https://your-app.onrender.com/api/health`

## Updating Your Application

1. Push changes to your GitHub repository
2. Render will automatically rebuild and redeploy
3. Monitor the deployment logs for any issues

## Security Best Practices

1. **Environment Variables**: Never commit secrets to your repository
2. **HTTPS**: Render provides SSL certificates automatically
3. **Database Security**: Use strong passwords and secure connections
4. **JWT Security**: Use strong secrets and appropriate expiration times

## Performance Optimization

1. **CDN**: Leverage Render's global CDN for static assets
2. **Caching**: Implement appropriate caching headers
3. **Compression**: Gzip compression is enabled by default
4. **Database Indexing**: Optimize database queries and indexes

## Rollback Procedure

If you need to rollback to a previous version:
1. Go to your Render dashboard
2. Navigate to your service
3. Click on "Manual Deploy" 
4. Select the previous successful deployment

## Support

For issues with the deployment process, contact Render support.
For application-specific issues, check the application logs in your Render dashboard.