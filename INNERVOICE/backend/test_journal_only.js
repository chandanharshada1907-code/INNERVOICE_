/**
 * test_journal_only.js — isolated journal analyze test
 */
const http = require('http');

function httpReq(method, path, headers, body) {
    return new Promise((resolve, reject) => {
        const opts = { hostname:'localhost', port:5000, path, method, headers:{'Content-Type':'application/json',...headers} };
        const req = http.request(opts, resp => {
            let d=''; resp.on('data',c=>d+=c);
            resp.on('end',()=>{ try{resolve({status:resp.statusCode,data:JSON.parse(d)});}catch(e){resolve({status:resp.statusCode,data:d});} });
        });
        req.on('error',reject);
        if(body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    const ts = Date.now();
    const email = `jtest${ts}@test.com`;
    const reg = await httpReq('POST','/api/auth/register',{},{name:'JTest',email,password:'Test1234!'});
    console.log('Register:', reg.status);
    const login = await httpReq('POST','/api/auth/login',{},{email,password:'Test1234!'});
    const token = login.data.token;
    console.log('Login:', login.status, '| token:', !!token);

    console.log('\n--- Journal Analyze Test ---');
    const r = await httpReq('POST','/api/journals/analyze',{'Authorization':'Bearer '+token},{
        text: 'Today was really tough. I felt overwhelmed and could not focus on anything at all.'
    });
    console.log('HTTP:', r.status);
    console.log('Response:', JSON.stringify(r.data, null, 2));
}
run().catch(e=>console.error('Fatal:',e.message));
