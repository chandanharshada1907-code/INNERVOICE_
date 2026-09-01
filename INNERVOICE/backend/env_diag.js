/**
 * env_diag.js — Diagnoses exactly which .env file is loaded by the server
 * Run from the SAME directory you start server.js: node env_diag.js
 * Never prints actual key values.
 */
const path = require('path');
const fs   = require('fs');

console.log('=== INNERVOICE .ENV LOAD DIAGNOSIS ===\n');

// 1. Working directory at runtime
const cwd = process.cwd();
console.log('1. process.cwd():', cwd);

// 2. What dotenv.config() (no args) resolves to
const defaultEnvPath = path.resolve(cwd, '.env');
console.log('2. dotenv default .env path:', defaultEnvPath);
console.log('   File exists:', fs.existsSync(defaultEnvPath));
if (fs.existsSync(defaultEnvPath)) {
    const stat = fs.statSync(defaultEnvPath);
    console.log('   File size (bytes):', stat.size);
    console.log('   Last modified:', stat.mtime.toISOString());
    const content = fs.readFileSync(defaultEnvPath, 'utf8');
    const lines = content.split('\n');
    const geminiLines = lines
        .map((l, i) => ({ line: i+1, raw: l }))
        .filter(x => x.raw.includes('GEMINI_API_KEY'));
    if (geminiLines.length === 0) {
        console.log('   GEMINI_API_KEY: NOT FOUND in this file');
    } else {
        geminiLines.forEach(x => {
            const eqIdx = x.raw.indexOf('=');
            const val   = eqIdx >= 0 ? x.raw.substring(eqIdx + 1).trim() : '';
            console.log(`   GEMINI_API_KEY @ line ${x.line}: present=${val.length > 0} | length=${val.length} | first4=${JSON.stringify(val.substring(0,4))} | placeholder=${val==='PASTE_YOUR_AIza_KEY_HERE'}`);
        });
    }
}

// 3. Also check __dirname-relative path (in case server.js is in a subdir)
const dirnameEnvPath = path.resolve(__dirname, '.env');
console.log('\n3. __dirname-relative .env path:', dirnameEnvPath);
if (dirnameEnvPath !== defaultEnvPath) {
    console.log('   ⚠️  DIFFERENT from cwd path!');
    console.log('   File exists:', fs.existsSync(dirnameEnvPath));
} else {
    console.log('   Same as cwd path — consistent.');
}

// 4. Simulate require("dotenv").config() and show what it loaded
require('dotenv').config();
const loadedKey = process.env.GEMINI_API_KEY;
console.log('\n4. After require("dotenv").config():');
console.log('   GEMINI_API_KEY in process.env: present=', !!loadedKey);
if (loadedKey) {
    console.log('   Length:', loadedKey.length);
    console.log('   First 4 chars:', JSON.stringify(loadedKey.substring(0, 4)));
    console.log('   Is placeholder:', loadedKey === 'PASTE_YOUR_AIza_KEY_HERE');
    console.log('   Starts with AIza:', loadedKey.startsWith('AIza'));
}

// 5. Check all .env* files in cwd
console.log('\n5. All .env* files in', cwd, ':');
const cwdFiles = fs.readdirSync(cwd).filter(f => f.startsWith('.env'));
cwdFiles.forEach(f => {
    const fp = path.join(cwd, f);
    const stat = fs.statSync(fp);
    console.log('  ', fp, '| size:', stat.size, '| modified:', stat.mtime.toISOString());
});
if (cwdFiles.length === 0) console.log('   (none)');

console.log('\n=== DIAGNOSIS COMPLETE ===');
