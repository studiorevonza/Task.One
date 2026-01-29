#!/bin/bash

echo "🚀 Preparing tasq.one for deployment to Render..."

# Create build directory if it doesn't exist
mkdir -p dist

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."

# Create a temporary directory for deployment
DEPLOY_DIR="deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"/{frontend,backend}

# Copy frontend build
cp -r dist "$DEPLOY_DIR/frontend/"

# Copy backend files
cp -r backend "$DEPLOY_DIR/backend/"
cp package*.json "$DEPLOY_DIR/backend/" 2>/dev/null || echo "No package.json in root"

# Copy Docker files
cp Dockerfile "$DEPLOY_DIR/"
cp nginx.conf "$DEPLOY_DIR/"

# Copy Render configuration
cp render.yaml "$DEPLOY_DIR/"

# Copy deployment guide
cp DEPLOYMENT_GUIDE.md "$DEPLOY_DIR/"

echo "📁 Deployment package created: $DEPLOY_DIR"

# Instructions for deployment
cat << EOF

✅ Deployment Preparation Complete!

To deploy to Render:

1. Push the code to your GitHub repository:
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main

2. Go to https://dashboard.render.com

3. Click "New +" → "Web Service"

4. Connect your GitHub repository

5. Render will automatically detect the render.yaml configuration

6. Add these environment variables in the Render dashboard:
   - DB_HOST (PostgreSQL hostname from Render)
   - DB_PORT (usually 5432)
   - DB_NAME (database name)
   - DB_USER (database username)
   - DB_PASSWORD (database password)
   - JWT_SECRET (generate a strong secret)
   - NODE_ENV=production

7. Your application will be deployed automatically!

Your tasq.one application is now ready for deployment to Render!
EOF