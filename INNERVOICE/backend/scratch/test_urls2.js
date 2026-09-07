const https = require('https');

const candidateUrls = [
    { title: "SoundHelix 1", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { title: "SoundHelix 2", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { title: "Rain Sound", url: "https://ia800201.us.archive.org/12/items/RainSounds10Hours/RainSounds10Hours.mp3" },
    { title: "Ocean Sound", url: "https://ia800408.us.archive.org/10/items/OceanWaves_201804/OceanWaves.mp3" },
    { title: "Forest Sound", url: "https://ia800902.us.archive.org/4/items/ForestBirdsAmbience/ForestBirds.mp3" }
];

function checkUrl(item) {
    return new Promise((resolve) => {
        const options = new URL(item.url);
        options.headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
        options.method = 'GET';
        
        const req = https.request(options, (res) => {
            console.log(`[${res.statusCode}] ${item.title}: ${res.headers['content-type']}`);
            res.destroy();
            resolve({ ...item, status: res.statusCode });
        });
        req.on('error', (e) => {
            console.log(`[ERR] ${item.title}: ${e.message}`);
            resolve({ ...item, status: 0 });
        });
        req.setTimeout(5000, () => { req.destroy(); resolve({ ...item, status: 0 }); });
        req.end();
    });
}

async function run() {
    for (const c of candidateUrls) {
        await checkUrl(c);
    }
}
run();
