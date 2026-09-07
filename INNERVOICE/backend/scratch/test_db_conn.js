const path = require('path');
const dotenv = require(path.resolve(__dirname, '../node_modules/dotenv'));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const mysql = require(path.resolve(__dirname, '../node_modules/mysql2'));

const pool = mysql.createPool({
    host: '127.0.0.1', // explicit IPv4 loopback
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'innervoice',
    port: parseInt(process.env.DB_PORT || '3306')
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error('MYSQL_CONN_ERR:', err.code, err.message);
    } else {
        console.log('MYSQL_CONN_OK with 127.0.0.1!');
        conn.release();
    }
    pool.end();
});
