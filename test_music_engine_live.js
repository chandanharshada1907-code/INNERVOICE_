const fs = require('fs');
const http = require('http');

console.log("=== VERIFYING LOCAL AUDIO ASSETS SERVED BY EXPRESS SERVER ===");

const tracks = [
    { id: 1, title: "Rain", path: "/assets/audio/rain.wav" },
    { id: 2, title: "Ocean", path: "/assets/audio/ocean.wav" },
    { id: 3, title: "Forest", path: "/assets/audio/forest.wav" },
    { id: 4, title: "Zen Bowl", path: "/assets/audio/zen-bowl.wav" },
    { id: 5, title: "Om Drone", path: "/assets/audio/om-drone.wav" },
    { id: 6, title: "Focus", path: "/assets/audio/focus.wav" },
    { id: 7, title: "Piano", path: "/assets/audio/piano.wav" },
    { id: 8, title: "Sleep", path: "/assets/audio/sleep.wav" }
];

async function checkAsset(track) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:5000${track.path}`, (res) => {
            let dataLen = 0;
            res.on('data', chunk => { dataLen += chunk.length; });
            res.on('end', () => {
                const isValid = res.statusCode === 200 && dataLen > 1000000 && res.headers['content-type'].includes('audio/wav');
                console.log(`[Asset Check] ${track.title} (${track.path}): HTTP ${res.statusCode}, Content-Type: ${res.headers['content-type']}, Size: ${(dataLen/(1024*1024)).toFixed(2)} MB -> ${isValid ? '✓ PASSED' : '❌ FAILED'}`);
                resolve(isValid);
            });
        });
        req.on('error', (err) => {
            console.error(`[Asset Check Error] ${track.title}:`, err.message);
            resolve(false);
        });
    });
}

async function run() {
    let allValid = true;
    for (const track of tracks) {
        const ok = await checkAsset(track);
        if (!ok) allValid = false;
    }
    console.log(`\nLocal WAV Assets Verification Result: ${allValid ? "ALL 8 AUDIO ASSETS VERIFIED & READY FOR BROWSER PLAYBACK!" : "FAILED"}`);
}

run();
