const fs = require('fs');
const path = require('path');

const scriptPath = 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/script.js';
const i18nSnippetPath = 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/scratch/i18n_code_snippet.js';

let scriptContent = fs.readFileSync(scriptPath, 'utf8');
const i18nSnippet = fs.readFileSync(i18nSnippetPath, 'utf8');

// 1. Update formatLanguageLabel
const oldFormatLangRegex = /function formatLanguageLabel\(l\)\s*\{[\s\S]*?return map\[l\] \|\| "English";\s*\}/;

const newFormatLang = `function formatLanguageLabel(l) {
        const map = {
            "as": "অসমীয়া (Assamese)",
            "bn": "বাংলা (Bengali)",
            "brx": "बड़ो (Bodo)",
            "doi": "डोगरी (Dogri)",
            "gu": "ગુજરાતી (Gujarati)",
            "hi": "हिन्दी (Hindi)",
            "kn": "ಕನ್ನಡ (Kannada)",
            "ks": "कॉशुर / كٲشُر (Kashmiri)",
            "kok": "कोंकणी (Konkani)",
            "mai": "मैथिली (Maithili)",
            "ml": "മലയാളം (Malayalam)",
            "mni": "মৈতৈলোন / ꯃꯤꯇꯩ ꯂꯣꯟ (Manipuri / Meitei)",
            "mr": "मराठी (Marathi)",
            "ne": "नेपाली (Nepali)",
            "or": "ଓଡ଼ିଆ (Odia)",
            "pa": "ਪੰਜਾਬੀ (Punjabi)",
            "sa": "संस्कृतम् (Sanskrit)",
            "sat": "ᱥᱟᱱᱛᅡᱲᱤ (Santali)",
            "sd": "سنڌي / सिन्धी (Sindhi)",
            "ta": "தமிழ் (Tamil)",
            "te": "తెలుగు (Telugu)",
            "ur": "اردو (Urdu)",
            "en": "English"
        };
        return map[l] || "English";
    }`;

scriptContent = scriptContent.replace(oldFormatLangRegex, newFormatLang);

// 2. Update sendChatMessage body JSON payload
const oldBodyPayload = `body: JSON.stringify({ message })`;
const newBodyPayload = `body: JSON.stringify({ message, language: localStorage.getItem("innerVoiceAppLang") || (window.currentUser && window.currentUser.language) || "en" })`;

scriptContent = scriptContent.replace(oldBodyPayload, newBodyPayload);

// 3. Sync language elements in renderProfileView
const oldRenderProfileLang = `if (langSelect) langSelect.value = profile.language || "en";`;
const newRenderProfileLang = `if (langSelect) langSelect.value = profile.language || "en";
        const topbarLangSelect = document.getElementById("topbarLanguageSelect");
        if (topbarLangSelect) topbarLangSelect.value = profile.language || "en";
        const activeLang = profile.language || localStorage.getItem("innerVoiceAppLang") || "en";
        localStorage.setItem("innerVoiceAppLang", activeLang);
        if (typeof window.changeAppLanguage === 'function') window.changeAppLanguage(activeLang);`;

scriptContent = scriptContent.replace(oldRenderProfileLang, newRenderProfileLang);

// 4. Append i18nSnippet at the end of script.js if not already present
if (!scriptContent.includes('EIGHTH SCHEDULE (22 OFFICIAL LANGUAGES OF INDIA)')) {
    scriptContent += '\n\n' + i18nSnippet;
}

fs.writeFileSync(scriptPath, scriptContent, 'utf8');
console.log('Successfully updated script.js with i18n & 22-language support!');
