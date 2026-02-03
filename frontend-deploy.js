// Simple deployment script for frontend
const { execSync } = require('child_process');
const fs = require('fs');

console.log('📦 Building frontend for deployment...');

try {
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Build for production
  console.log('Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Frontend built successfully!');
  console.log('📁 Build output is in the dist/ folder');
  console.log('\nTo deploy:');
  console.log('1. Upload the contents of the dist/ folder to your hosting provider');
  console.log('2. Make sure to set the environment variables:');
  console.log('   VITE_API_URL=https://tasq-one-backend.onrender.com/api');
  console.log('   VITE_GOOGLE_CLIENT_ID=436152930223-2p91794cslr6tqks1nlpekvqig2hn3ch.apps.googleusercontent.com');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}