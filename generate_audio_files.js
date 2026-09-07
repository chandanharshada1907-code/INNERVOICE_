const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, 'assets', 'audio');
if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

const sampleRate = 44100;
const numChannels = 2; // Stereo for binaural support
const bytesPerSample = 2; // 16-bit PCM
const blockAlign = numChannels * bytesPerSample;

function createWavHeader(numSamples) {
    const dataSize = numSamples * blockAlign;
    const buffer = Buffer.alloc(44);
    
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * blockAlign, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(16, 34); // BitsPerSample
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    
    return buffer;
}

function generateTrack(filename, seconds, sampleGenerator) {
    const numSamples = Math.floor(sampleRate * seconds);
    const header = createWavHeader(numSamples);
    const dataBuffer = Buffer.alloc(numSamples * blockAlign);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, lastOut = 0;
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const [leftSample, rightSample] = sampleGenerator(t, i, {
            pinkNoise: () => {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                const p = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
                return p;
            },
            brownNoise: () => {
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                return lastOut * 3.5;
            }
        });
        
        // Clamp & convert to 16-bit signed integer (-32768 to 32767)
        const sL = Math.max(-1, Math.min(1, leftSample));
        const sR = Math.max(-1, Math.min(1, rightSample));
        
        const intL = Math.floor(sL < 0 ? sL * 32768 : sL * 32767);
        const intR = Math.floor(sR < 0 ? sR * 32768 : sR * 32767);
        
        const offset = i * blockAlign;
        dataBuffer.writeInt16LE(intL, offset);
        dataBuffer.writeInt16LE(intR, offset + 2);
    }
    
    const filePath = path.join(audioDir, filename);
    fs.writeFileSync(filePath, Buffer.concat([header, dataBuffer]));
    const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(1);
    console.log(`  ✓ Generated ${filename} (${seconds}s, ${sizeKB} KB)`);
}

console.log("Generating 8 real local WAV audio files in assets/audio/...");

// 1. Rain
generateTrack('rain.wav', 10, (t, i, n) => {
    const pink = n.pinkNoise();
    const swell = 0.5 + 0.1 * Math.sin(t * 0.8);
    const val = pink * 0.35 * swell;
    return [val, val];
});

// 2. Ocean
generateTrack('ocean.wav', 10, (t, i, n) => {
    const brown = n.brownNoise();
    const wavePeriod = 8.0; // 8 second surf swell
    const swell = 0.2 + 0.3 * Math.pow(Math.sin((t / wavePeriod) * Math.PI), 2);
    const val = brown * 0.2 * swell;
    return [val, val];
});

// 3. Forest
generateTrack('forest.wav', 10, (t, i, n) => {
    const pink = n.pinkNoise() * 0.08;
    let bird = 0;
    const birdTime = t % 2.5;
    if (birdTime < 0.15) {
        const freq = 2600 + Math.sin(birdTime * 60) * 300;
        bird = Math.sin(2 * Math.PI * freq * birdTime) * 0.1 * (1 - birdTime / 0.15);
    }
    const val = pink + bird;
    return [val, val];
});

// 4. Zen Bowl
generateTrack('zen-bowl.wav', 10, (t, i) => {
    const strikePeriod = 4.0;
    const strikeTime = t % strikePeriod;
    const env = Math.exp(-strikeTime * 1.2);
    
    const f1 = Math.sin(2 * Math.PI * 216 * t) * 0.3;
    const f2 = Math.sin(2 * Math.PI * 596 * t) * 0.15;
    const f3 = Math.sin(2 * Math.PI * 1166 * t) * 0.08;
    const val = (f1 + f2 + f3) * env * 0.4;
    return [val, val];
});

// 5. Om Drone
generateTrack('om-drone.wav', 10, (t) => {
    const om = Math.sin(2 * Math.PI * 136.1 * t) * 0.25;
    const fifth = Math.sin(2 * Math.PI * 204.15 * t) * 0.12;
    const octave = Math.sin(2 * Math.PI * 272.2 * t) * 0.08;
    const tremolo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.2 * t);
    const val = (om + fifth + octave) * tremolo * 0.4;
    return [val, val];
});

// 6. Focus (Binaural Alpha)
generateTrack('focus.wav', 10, (t) => {
    // 200Hz Left, 210Hz Right -> 10Hz Alpha binaural difference
    const left = Math.sin(2 * Math.PI * 200 * t) * 0.25;
    const right = Math.sin(2 * Math.PI * 210 * t) * 0.25;
    return [left, right];
});

// 7. Lofi Piano
generateTrack('piano.wav', 10, (t) => {
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const notePeriod = 1.25;
    const noteIdx = Math.floor(t / notePeriod) % notes.length;
    const noteTime = t % notePeriod;
    const freq = notes[noteIdx];
    const env = Math.exp(-noteTime * 2.0);
    const p1 = Math.sin(2 * Math.PI * freq * t);
    const p2 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
    const bed = Math.sin(2 * Math.PI * 130.81 * t) * 0.08;
    const val = (p1 + p2) * env * 0.2 + bed;
    return [val, val];
});

// 8. Delta Sleep
generateTrack('sleep.wav', 10, (t, i, n) => {
    const pink = n.pinkNoise() * 0.05;
    const carrierL = Math.sin(2 * Math.PI * 108 * t) * 0.2;
    const carrierR = Math.sin(2 * Math.PI * 110 * t) * 0.2; // 2Hz Delta wave difference
    return [carrierL + pink, carrierR + pink];
});

console.log("All 8 local audio files created in assets/audio/ successfully!");
