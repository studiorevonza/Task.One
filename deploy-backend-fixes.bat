@echo off
echo 🚀 Deploying backend fixes to Render...

echo 🔧 Adding and committing changes...
git add .
git commit -m "Fix: Email service configuration and validation improvements for Render deployment"

echo 📤 Pushing to GitHub...
git push origin main

echo 🔄 Triggering Render deployment...
curl -X POST "https://api.render.com/v1/services/srv-cs3735g21fcc73cq0kkg/deploy/sync" ^
  -H "Authorization: Bearer %RENDER_API_KEY%" ^
  -H "Content-Type: application/json"

echo ✅ Deployment triggered! Check Render dashboard for status.
echo 📊 Monitor at: https://dashboard.render.com/web/srv-cs3735g21fcc73cq0kkg
pause