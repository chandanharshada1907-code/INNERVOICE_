const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/.env' });
const wellnessService = require('c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/services/wellnessAssistantService.js');

async function diagUser1() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'innervoice',
        port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    const [users] = await conn.execute('SELECT id, name, email FROM users LIMIT 5');
    console.log("Users in DB:", users);
    await conn.end();

    if (users.length > 0) {
        const u = users[0];
        console.log(`\nTesting context build for user ID ${u.id} (${u.name}):`);
        const ctx = await wellnessService.buildWellnessContext(u.id);
        console.log("Context:", ctx);

        console.log("\nTesting generateAssistantResponse:");
        const res = await wellnessService.generateAssistantResponse(ctx, "Hello, I am feeling stressed today.", "en");
        console.log("Response:", res);
    }
}

diagUser1().catch(e => console.error(e));
