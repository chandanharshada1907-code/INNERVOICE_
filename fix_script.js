const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf8');
content = content.replace(/\\\`/g, '`');
content = content.replace(/\\\$/g, '$');
fs.writeFileSync('script.js', content);
console.log('Fixed script.js');
