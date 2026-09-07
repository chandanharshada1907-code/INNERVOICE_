const fs = require('fs');

const langCodes = [
    "en", "as", "bn", "brx", "doi", "gu", "hi", "kn", "ks", "kok",
    "mai", "ml", "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd",
    "ta", "te", "ur"
];

console.log('Total Eighth Schedule Languages:', langCodes.length - 1);
console.log('Includes English:', langCodes.includes('en'));
