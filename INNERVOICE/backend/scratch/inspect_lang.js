const fs = require('fs');
const path = require('path');

const scriptPath = 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/script.js';
const indexPath = 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/index.html';

const scriptContent = fs.readFileSync(scriptPath, 'utf8');
const indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('--- INDEX.HTML LANGUAGE / CHATBOT MATCHES ---');
indexContent.split(/\r?\n/).forEach((line, idx) => {
    if (/lang|language|select|chatbot|chat|ai/i.test(line) && (line.includes('<select') || line.includes('lang') || line.includes('Language'))) {
        console.log(`Index L${idx + 1}: ${line.trim()}`);
    }
});

console.log('\n--- SCRIPT.JS LANGUAGE / CHATBOT MATCHES ---');
scriptContent.split(/\r?\n/).forEach((line, idx) => {
    if (/language|lang|chatbot|translate|i18n/i.test(line) && !line.includes('//') && line.length < 120) {
        console.log(`Script L${idx + 1}: ${line.trim()}`);
    }
});
