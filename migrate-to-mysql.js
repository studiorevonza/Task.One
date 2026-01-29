// Migration script to switch from PostgreSQL to MySQL
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting migration from PostgreSQL to MySQL...\n');

// Update package.json dependencies
const packagePath = path.join(__dirname, 'backend', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Replace pg with mysql2
if (packageJson.dependencies.pg) {
    delete packageJson.dependencies.pg;
    packageJson.dependencies.mysql2 = "^3.6.5";
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json: Replaced pg with mysql2');
}

// Update database configuration
const dbConfigPath = path.join(__dirname, 'backend', 'config', 'db.js');
const dbConfig = fs.readFileSync(dbConfigPath, 'utf8');

// Replace PostgreSQL configuration with MySQL
const mysqlConfig = dbConfig
    .replace("const { Pool } = require('pg');", "const mysql = require('mysql2/promise');")
    .replace('new Pool({', 'mysql.createPool({')
    .replace('port: parseInt(process.env.DB_PORT) || 5432,', 'port: parseInt(process.env.DB_PORT) || 3306,')
    .replace("user: process.env.DB_USER || 'postgres',", "user: process.env.DB_USER || 'root',")
    .replace('ssl: process.env.NODE_ENV === \'production\' ? { rejectUnauthorized: false } : false', 'ssl: process.env.NODE_ENV === \'production\' ? \'Amazon RDS\' : false')
    .replace('waitForConnections: true,', '')
    .replace('connectionLimit: 10,', '')
    .replace('queueLimit: 0,', '');

// Update query method
const updatedConfig = mysqlConfig
    .replace(
        'pool.query(\'SELECT NOW()\', (err, res) => {',
        'pool.getConnection()\n  .then(connection => {\n    console.log(\'✅ Database connected successfully\');\n    connection.release();\n  })\n  .catch(err => {'
    )
    .replace(
        '    console.error(\'❌ Database connection error:\', err.stack);\n  } else {\n    console.log(\'✅ Database connected successfully\');\n    console.log(\'🕒 Server time:\', res.rows[0].now);\n  }\n});',
        '    console.error(\'❌ Database connection error:\', err.stack);\n  });'
    )
    .replace(
        '  query: (text, params) => pool.query(text, params),',
        '  query: async (text, params) => {\n    const [rows] = await pool.execute(text, params);\n    return rows;\n  },'
    )
    .replace(
        '  getClient: () => pool.connect(),',
        '  getClient: async () => {\n    return await pool.getConnection();\n  },'
    );

fs.writeFileSync(dbConfigPath, updatedConfig);
console.log('✅ Updated database configuration for MySQL');

// Install dependencies
console.log('\n📥 Installing MySQL dependencies...');
const { execSync } = require('child_process');
try {
    process.chdir(path.join(__dirname, 'backend'));
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ MySQL dependencies installed successfully');
} catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
}

console.log('\n🎉 Migration to MySQL completed successfully!');
console.log('\nNext steps:');
console.log('1. Update your .env file with MySQL connection details');
console.log('2. Create MySQL database and run database/mysql-schema.sql');
console.log('3. Test the application with npm start');