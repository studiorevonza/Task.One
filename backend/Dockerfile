# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code
COPY . .

# Expose port (Render will set PORT environment variable)
EXPOSE 10000

# Start the application
CMD ["npm", "start"]