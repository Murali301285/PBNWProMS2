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
    'water-tanker-entry',
    'daily-progress',
    'daily-production',
    'shift-report',
    'sector-wise-production',
    'chp-pss-production',
    'breakdown-time-analysis',
    'tentative-production',
    'day-wise-production'
];

// Helper to format string in file
function doReplacements(content) {
    let original = content;

    // Replace the format string like `${d}-${m}-${y}` IF it's forming a date.
    // Wait, let's replace `${d}-${m}-${y}` with explicit logic!
    // But it's usually inside formatters. Let's find common date string formats used.

    // 1. .toLocaleDateString('en-GB').replace(/\//g, '-') -> new format
    content = content.replace(
        /\.toLocaleDateString\('en-GB'\)\.replace\(\/\\\/\\\/g,\s*'-'\)/g,
        ".toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')"
    );

    // 2. new Date(...).toLocaleDateString('en-GB') -> new format (if not already replaced)
    content = content.replace(
        /\.toLocaleDateString\('en-GB'\)(?!, { day)/g,
        ".toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')"
    );

    // 3. .split('-').reverse().join('-') -> new format for 'date' variables
    content = content.replace(
        /([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\.split\('-'\)\.reverse\(\)\.join\('-'\);/g,
        "$1 = $2 ? new Date($2).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';"
    );

    content = content.replace(
        /'Date: '\s*\+\s*([a-zA-Z0-9_]+)\.split\('-'\)\.reverse\(\)\.join\('-'\)/g,
        "`Date: ${$1 ? new Date($1).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}`"
    );

    // 4. `formattedDate = ${d}-${m}-${y}` format:
    // It is normally inside something like:
    // const [y, m, d] = date.split('-');
    // formattedDate = `${d}-${m}-${y}`;
    // Let's replace `${d}-${m}-${y}` with an array lookup for month.
    // Actually, we can inject a helper array:
    const monthNamesArr = "['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']";
    content = content.replace(
        /`\$\{([a-zA-Z0-9_]+)\}-\$\{([a-zA-Z0-9_]+)\}-\$\{([a-zA-Z0-9_]+)\}`/g,
        (match, $1, $2, $3) => {
            // $2 is month
            return `\`\${${$1}}-\${${monthNamesArr}[parseInt(${$2}, 10) - 1]}-\${${$3}}\``;
        }
    );

    // 5. Also replace `From Date: ${fDate}        To Date: ${tDate}` where Date uses hyphens but no months yet.
    // Actually fDate and tDate were defined as `.split('-').reverse().join('-')` which is handled by step 3.

    return content;
}

targetDirs.forEach(dir => {
    const dirPath = path.join('f:/Dev/ProMS/ProMSDev/app/dashboard/reports', dir);
    if (!fs.existsSync(dirPath)) return;
    
    // Process js files 
    ['page.js'].forEach(file => {
        const filePath = path.join(dirPath, file);
        if(!fs.existsSync(filePath)) return;
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        content = doReplacements(content);

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', path.join(dir, file));
        }
    });

    const nestedFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('Table.js') || f.includes('Table'));
    nestedFiles.forEach(file => {
        const filePath = path.join(dirPath, file);
        if(!fs.existsSync(filePath)) return;
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        content = doReplacements(content);

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed Table:', path.join(dir, file));
        }
    });
});
