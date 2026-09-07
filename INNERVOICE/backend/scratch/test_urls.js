const https = require('https');
const http = require('http');

const candidateUrls = [
    { title: "Gentle Rain", url: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Rain_loop.ogg" },
    { title: "Ocean Waves", url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Ocean_waves_sound.ogg" },
    { title: "Forest Birds", url: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Birds_in_the_forest.ogg" },
    { title: "Singing Bowl", url: "https://upload.wikimedia.org/wikipedia/commons/5/52/Singing_bowl_sound.ogg" },
    { title: "Lofi Piano", url: "https://upload.wikimedia.org/wikipedia/commons/3/34/Sound_of_piano.ogg" },
    { title: "Delta Sleep", url: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Rain_and_thunder.ogg" }
];

async function checkUrl(item) {
    return new Promise((resolve) => {
        const client = item.url.startsWith('https') ? https : http;
        const req = client.request(item.url, { method: 'HEAD' }, (res) => {
            console.log(`[${res.statusCode}] ${item.title}: ${item.url} (${res.headers['content-type']})`);
            resolve({ ...item, status: res.statusCode, contentType: res.headers['content-type'] });
        });
        req.on('error', (err) => {
            console.log(`[ERR] ${item.title}: ${err.message}`);
            resolve({ ...item, status: 0, error: err.message });
        });
        req.setTimeout(5000, () => {
            req.destroy();
            resolve({ ...item, status: 0, error: "timeout" });
        });
        req.end();
    });
}

async function testAll() {
    console.log("Checking Wikimedia CC0 audio URLs...");
    for (const item of candidateUrls) {
        await checkUrl(item);
    }
}

testAll();
