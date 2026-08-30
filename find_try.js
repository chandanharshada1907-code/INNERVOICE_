const fs = require('fs');
const lines = fs.readFileSync('script.js', 'utf8').split('\n');
const tryLines = [];
const catchLines = [];

for (let i = 0; i < 6342; i++) {
    if (lines[i].includes('try {')) tryLines.push(i + 1);
    if (lines[i].includes('} catch')) catchLines.push(i + 1);
}
console.log('try count:', tryLines.length);
console.log('catch count:', catchLines.length);
for (let i=0; i<tryLines.length; i++) {
   console.log('try:', tryLines[i], 'catch:', catchLines[i]);
}
