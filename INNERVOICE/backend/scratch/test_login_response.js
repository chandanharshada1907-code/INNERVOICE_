const http = require('http');

const data = JSON.stringify({
    email: 'chandanharshada1907@gmail.com',
    password: 'harshada1907' // We will test both password or whatever password user used
});

const req = http.request('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('RESPONSE:', body);
    });
});

req.on('error', err => console.error('ERR:', err.message));
req.write(data);
req.end();
