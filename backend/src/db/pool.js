const { Pool } = require('pg');

// Reads connection info from environment variables.
// Set these in a .env file (never commit real credentials — see .env.example).
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'securetrack',
});

module.exports = pool;
