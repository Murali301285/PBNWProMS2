const fs = require('fs');
const glob = require('glob'); // Note: I'll just hardcode paths to ensure safety

const files = [
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/loading-from-mines/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/material-rehandling/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/equipment-reading/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/drilling/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/blasting/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/crusher/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/electrical-entry/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/dispatch-entry/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/water-tanker-entry/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/transaction/bds-entry/page.js'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        const searchRegex = /\.toLocaleDateString\('en-GB'\)/g;
        const replaceString = `.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')`;
        
        if (searchRegex.test(content)) {
            content = content.replace(searchRegex, replaceString);
            fs.writeFileSync(file, content, 'utf8');
            console.log("Updated date format in:", file);
        } else {
            console.log("No match found in:", file);
        }
    } else {
        console.log("File not found:", file);
    }
}
console.log("Done.");
