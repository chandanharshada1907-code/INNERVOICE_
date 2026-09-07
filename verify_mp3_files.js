const fs = require('fs');
const http = require('http');
const path = require('path');

console.log("=== VERIFYING GENERATED MP3 FILES & EXPRESS HTTP ENDPOINTS ===");

const mp3Files = [
    { name: 'rain.mp3', title: 'Gentle Rain' },
    { name: 'ocean.mp3', title: 'Ocean Waves' },
    { name: 'forest.mp3', title: 'Forest Birds' },
    { name: 'zen-bowl.mp3', title: 'Zen Bowl' },
    { name: 'om-drone.mp3', title: 'Om Drone' },
    { name: 'focus.mp3', title: 'Binaural Focus' },
    { name: 'piano.mp3', title: 'Lofi Piano' },
    { name: 'sleep.mp3', title: 'Delta Sleep' }
];

const audioDir = path.join(__dirname, 'assets', 'audio');

let allMp3sValid = true;

mp3Files.forEach(file => {
    const filePath = path.join(audioDir, file.name);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Missing MP3 file: ${file.name}`);
        allMp3sValid = false;
        return;
    }

    const buf = fs.readFileSync(filePath);
    const size = buf.length;
    
    // Check MP3 Frame Header sync bits (0xFF 0xFB / 0xFF 0xF3 / 0xFF 0xF2 / ID3 tag)
    const isMp3Header = (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0) || (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33);
    
    // Calculate approximate duration for 128 kbps stereo MP3
    // bitrate = 128000 bits/sec = 16000 bytes/sec
    const approxDuration = size / 16000;

    const ok = size > 50000 && isMp3Header && approxDuration >= 9.0;
    if (!ok) allMp3sValid = false;

    console.log(`[MP3 File Check] ${file.title} (${file.name}): ${size} bytes (~${approxDuration.toFixed(1)}s), Valid Header: ${isMp3Header} -> ${ok ? '✓ PASSED' : '❌ FAILED'}`);
});

async function checkHttpEndpoints() {
    console.log("\n=== TESTING EXPRESS SERVER HTTP MP3 ENDPOINTS ===");
    let allHttpOk = true;

    for (const file of mp3Files) {
        await new Promise((resolve) => {
            const req = http.get(`http://localhost:5000/assets/audio/${file.name}`, (res) => {
                let bytesRead = 0;
                res.on('data', chunk => { bytesRead += chunk.length; });
                res.on('end', () => {
                    const contentType = res.headers['content-type'] || '';
                    const isOk = res.statusCode === 200 && contentType.includes('audio/mpeg') && bytesRead > 50000;
                    if (!isOk) allHttpOk = false;
                    console.log(`[HTTP Check] ${file.name}: Status ${res.statusCode}, Content-Type: '${contentType}', Size: ${bytesRead} bytes -> ${isOk ? '✓ PASSED' : '❌ FAILED'}`);
                    resolve();
                });
            });
            req.on('error', (err) => {
                console.error(`[HTTP Error] ${file.name}:`, err.message);
                allHttpOk = false;
                resolve();
            });
        });
    }

    console.log(`\nHTTP Endpoints Verification Result: ${allHttpOk ? 'ALL 8 MP3 ENDPOINTS VERIFIED 100% SUCCESSFUL' : 'FAILED'}`);
}

checkHttpEndpoints();
