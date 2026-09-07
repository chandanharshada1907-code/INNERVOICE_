const fs = require('fs');
const path = require('path');

const wavPath = path.join(__dirname, 'assets', 'audio', 'rain.wav');
const buf = fs.readFileSync(wavPath);

const header = buf.slice(0, 44);
const pcm = buf.slice(44);

let maxSample = 0;
let sumAbs = 0;
const totalSamples = pcm.length / 2;

for (let i = 0; i < pcm.length; i += 2) {
    const sample = pcm.readInt16LE(i);
    const abs = Math.abs(sample);
    if (abs > maxSample) maxSample = abs;
    sumAbs += abs;
}

const avgSample = sumAbs / totalSamples;

console.log("=== WAV AUDIO SAMPLE INSPECTION RESULT ===");
console.log(`File: ${wavPath}`);
console.log(`Total Buffer Size: ${buf.length} bytes`);
console.log(`PCM Data Size: ${pcm.length} bytes (${totalSamples} 16-bit samples)`);
console.log(`Max Sample Amplitude: ${maxSample} / 32767 (${(maxSample/32767*100).toFixed(1)}% full scale)`);
console.log(`Average Sample Amplitude: ${avgSample.toFixed(1)} / 32767 (${(avgSample/32767*100).toFixed(1)}% full scale)`);
console.log(`Is Non-Silent Audio: ${maxSample > 500 ? 'YES ✓ (Audible WAV data present)' : 'NO ❌ (Silent audio)'}`);
