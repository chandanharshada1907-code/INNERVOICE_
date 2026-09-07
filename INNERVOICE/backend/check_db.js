const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Harshada@423104',
    database: process.env.DB_NAME || 'innervoice'
  });
  const [tables] = await db.execute('SHOW TABLES');
  for(let row of tables) {
    const tableName = Object.values(row)[0];
    const [cols] = await db.execute('DESCRIBE ' + tableName);
    console.log('\nTABLE:', tableName);
    console.log(cols.map(c => c.Field + ' (' + c.Type + ')').join(', '));
  }
  db.end();
}
run().catch(console.error);
