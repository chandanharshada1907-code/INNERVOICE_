const https = require('https');

const audioUrls = [
    { name: "SoundHelix 1", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { name: "SoundHelix 2", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { name: "SoundHelix 3", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { name: "SoundHelix 4", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { name: "SoundHelix 8", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
];

async function check(item) {
    return new Promise((resolve) => {
        https.get(item.url, (res) => {
            console.log(`[${res.statusCode}] ${item.name}: ${res.headers['content-type']}`);
            res.destroy();
            resolve(res.statusCode === 200);
        }).on('error', (e) => {
            console.log(`[ERR] ${item.name}: ${e.message}`);
            resolve(false);
        });
    });
}

async function run() {
    for (const a of audioUrls) {
        await check(a);
    }
}
run();
