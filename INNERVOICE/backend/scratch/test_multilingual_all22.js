const mysql = require('mysql2/promise');
const http = require('http');
require('dotenv').config({ path: 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/.env' });

const languages = [
    { code: 'as', name: 'Assamese (অসমীয়া)', sample: 'আজি মোৰ বৰ ভাগৰ লাগিছে।' },
    { code: 'bn', name: 'Bengali (বাংলা)', sample: 'আজ আমি খুব চাপ অনুভব করছি।' },
    { code: 'brx', name: 'Bodo (बड़ो)', sample: 'आं दिनै गाज्रि मोन्दों।' },
    { code: 'doi', name: 'Dogri (डोगरी)', sample: 'गी आज चिंता होइ रही ऐ।' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)', sample: 'મને આજે બહુ તણાવ અનુભવાય છે.' },
    { code: 'hi', name: 'Hindi (हिन्दी)', sample: 'मुझे आज बहुत तनाव हो रहा है।' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', sample: 'ನನಗೆ ಇಂದು ತುಂಬಾ ಮಾನಸಿಕ ಒತ್ತಡವಿದೆ.' },
    { code: 'ks', name: 'Kashmiri (कॉशुर / كٲشُر)', sample: 'ম্যে ছূ আজ় স্যেঠা পেরেশানী।' },
    { code: 'kok', name: 'Konkani (कोंकणी)', sample: 'म्हाका आयज खूब ताण जाणवता.' },
    { code: 'mai', name: 'Maithili (मैथिली)', sample: 'हमरा आइ बहुत तनाव भ रहल अछि।' },
    { code: 'ml', name: 'Malayalam (മലയാളം)', sample: 'എനിക്ക് ഇന്ന് വളരെ മാനസിക സമ്മർദ്ദമുണ്ട്.' },
    { code: 'mni', name: 'Manipuri / Meitei (মৈতৈলোন / ꯃꯤꯇꯩ ꯂꯣꯟ)', sample: 'ꯉꯁꯤ ꯑꯩ ꯌꯥꯝꯅ ꯑꯋꯥꯕ ꯐꯥꯑꯣꯔꯤ꯫' },
    { code: 'mr', name: 'Marathi (मराठी)', sample: 'मला आज खूप ताण जाणवत आहे.' },
    { code: 'ne', name: 'Nepali (नेपाली)', sample: 'मलाई आज धेरै तनाव भइरहेको छ।' },
    { code: 'or', name: 'Odia (ଓଡ଼ିଆ)', sample: 'ମୋତେ ଆଜି ବହୁତ ମାନସିକ ଚାପ ଲାଗୁଛି।' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', sample: 'ਮੈਨੂੰ ਅੱਜ ਬਹੁਤ ਤਣਾਅ ਮਹਿਸੂਸ ਹੋ ਰਿਹਾ ਹੈ।' },
    { code: 'sa', name: 'Sanskrit (संस्कृतम्)', sample: 'अद्य मम अतिव मानसिकतनावः अस्ति।' },
    { code: 'sat', name: 'Santali (ᱥᱟᱱᱛᱟᱲᱤ)', sample: 'ᱤᱧ ᱛᱮᱦᱮᱧ ᱟᱹᱰᱤ ᱵᱷᱟᱵᱽᱱᱟᱹᱧ ᱟᱹᱭᱠᱟᱹᱣᱮᱫ structure.' },
    { code: 'sd', name: 'Sindhi (سنڌي / सिन्धी)', sample: 'مونکي اڄ تمام گھڻو دٻاءُ محسوس ٿي رهيو آهي.' },
    { code: 'ta', name: 'Tamil (தமிழ்)', sample: 'எனக்கு இன்று மிகவும் மன அழுத்தமாக இருக்கிறது.' },
    { code: 'te', name: 'Telugu (తెలుగు)', sample: 'నాకు ఈరోజు చాలా ఒత్తిడిగా ఉంది.' },
    { code: 'ur', name: 'Urdu (اردو)', sample: 'مجھے آج بہت ذہنی تناؤ محسوس ہو رہا ہے۔' }
];

async function runTests() {
    console.log('====================================================');
    console.log('🧪 TESTING ALL 22 EIGHTH SCHEDULE LANGUAGES FOR INNERVOICE');
    console.log('====================================================\n');

    // 1. Get an existing token or create a test token via DB
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'innervoice',
        port: parseInt(process.env.DB_PORT || '3306', 10)
    });

    const [adminUser] = await conn.execute('SELECT id, name, email FROM users WHERE role = "admin" LIMIT 1');
    await conn.end();

    if (!adminUser.length) {
        console.error('❌ Admin user not found in DB!');
        process.exit(1);
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { id: adminUser[0].id, user_id: adminUser[0].id, role: 'admin' },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '1h' }
    );

    console.log(`✅ Authenticated test user: ${adminUser[0].name} (${adminUser[0].email})`);

    let passedCount = 0;

    for (const lang of languages) {
        process.stdout.write(`Testing language ${lang.code} (${lang.name})... `);

        const postData = JSON.stringify({
            message: lang.sample,
            language: lang.code
        });

        const reqOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/chat/message',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const resData = await new Promise((resolve, reject) => {
            const req = http.request(reqOptions, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve(JSON.parse(body)));
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        if (resData.success && resData.reply && resData.reply.length > 5) {
            console.log(`✅ SUCCESS! AI Reply Snippet: "${resData.reply.substring(0, 50)}..."`);
            passedCount++;
        } else {
            console.log(`❌ FAILED! Response:`, resData);
        }
    }

    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passedCount} / ${languages.length} LANGUAGES PASSED`);
    console.log('====================================================');
}

runTests().catch(err => {
    console.error('Fatal Error:', err);
});
