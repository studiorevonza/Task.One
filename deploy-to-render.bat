@echo off
echo 🚀 Preparing tasq.one for deployment to Render...

REM Build the frontend
echo 🔨 Building frontend...
npm run build

REM Check if build was successful
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    exit /b 1
)

echo ✅ Frontend build successful

REM Create deployment directory
set "DEPLOY_DIR=deployment-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "DEPLOY_DIR=%DEPLOY_DIR: =0%"
mkdir "%DEPLOY_DIR%" 2>nul
mkdir "%DEPLOY_DIR%\frontend" 2>nul
mkdir "%DEPLOY_DIR%\backend" 2>nul

REM Copy files for deployment
echo 📦 Creating deployment package...
xcopy /E /I /Y "dist" "%DEPLOY_DIR%\frontend\" >nul
xcopy /E /I /Y "backend" "%DEPLOY_DIR%\backend\" >nul
copy "package*.json" "%DEPLOY_DIR%\backend\" >nul 2>nul
copy "Dockerfile" "%DEPLOY_DIR%\" >nul
copy "nginx.conf" "%DEPLOY_DIR%\" >nul
copy "render.yaml" "%DEPLOY_DIR%\" >nul
copy "DEPLOYMENT_GUIDE.md" "%DEPLOY_DIR%\" >nul

echo 📁 Deployment package created: %DEPLOY_DIR%

echo.
echo ✅ Deployment Preparation Complete!
echo.
echo To deploy to Render:
echo.
echo 1. Push the code to your GitHub repository:
echo    git add .
echo    git commit -m "Prepare for Render deployment"
echo    git push origin main
echo.
echo 2. Go to https://dashboard.render.com
echo.
echo 3. Click "New +" ^^^^ "Web Service"
echo.
echo 4. Connect your GitHub repository
echo.
echo 5. Render will automatically detect the render.yaml configuration
echo.
echo 6. Add these environment variables in the Render dashboard:
echo    - DB_HOST (PostgreSQL hostname from Render)
echo    - DB_PORT (usually 5432)
echo    - DB_NAME (database name)
echo    - DB_USER (database username)
echo    - DB_PASSWORD (database password)
echo    - JWT_SECRET (generate a strong secret)
echo    - NODE_ENV=production
echo.
echo 7. Your application will be deployed automatically!
echo.
echo Your tasq.one application is now ready for deployment to Render!
pause