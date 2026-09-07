const fs = require('fs');

console.log("=== STARTING PURE NODE MUSIC ENGINE SUITE VERIFICATION ===");

function createDummyElement() {
    const el = {
        innerHTML: '',
        textContent: '',
        value: '0.8',
        style: {},
        classList: { add:()=>{}, remove:()=>{}, toggle:()=>{} },
        addEventListener: ()=>{},
        removeEventListener: ()=>{},
        setAttribute: ()=>{},
        removeAttribute: ()=>{},
        querySelector: () => createDummyElement(),
        querySelectorAll: () => []
    };
    return el;
}

const mockElements = {
    musicPlaylistGrid: createDummyElement(),
    playerTrackIcon: createDummyElement(),
    playerTrackTitle: createDummyElement(),
    playerTrackSub: createDummyElement(),
    playerPlayBtn: createDummyElement(),
    playerFavBtn: createDummyElement(),
    musicCurrentTime: createDummyElement(),
    musicDuration: createDummyElement(),
    musicSeekSlider: createDummyElement(),
    musicMuteBtn: createDummyElement(),
    musicVolumeSlider: createDummyElement()
};

const documentMock = {
    getElementById: (id) => mockElements[id] || createDummyElement(),
    querySelector: () => createDummyElement(),
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
    setTimeout: () => {},
    setInterval: (fn) => 123,
    clearInterval: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
};

// Read script.js content
const scriptContent = fs.readFileSync('script.js', 'utf8');

// Wrap script.js in a try/catch or dummy function scope to extract global window bindings
const runSandbox = new Function('window', 'document', 'Audio', 'AudioContext', 'webkitAudioContext', 'localStorage', 'currentUser', 'escapeHTMLSafe', 'medFormatTime', 'showMessage', 'markWellnessDone', 'setTimeout', 'setInterval', 'clearInterval', `
    try {
        ${scriptContent}
    } catch(e) {
        // Safe execution swallow for DOM initialization of non-music tabs
    }
`);

runSandbox(
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
    windowMock.setTimeout,
    windowMock.setInterval,
    windowMock.clearInterval
);

async function runTests() {
    let testResults = [];

    // Test 1: Play Track 0 (Rain)
    console.log("\n[Test 1] Calling window.playMusicTrack(0)...");
    await windowMock.playMusicTrack(0);
    const player1 = windowMock.htmlAudioPlayer;

    const state1 = {
        src: player1?.src,
        paused: player1?.paused,
        muted: player1?.muted,
        volume: player1?.volume,
        readyState: player1?.readyState,
        currentTime: player1?.currentTime,
        duration: player1?.duration,
        networkState: player1?.networkState
    };
    console.log("Diagnostic Log output:", state1);

    const check1 = player1 && player1.paused === false && player1.src.includes('rain.wav') && player1.volume > 0 && player1.muted === false;
    console.log(`Test 1 (Play Rain.wav): ${check1 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check1);

    // Test 2: Pause Track
    console.log("\n[Test 2] Calling window.pauseMusicTrack()...");
    windowMock.pauseMusicTrack();
    const check2 = player1.paused === true;
    console.log(`Test 2 (Pause Track): ${check2 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check2);

    // Test 3: Resume Track
    console.log("\n[Test 3] Calling window.resumeMusicTrack()...");
    await windowMock.resumeMusicTrack();
    const check3 = player1.paused === false;
    console.log(`Test 3 (Resume Track): ${check3 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check3);

    // Test 4: Next Track (Ocean.wav)
    console.log("\n[Test 4] Calling window.nextMusicTrack()...");
    await windowMock.nextMusicTrack();
    const check4 = player1.src.includes('ocean.wav') && player1.paused === false;
    console.log(`Test 4 (Next Track -> Ocean): ${check4 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check4);

    // Test 5: Prev Track (Rain.wav)
    console.log("\n[Test 5] Calling window.prevMusicTrack()...");
    await windowMock.prevMusicTrack();
    const check5 = player1.src.includes('rain.wav') && player1.paused === false;
    console.log(`Test 5 (Prev Track -> Rain): ${check5 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check5);

    // Test 6: Volume & Mute
    console.log("\n[Test 6] Testing setMusicVolume & toggleMusicMute...");
    windowMock.setMusicVolume(0.4);
    const volOk = player1.volume === 0.4;
    windowMock.toggleMusicMute();
    const muteOk = player1.muted === true;
    windowMock.toggleMusicMute();
    const unmuteOk = player1.muted === false;
    const check6 = volOk && muteOk && unmuteOk;
    console.log(`Test 6 (Volume/Mute Controls): ${check6 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check6);

    // Test 7: Direct Switch to Track 6 (Piano.wav)
    console.log("\n[Test 7] Calling window.playMusicTrack(6) (Piano.wav)...");
    await windowMock.playMusicTrack(6);
    const check7 = player1.src.includes('piano.wav') && player1.paused === false;
    console.log(`Test 7 (Track Switch -> Piano): ${check7 ? '✓ PASSED' : '❌ FAILED'}`);
    testResults.push(check7);

    // Summary
    const allPassed = testResults.every(r => r === true);
    console.log(`\n==================================================`);
    console.log(`PURE NODE MUSIC SUITE: ${allPassed ? "100% SUCCESSFUL (7/7 PASSED)" : "FAILED"}`);
    console.log(`==================================================\n`);
}

runTests();
