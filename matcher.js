const fs = require('fs');
const code = fs.readFileSync('script.js', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;
let state = 'CODE';
let lastMatch = -1;

for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const next = code[i+1];
    
    if (state === 'CODE') {
        if (c === '/' && next === '/') { state = 'LINE_COMMENT'; i++; }
        else if (c === '/' && next === '*') { state = 'BLOCK_COMMENT'; i++; }
        else if (c === '"') state = 'STRING_D';
        else if (c === "'") state = 'STRING_S';
        else if (c === '`') state = 'TEMPLATE';
        else if (c === '{') { braces++; lastMatch = i; }
        else if (c === '}') { braces--; lastMatch = i; }
        else if (c === '(') parens++;
        else if (c === ')') parens--;
        else if (c === '[') brackets++;
        else if (c === ']') brackets--;
    } else if (state === 'LINE_COMMENT') {
        if (c === '\n') state = 'CODE';
    } else if (state === 'BLOCK_COMMENT') {
        if (c === '*' && next === '/') { state = 'CODE'; i++; }
    } else if (state === 'STRING_D') {
        if (c === '\\') i++;
        else if (c === '"') state = 'CODE';
    } else if (state === 'STRING_S') {
        if (c === '\\') i++;
        else if (c === "'") state = 'CODE';
    } else if (state === 'TEMPLATE') {
        if (c === '\\') i++;
        else if (c === '$' && next === '{') { braces++; i++; state = 'CODE'; } // Nested code inside template
        else if (c === '`') state = 'CODE';
    }
}

console.log(`Braces: ${braces}, Parens: ${parens}, Brackets: ${brackets}`);
