const fs = require('fs');
const lines = fs.readFileSync('script.js', 'utf8').split('\n');

for (let i = 0; i <= 7280; i += 100) {
    // Delete lines 0 to i
    const testCode = lines.slice(0, i).join('\n') + '\n});'; // add the closing brace just in case
    try {
        new Function(testCode);
    } catch(e) {
        if (!e.message.includes('Unexpected end of input')) {
            // we found an error
        }
    }
}
