const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/.env' });

const secret = process.env.JWT_SECRET || 'supersecretkey';
const token = jwt.sign({ id: 1, user_id: 1, role: 'user' }, secret, { expiresIn: '1h' });

const postData = JSON.stringify({ message: "Hello, I am feeling stressed today.", language: "en" });

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/chat/message',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log("Sending POST /api/chat/message...");
const req = http.request(options, (res) => {
    console.log("Response Status Code:", res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Full Server Response Body:");
        console.log(data);
    });
});

req.on('error', err => console.error("Req error:", err.message));
req.write(postData);
req.end();
