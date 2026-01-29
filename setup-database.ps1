# Database Setup Script for tasq.one

Write-Host "🔧 Setting up PostgreSQL database for tasq.one..." -ForegroundColor Green

# Check if PostgreSQL is installed
$pgInstalled = Get-Command psql -ErrorAction SilentlyContinue
if (-not $pgInstalled) {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Database configuration
$dbName = "tasq_one"
$dbUser = "postgres"
$dbPassword = "postgres123"  # Change this to your actual PostgreSQL password

Write-Host "Creating database: $dbName" -ForegroundColor Cyan

# Set environment variable for password
$env:PGPASSWORD = $dbPassword

try {
    # Create database
    & psql -U $dbUser -c "CREATE DATABASE $dbName;" 2>$null
    Write-Host "✅ Database created successfully" -ForegroundColor Green
    
    # Connect to database and run schema
    Write-Host "Applying database schema..." -ForegroundColor Cyan
    & psql -U $dbUser -d $dbName -f "database/schema.sql"
    
    Write-Host "✅ Database setup completed!" -ForegroundColor Green
    Write-Host "Database: $dbName" -ForegroundColor White
    Write-Host "User: $dbUser" -ForegroundColor White
    
} catch {
    Write-Host "⚠️  Database might already exist or there was an error" -ForegroundColor Yellow
    Write-Host "You can manually run: psql -U $dbUser -d $dbName -f database/schema.sql" -ForegroundColor White
}

# Update .env file
$envPath = "backend/.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $envContent = $envContent -replace "DB_PASSWORD=your_password_here", "DB_PASSWORD=$dbPassword"
    $envContent | Set-Content $envPath
    Write-Host "✅ Updated .env file with database password" -ForegroundColor Green
}

Write-Host "`n🚀 Ready to go! Start the backend with: npm run dev" -ForegroundColor Green