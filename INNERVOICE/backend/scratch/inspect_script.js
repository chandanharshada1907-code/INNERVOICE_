const fs = require('fs');
const path = require('path');

const scriptPath = path.resolve(__dirname, '../script.js');
const content = fs.readFileSync(scriptPath, 'utf8');

console.log('Script length:', content.length);

// Find references to user_role, checkAdminRoleNav, adminNavLink, role
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
    if (/adminNavLink|checkAdminRoleNav|user_role|role === 'admin'|role==='admin'|innerVoiceCurrentUser/i.test(line)) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
