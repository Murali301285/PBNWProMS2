const fs = require('fs');
const path = require('path');

const targetDirs = [
    'production-tsmpl',
    'production-ntpc',
    'equipment-performance',
    'eq-group-performance',
    'operator-performance-loading',
    'operator-performance-hauling'
];

function doReplacements(content) {
    // 1. Array index replacement for ${d}-${m}-${y}
    const monthNamesArr = "['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']";
    content = content.replace(
        /`\$\{([a-zA-Z0-9_]+)\}-\$\{([a-zA-Z0-9_]+)\}-\$\{([a-zA-Z0-9_]+)\}`/g,
        (match, $1, $2, $3) => {
            return `\`\${${$1}}-\${${monthNamesArr}[parseInt(${$2}, 10) - 1]}-\${${$3}}\``;
        }
    );

    // 2. .split('-').reverse().join('-') for variables like fDate and tDate
    content = content.replace(
        /([a-zA-Z0-9_]+)\s*\.split\('-'\)\.reverse\(\)\.join\('-'\)/g,
        "$1 ? new Date($1).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'"
    );

    // 3. From: Formats -> there is a specific string:
    // `From Date: ${fDate}        To Date: ${tDate}` -> update to 
    // `From: ${fDate}        To: ${tDate}` based on the user's explicit ask: "from From: 07-04-2026To: 08-04-2026 to From: 07-Apr-2026To: 08-Apr-2026"
    // Wait, the user actually specifically said "From: 07-Apr-2026 To: 08-Apr-2026" 
    // I will replace `From Date: ` with `From: ` and `To Date: ` with `To: ` if found.
    content = content.replace(/From Date:/g, "From:");
    content = content.replace(/To Date:/g, "To:");

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

        // Additionally fix UI report headers if they use raw `split`
        // like operator-performance tables might use `From: {fromDate} To: {toDate}`
        // We'll leave UI table internals out if they are not specifically asked, but the user said "in the report details change the date format...". So I'll also modify Table.js files.

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

        // If table components do {fromDate} and {toDate} directly, we want to replace that logic
        content = content.replace(
            /(From\s*:\s*)(?:\{fromDate\}|\{fDate\})/g,
            "$1{fromDate ? new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}"
        );
        content = content.replace(
            /(To\s*:\s*)(?:\{toDate\}|\{tDate\})/g,
            "$1{toDate ? new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}"
        );

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed Table:', path.join(dir, file));
        }
    });

});
