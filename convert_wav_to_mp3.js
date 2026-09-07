const fs = require('fs');
const path = require('path');

// Set lamejs globals
const lamejsDir = path.join(__dirname, 'INNERVOICE', 'backend', 'node_modules', 'lamejs', 'src', 'js');
global.MPEGMode = require(path.join(lamejsDir, 'MPEGMode.js'));
global.Lame = require(path.join(lamejsDir, 'Lame.js'));
global.Presets = require(path.join(lamejsDir, 'Presets.js'));
global.GainAnalysis = require(path.join(lamejsDir, 'GainAnalysis.js'));
global.QuantizePVT = require(path.join(lamejsDir, 'QuantizePVT.js'));
global.Quantize = require(path.join(lamejsDir, 'Quantize.js'));
global.Takehiro = require(path.join(lamejsDir, 'Takehiro.js'));
global.Reservoir = require(path.join(lamejsDir, 'Reservoir.js'));
global.BitStream = require(path.join(lamejsDir, 'BitStream.js'));
global.Encoder = require(path.join(lamejsDir, 'Encoder.js'));
global.Version = require(path.join(lamejsDir, 'Version.js'));
global.VBRTag = require(path.join(lamejsDir, 'VBRTag.js'));

const lamejs = require(path.join(lamejsDir, 'index.js'));
const audioDir = path.join(__dirname, 'assets', 'audio');

const files = [
    'rain.wav',
    'ocean.wav',
    'forest.wav',
    'zen-bowl.wav',
    'om-drone.wav',
    'focus.wav',
    'piano.wav',
    'sleep.wav'
];

console.log("=== CONVERTING WAV AUDIO ASSETS TO MP3 FORMAT (44.1 kHz, Stereo, 128 kbps) ===");

files.forEach(file => {
    const wavPath = path.join(audioDir, file);
    const mp3Path = path.join(audioDir, file.replace('.wav', '.mp3'));

    if (!fs.existsSync(wavPath)) {
        console.error(`❌ Source file missing: ${wavPath}`);
        return;
    }

    const wavBuf = fs.readFileSync(wavPath);
    const pcmBuf = wavBuf.slice(44);

    const totalSamples = pcmBuf.length / 4; // 2 channels * 2 bytes = 4 bytes per sample
    const leftSamples = new Int16Array(totalSamples);
    const rightSamples = new Int16Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
        leftSamples[i] = pcmBuf.readInt16LE(i * 4);
        rightSamples[i] = pcmBuf.readInt16LE(i * 4 + 2);
    }

    const mp3encoder = new lamejs.Mp3Encoder(2, 44100, 128);
    const sampleBlockSize = 1152;
    const mp3Chunks = [];

    for (let i = 0; i < totalSamples; i += sampleBlockSize) {
        const leftChunk = leftSamples.subarray(i, i + sampleBlockSize);
        const rightChunk = rightSamples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
            mp3Chunks.push(Buffer.from(mp3buf));
        }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Chunks.push(Buffer.from(mp3buf));
    }

    const finalMp3Buf = Buffer.concat(mp3Chunks);
    fs.writeFileSync(mp3Path, finalMp3Buf);

    const sizeKB = (finalMp3Buf.length / 1024).toFixed(1);
    console.log(`  ✓ Converted ${file} -> ${path.basename(mp3Path)} (${sizeKB} KB, ${finalMp3Buf.length} bytes)`);
});

console.log("\nConversion Complete for all 8 files!");
