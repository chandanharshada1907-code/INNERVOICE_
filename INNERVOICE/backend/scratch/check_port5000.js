const http = require('http');

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/chat/message',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (res) => {
    console.log('HTTP Status from port 5000:', res.statusCode);
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Body:', body));
});

req.on('error', (e) => console.error('Port 5000 error:', e.message));
req.end();
