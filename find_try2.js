const fs = require('fs');
const lines = fs.readFileSync('script.js', 'utf8').split('\n');
const stack = [];

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('try {')) {
        stack.push(i + 1);
    }
    if (lines[i].includes('} catch')) {
        if (stack.length > 0) {
            stack.pop();
        } else {
            console.log(`Extra catch at line ${i + 1}`);
        }
    }
}
if (stack.length > 0) {
    console.log('Unmatched try blocks at lines:', stack);
} else {
    console.log('All matched!');
}



