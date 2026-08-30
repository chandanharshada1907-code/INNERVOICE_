const fs = require('fs');
const lines = fs.readFileSync('script.js', 'utf8').split('\n');

for (let i = 1; i <= lines.length; i++) {
    const code = lines.slice(0, i).join('\n') + '\n});';
    try {
        new Function(code);
    } catch (e) {
        if (e.message.includes('Missing catch')) {
            console.log(`Line ${i} throws Missing catch:`, lines[i-1]);
        }
    }
}
console.log("Done");
