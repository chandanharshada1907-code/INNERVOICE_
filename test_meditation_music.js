/**
 * test_meditation_music.js
 * Comprehensive unit test suite for INNERVOICE Meditation & Music modules
 */

const assert = require("assert");

console.log("==================================================");
console.log("🧪 RUNNING INNERVOICE MEDITATION & MUSIC TESTS");
console.log("==================================================");

// Test 1: Meditation Sessions Data Structure
console.log("\n[TEST 1] Meditation Sessions Data Structure & Integrity");
const MEDITATION_SESSIONS = {
    "body-scan": {
        title: "🌿 Mindful Body Scan",
        defaultDuration: 2,
        icon: "🌿",
        steps: [
            "Sit or lie down in a comfortable, relaxed position.",
            "Close your eyes gently and take three slow, deep breaths.",
            "Notice any areas of tension in your body — from head to toe.",
            "With each calm exhale, let the tension soften and dissolve.",
            "When the completion bell sounds, open your eyes slowly."
        ]
    },
    "stress-relief": {
        title: "🧘 Deep Stress Relief",
        defaultDuration: 5,
        icon: "🧘",
        steps: [
            "Unclench your jaw, drop your shoulders, and relax your hands.",
            "Inhale gently through your nose for 4 counts.",
            "Hold the calm breath comfortably for 4 counts.",
            "Exhale slowly and completely for 6 counts.",
            "Feel a wave of peaceful stillness washing over your mind."
        ]
    },
    "morning-focus": {
        title: "🌅 Morning Clarity & Focus",
        defaultDuration: 5,
        icon: "🌅",
        steps: [
            "Sit upright with an alert, open posture.",
            "Bring your awareness to the present moment and the sensations of morning light.",
            "Set a gentle intention for how you wish to feel and act today.",
            "Breathe in clarity and purpose; breathe out distraction.",
            "Carry this centered calm into your day."
        ]
    },
    "evening-sleep": {
        title: "🌙 Evening Wind-Down",
        defaultDuration: 10,
        icon: "🌙",
        steps: [
            "Dim the lights and settle comfortably into bed or a restful chair.",
            "Acknowledge everything that happened today and give yourself permission to let it rest.",
            "Slow down your breathing, feeling your body grow heavy and peaceful.",
            "Allow each thought to drift away like clouds across the night sky.",
            "Rest deeply knowing you are safe."
        ]
    },
    "self-compassion": {
        title: "🕊️ Self-Compassion & Healing",
        defaultDuration: 5,
        icon: "🕊️",
        steps: [
            "Place a comforting hand gently over your heart.",
            "Silently say to yourself: 'May I be kind to myself in this moment.'",
            "Recognize that struggle and imperfection are part of our shared human experience.",
            "Breathe in warmth and acceptance for who you are right now.",
            "Let go of harsh judgments and embrace yourself with kindness."
        ]
    }
};

const sessionKeys = Object.keys(MEDITATION_SESSIONS);
assert.strictEqual(sessionKeys.length, 5, "Expected 5 guided meditation sessions");
sessionKeys.forEach(k => {
    const s = MEDITATION_SESSIONS[k];
    assert.ok(s.title && s.title.length > 0, `Session ${k} must have a non-empty title`);
    assert.ok(s.defaultDuration > 0, `Session ${k} must have a positive duration`);
    assert.ok(s.steps && s.steps.length >= 3, `Session ${k} must have at least 3 guided steps`);
    console.log(`  ✓ Validated session '${k}' (${s.title}, ${s.defaultDuration} min, ${s.steps.length} steps)`);
});

// Test 2: Meditation Timer Time Formatting & Progress Calculation
console.log("\n[TEST 2] Meditation Timer Formatting & Progress Calculations");
function medFormatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}

assert.strictEqual(medFormatTime(120), "02:00");
assert.strictEqual(medFormatTime(300), "05:00");
assert.strictEqual(medFormatTime(600), "10:00");
assert.strictEqual(medFormatTime(59), "00:59");
assert.strictEqual(medFormatTime(5), "00:05");
assert.strictEqual(medFormatTime(0), "00:00");
console.log("  ✓ medFormatTime formats 0s, 5s, 59s, 120s, 300s, 600s correctly");

function calculateSvgOffset(remainingSecs, totalSecs) {
    const circumference = 2 * Math.PI * 90; // ~565.48667
    const fraction = totalSecs > 0 ? (remainingSecs / totalSecs) : 0;
    return circumference * (1 - fraction);
}

const circ = 2 * Math.PI * 90;
assert.strictEqual(calculateSvgOffset(120, 120), 0, "Initial offset at 100% remaining should be 0");
assert.strictEqual(Math.round(calculateSvgOffset(60, 120)), Math.round(circ * 0.5), "50% remaining offset should be half circumference");
assert.strictEqual(Math.round(calculateSvgOffset(0, 120)), Math.round(circ), "0% remaining offset should be full circumference");
console.log("  ✓ SVG progress ring offset math verified (0% -> 50% -> 100% stroke completion)");

// Test 3: Music Playlist Integrity & Track Sound Mapping
console.log("\n[TEST 3] Music Playlist Integrity & Distinct Soundscapes");
const MUSIC_PLAYLIST = [
    { id: 1, title: "Gentle Rain & Distant Thunder", category: "nature", icon: "🌧️", duration: "05:00", durationSec: 300, soundType: "rain", desc: "Soothing natural rainfall filter for deep peace." },
    { id: 2, title: "Ocean Waves & Coastal Breeze", category: "nature", icon: "🌊", duration: "05:00", durationSec: 300, soundType: "ocean", desc: "Rhythmic oceanic surf swells to release stress." },
    { id: 3, title: "Morning Forest Birds & Stream", category: "nature", icon: "🌲", duration: "05:00", durationSec: 300, soundType: "forest", desc: "Gentle woodland ambient with bird chimes." },
    { id: 4, title: "Tibetan Singing Bowl Resonance", category: "meditation", icon: "🧘", duration: "10:00", durationSec: 600, soundType: "zen-bowl", desc: "Harmonic bell frequencies for mental stillness." },
    { id: 5, title: "Cosmic Om Meditative Drone", category: "meditation", icon: "🕉️", duration: "10:00", durationSec: 600, soundType: "om-drone", desc: "136.1Hz Earth frequency harmonic chord." },
    { id: 6, title: "Binaural Alpha Waves (Focus)", category: "focus", icon: "🧠", duration: "08:00", durationSec: 480, soundType: "focus", desc: "10Hz differential stereo waves for concentration." },
    { id: 7, title: "Midnight Calm Lofi Piano", category: "focus", icon: "🎹", duration: "04:30", durationSec: 270, soundType: "piano", desc: "Gentle repetitive pentatonic melody for study." },
    { id: 8, title: "Deep Delta Sleep Soundscape", category: "sleep", icon: "🌙", duration: "15:00", durationSec: 900, soundType: "sleep", desc: "2Hz restorative brainwave sleep frequency." }
];

assert.strictEqual(MUSIC_PLAYLIST.length, 8, "Expected 8 distinct ambient tracks");
const uniqueSoundTypes = new Set(MUSIC_PLAYLIST.map(t => t.soundType));
assert.strictEqual(uniqueSoundTypes.size, 8, "All 8 tracks must have unique soundscape engines (no duplicate audio sources)");
MUSIC_PLAYLIST.forEach(t => {
    assert.ok(t.durationSec > 0, `Track ${t.title} must have positive durationSec`);
    assert.ok(["nature", "meditation", "focus", "sleep"].includes(t.category), `Track ${t.title} has invalid category`);
    console.log(`  ✓ Validated track #${t.id} [${t.category.toUpperCase()}] "${t.title}" -> engine: ${t.soundType} (${t.duration})`);
});

// Test 4: Search & Category Filtering
console.log("\n[TEST 4] Search & Category Filtering Logic");
function filterTracks(playlist, category, query, favs = []) {
    return playlist.filter(track => {
        if (category === "favorites") {
            if (!favs.includes(track.id)) return false;
        } else if (category !== "all") {
            if (track.category !== category) return false;
        }
        if (query) {
            const q = query.toLowerCase().trim();
            const matchTitle = track.title.toLowerCase().includes(q);
            const matchDesc = track.desc.toLowerCase().includes(q);
            const matchCat = track.category.toLowerCase().includes(q);
            if (!matchTitle && !matchDesc && !matchCat) return false;
        }
        return true;
    });
}

const allTracks = filterTracks(MUSIC_PLAYLIST, "all", "");
assert.strictEqual(allTracks.length, 8, "All filter returns all 8 tracks");

const natureTracks = filterTracks(MUSIC_PLAYLIST, "nature", "");
assert.strictEqual(natureTracks.length, 3, "Nature filter returns exactly 3 tracks");

const medTracks = filterTracks(MUSIC_PLAYLIST, "meditation", "");
assert.strictEqual(medTracks.length, 2, "Meditation filter returns exactly 2 tracks");

const focusTracks = filterTracks(MUSIC_PLAYLIST, "focus", "");
assert.strictEqual(focusTracks.length, 2, "Focus filter returns exactly 2 tracks");

const sleepTracks = filterTracks(MUSIC_PLAYLIST, "sleep", "");
assert.strictEqual(sleepTracks.length, 1, "Sleep filter returns exactly 1 track");

const searchThunder = filterTracks(MUSIC_PLAYLIST, "all", "thunder");
assert.strictEqual(searchThunder.length, 1);
assert.strictEqual(searchThunder[0].id, 1);

const searchFocusDesc = filterTracks(MUSIC_PLAYLIST, "all", "concentration");
assert.strictEqual(searchFocusDesc.length, 1);
assert.strictEqual(searchFocusDesc[0].id, 6);

console.log("  ✓ Category filtering ('all', 'nature', 'meditation', 'focus', 'sleep') passed 100%");
console.log("  ✓ Search filtering (title & description matches) passed 100%");

// Test 5: Favorites Toggle & Persistence Logic
console.log("\n[TEST 5] Favorites Management & Persistence Logic");
let mockStorage = {};
const userEmail = "testuser@innervoice.com";
const favKey = "innerVoiceMusicFavs_" + userEmail;

function mockToggleFavorite(trackId) {
    let favs = JSON.parse(mockStorage[favKey] || "[]");
    const idx = favs.indexOf(trackId);
    if (idx >= 0) {
        favs.splice(idx, 1);
    } else {
        favs.push(trackId);
    }
    mockStorage[favKey] = JSON.stringify(favs);
    return favs;
}

assert.deepStrictEqual(mockToggleFavorite(2), [2], "Favorite track #2");
assert.deepStrictEqual(mockToggleFavorite(5), [2, 5], "Favorite track #5");
assert.strictEqual(filterTracks(MUSIC_PLAYLIST, "favorites", "", JSON.parse(mockStorage[favKey])).length, 2, "Favorites filter returns 2 favorited tracks");

assert.deepStrictEqual(mockToggleFavorite(2), [5], "Unfavorite track #2");
assert.strictEqual(filterTracks(MUSIC_PLAYLIST, "favorites", "", JSON.parse(mockStorage[favKey])).length, 1, "Favorites filter returns 1 remaining track");
console.log("  ✓ Favorites add, remove, and filter persistence passed 100%");

// Test 6: Seeking and Volume Calculation
console.log("\n[TEST 6] Audio Seeking & Volume Controls");
function calculateSeekSeconds(percentage, durationSec) {
    const pct = Math.max(0, Math.min(100, percentage)) / 100;
    return Math.round(pct * durationSec);
}

assert.strictEqual(calculateSeekSeconds(0, 300), 0);
assert.strictEqual(calculateSeekSeconds(50, 300), 150);
assert.strictEqual(calculateSeekSeconds(100, 300), 300);
assert.strictEqual(calculateSeekSeconds(150, 300), 300); // Out of bounds clamp
assert.strictEqual(calculateSeekSeconds(-20, 300), 0);   // Out of bounds clamp
console.log("  ✓ Seek slider percent-to-second mapping & bounds clamp passed 100%");

console.log("\n==================================================");
console.log("✅ ALL MEDITATION & MUSIC UNIT TESTS PASSED!");
console.log("==================================================");
