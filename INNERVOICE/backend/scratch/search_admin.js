const fs = require('fs');
const path = require('path');

const scriptPath = 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/script.js';
const content = fs.readFileSync(scriptPath, 'utf8');

const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
    if (line.includes('admin') || line.includes('Admin')) {
        // filter out comments or log lines if needed, but show matches
        console.log(`${idx + 1}: ${line.trim()}`);
    }
});
