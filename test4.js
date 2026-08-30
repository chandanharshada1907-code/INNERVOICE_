const fs = require('fs');
let lines = fs.readFileSync('script.js', 'utf8').split('\n');
let code = lines.slice(0, 6351).join('\n') + '\n';
fs.writeFileSync('script_test4.js', code);
