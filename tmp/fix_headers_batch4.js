const fs = require('fs');
const path = require('path');

const targetDirs = [
    'crusher-summary',
    'cr-stoppage-cumulative',
    'cr-daily-shift',
    'mis-drilling',
    'mis-blasting',
    'electrical-monitoring',
    'hauling-model-trip-hr',
    'water-tanker-entry'
];

targetDirs.forEach(dir => {
    const dirPath = path.join('f:/Dev/ProMS/ProMSDev/app/dashboard/reports', dir);
    if (!fs.existsSync(dirPath)) return;
    
    // Process top level js 
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // 1. .split('-').reverse().join('-') -> new format for 'date'
        // E.g. const fmtDate = date.split('-').reverse().join('-');
        content = content.replace(
            /(const|let) ([a-zA-Z0-9_]+) = ([a-zA-Z0-9_]+)\.split\('-'\)\.reverse\(\)\.join\('-'\);/g,
            "$1 $2 = $3 ? new Date($3).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';"
        );

        // 2. Same for fDate and tDate cases: 
        // fDate = fDate.split('-').reverse().join('-');
        content = content.replace(
            /([a-zA-Z0-9_]+) = ([a-zA-Z0-9_]+)\.split\('-'\)\.reverse\(\)\.join\('-'\);/g,
            "$1 = $2 ? new Date($2).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';"
        );

        // 3. toLocaleDateString('en-GB').replace(/\//g, '-') -> new format
        content = content.replace(
            /\.toLocaleDateString\('en-GB'\)\.replace\(\/\\\/\\\/g, '-'\)/g,
            ".toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')"
        );

        // 4. Sometimes it was: 'Date: ' + date.split('-').reverse().join('-')
        content = content.replace(
            /'Date: '\s*\+\s*([a-zA-Z0-9_]+)\.split\('-'\)\.reverse\(\)\.join\('-'\)/g,
            "`Date: ${$1 ? new Date($1).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}`"
        );

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', file);
        }
    });

    const nestedFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('Table.js') || f.includes('Table'));
    nestedFiles.forEach(file => {
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        content = content.replace(
            /\.toLocaleDateString\('en-GB'\)\.replace\(\/\\\/\\\/g, '-'\)/g,
            ".toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')"
        );

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed Table:', file);
        }
    });
});
