const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');
// Remove comments and strings to avoid false positives
code = code.replace(/\/\/.*$/gm, '');
code = code.replace(/\/\*[\s\S]*?\*\//g, '');
code = code.replace(/"(?:\\.|[^"\\])*"/g, '');
code = code.replace(/'(?:\\.|[^'\\])*'/g, '');
code = code.replace(/`(?:\\.|[^`\\])*`/g, '');

let parens = 0;
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    for (let c of lines[i]) {
        if (c === '(') parens++;
        if (c === ')') {
            parens--;
            if (parens < 0) {
                console.log(`Extra ) at line ${i + 1}`);
                parens = 0; // reset to find more
            }
        }
    }
}
console.log('Final parens count:', parens);
