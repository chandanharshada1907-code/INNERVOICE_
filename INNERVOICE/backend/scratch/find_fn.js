const fs = require('fs');
const path = require('path');

const scriptPath = 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/script.js';
console.log('Exists:', fs.existsSync(scriptPath));
if (fs.existsSync(scriptPath)) {
    const content = fs.readFileSync(scriptPath, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
        if (line.includes('updateLoginStatus') || line.includes('checkAdminRoleNav') || line.includes('adminNavLink')) {
            console.log(`${idx + 1}: ${line.trim()}`);
        }
    });
}
