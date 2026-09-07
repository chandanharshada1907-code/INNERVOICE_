const fs = require('fs');
const path = require('path');

console.log("=== RUNNING MP3 MUSIC CONTROLLER INTEGRATION SUITE ===");

const mockElements = {};
function getEl(id) {
    if (!mockElements[id]) {
        mockElements[id] = {
            innerHTML: '',
            textContent: '',
            value: '0.8',
            style: {},
            classList: { add:()=>{}, remove:()=>{}, toggle:()=>{} }
        };
    }
    return mockElements[id];
}

const documentMock = {
    getElementById: (id) => getEl(id),
    querySelectorAll: () => [],
    addEventListener: () => {}
};

class MockAudio {
    constructor(src) {
        this.src = src || '';
        this.paused = true;
        this.muted = false;
        this.volume = 0.8;
        this.currentTime = 0;
        this.duration = 300;
        this.readyState = 4;
        this.networkState = 1;
        this.error = null;
        this.loop = false;
        this.listeners = {};
    }

    addEventListener(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    dispatchEvent(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb({ type: event }));
        }
    }

    async play() {
        this.paused = false;
        this.dispatchEvent('playing');
        this.dispatchEvent('canplay');
        return Promise.resolve();
    }

    pause() {
        this.paused = true;
        this.dispatchEvent('pause');
    }
}

class MockAudioContext {
    constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = {};
    }
    createGain() {
        return { gain: { setValueAtTime: () => {} }, connect: () => {} };
    }
    createBufferSource() {
        return { buffer: null, loop: false, connect: () => {}, start: () => {}, stop: () => {}, disconnect: () => {} };
    }
    createBiquadFilter() {
        return { frequency: { setValueAtTime: () => {} }, gain: { setValueAtTime: () => {} }, connect: () => {} };
    }
    createOscillator() {
        return { frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {}, disconnect: () => {} };
    }
    createBuffer() {
        return { getChannelData: () => new Float32Array(1000) };
    }
    resume() {
        return Promise.resolve();
    }
}

const windowMock = {
    document: documentMock,
    Audio: MockAudio,
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
    localStorage: {
        getItem: () => "[]",
        setItem: () => {}
    },
    currentUser: null,
    escapeHTMLSafe: (str) => str,
    medFormatTime: (sec) => "00:00",
    showMessage: (msg) => console.log(`[UI Toast]: ${msg}`),
    markWellnessDone: (act) => console.log(`[Wellness Done]: ${act}`),
    setInterval: () => 123,
    clearInterval: () => {}
};

// Extract lines 6860 to 7230 from script.js
const scriptContent = fs.readFileSync('script.js', 'utf8');
const lines = scriptContent.split('\n');
const musicStartIndex = lines.findIndex(l => l.includes('const MUSIC_PLAYLIST'));
const musicEndIndex = lines.findIndex((l, idx) => idx > musicStartIndex && l.includes('var BREATH_TECHNIQUES'));

const musicCode = lines.slice(musicStartIndex, musicEndIndex).join('\n');

const runMusicSandbox = new Function('window', 'document', 'Audio', 'AudioContext', 'webkitAudioContext', 'localStorage', 'currentUser', 'escapeHTMLSafe', 'medFormatTime', 'showMessage', 'markWellnessDone', 'setInterval', 'clearInterval', `
    let audioCtx = new AudioContext();
    let masterGainNode = audioCtx.createGain();
    let activeSynthNodes = [];
    let synthIntervals = [];
    let htmlAudioPlayer = null;

    function stopAllSynthAudio(stopHtml = true) {
        activeSynthNodes.forEach(node => {
            try {
                if (typeof node.stop === 'function') node.stop();
                if (typeof node.disconnect === 'function') node.disconnect();
            } catch (e) {}
        });
        activeSynthNodes = [];
        synthIntervals.forEach(id => clearInterval(id));
        synthIntervals = [];
        if (stopHtml && htmlAudioPlayer) {
            try {
                htmlAudioPlayer.pause();
                htmlAudioPlayer.currentTime = 0;
            } catch (e) {}
        }
    }

    function initAudioContext() {
        return audioCtx;
    }

    function startProceduralSoundscape(type) {
        console.log('[Web Audio Synth] Started fallback procedural soundscape:', type);
    }

    ${musicCode}

    return {
        MUSIC_PLAYLIST,
        playMusicTrack: window.playMusicTrack,
        pauseMusicTrack: window.pauseMusicTrack,
        resumeMusicTrack: window.resumeMusicTrack,
        toggleMusicPlay: window.toggleMusicPlay,
        nextMusicTrack: window.nextMusicTrack,
        prevMusicTrack: window.prevMusicTrack,
        stopMusicTrack: window.stopMusicTrack,
        setMusicVolume: window.setMusicVolume,
        toggleMusicMute: window.toggleMusicMute,
        seekMusicTrack: window.seekMusicTrack,
        getHtmlAudioPlayer: () => htmlAudioPlayer
    };
`);

const musicEngine = runMusicSandbox(
    windowMock,
    documentMock,
    MockAudio,
    MockAudioContext,
    MockAudioContext,
    windowMock.localStorage,
    null,
    windowMock.escapeHTMLSafe,
    windowMock.medFormatTime,
    windowMock.showMessage,
    windowMock.markWellnessDone,
    windowMock.setInterval,
    windowMock.clearInterval
);

async function runTests() {
    let testResults = [];

    // Test 1: Play Track 0 (Rain.mp3)
    console.log("\n[Test 1] Calling playMusicTrack(0) for rain.mp3...");
    await musicEngine.playMusicTrack(0);
    const player1 = musicEngine.getHtmlAudioPlayer();

    const state1 = {
        src: player1?.src,
        paused: player1?.paused,
        muted: player1?.muted,
        volume: player1?.volume,
        readyState: player1?.readyState,
        currentTime: player1?.currentTime,
        duration: player1?.duration,
        networkState: player1?.networkState,
        error: player1?.error
    };
    console.log("Diagnostic Audio State output:", state1);

    const check1 = player1 && 
                   player1.paused === false && 
                   player1.src.includes('rain.mp3') && 
                   player1.volume > 0 && 
                   player1.muted === false &&
                   player1.readyState >= 2 &&
                   player1.error === null;
    console.log(`Test 1 (Play rain.mp3): ${check1 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check1);

    // Test 2: Pause Track
    console.log("\n[Test 2] Calling pauseMusicTrack()...");
    musicEngine.pauseMusicTrack();
    const check2 = player1.paused === true;
    console.log(`Test 2 (Pause Track): ${check2 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check2);

    // Test 3: Resume Track
    console.log("\n[Test 3] Calling resumeMusicTrack()...");
    await musicEngine.resumeMusicTrack();
    const check3 = player1.paused === false;
    console.log(`Test 3 (Resume Track): ${check3 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check3);

    // Test 4: Next Track (ocean.mp3)
    console.log("\n[Test 4] Calling nextMusicTrack()...");
    await musicEngine.nextMusicTrack();
    const check4 = player1.src.includes('ocean.mp3') && player1.paused === false;
    console.log(`Test 4 (Next Track -> ocean.mp3): ${check4 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check4);

    // Test 5: Prev Track (rain.mp3)
    console.log("\n[Test 5] Calling prevMusicTrack()...");
    await musicEngine.prevMusicTrack();
    const check5 = player1.src.includes('rain.mp3') && player1.paused === false;
    console.log(`Test 5 (Prev Track -> rain.mp3): ${check5 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check5);

    // Test 6: Volume & Mute Controls
    console.log("\n[Test 6] Testing setMusicVolume & toggleMusicMute...");
    musicEngine.setMusicVolume(0.4);
    const volOk = player1.volume === 0.4;
    musicEngine.toggleMusicMute();
    const muteOk = player1.muted === true;
    musicEngine.toggleMusicMute();
    const unmuteOk = player1.muted === false;
    const check6 = volOk && muteOk && unmuteOk;
    console.log(`Test 6 (Volume/Mute Controls): ${check6 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check6);

    // Test 7: Direct Switch to Track 6 (piano.mp3)
    console.log("\n[Test 7] Calling playMusicTrack(6) (piano.mp3)...");
    await musicEngine.playMusicTrack(6);
    const check7 = player1.src.includes('piano.mp3') && player1.paused === false;
    console.log(`Test 7 (Track Switch -> piano.mp3): ${check7 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check7);

    // Summary
    const allPassed = testResults.every(r => r === true);
    console.log(`\n==================================================`);
    console.log(`MP3 MUSIC SUITE TEST RESULTS: ${allPassed ? "100% SUCCESSFUL (7/7 PASSED)" : "FAILED"}`);
    console.log(`==================================================\n`);
}

runTests();
