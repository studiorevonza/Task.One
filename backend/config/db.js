const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'tasq_one',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? 'Amazon RDS' : false
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.stack);
  });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: async (text, params) => {
    const [rows] = await pool.execute(text, params);
    return rows;
  },
  getClient: async () => {
    return await pool.getConnection();
  },
  pool
};