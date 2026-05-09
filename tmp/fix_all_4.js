const fs = require('fs');
const path = require('path');

const targetDirs = [
    'material-loading',
    'material-rehandling',
    'loading-master',
    'hauling-master'
];

function doReplacements(content) {
    let original = content;

    // 1. .split('-').reverse().join('-') for variables like fDate and tDate
    content = content.replace(
        /([a-zA-Z0-9_]+)\s*\.split\('-'\)\.reverse\(\)\.join\('-'\)/g,
        "$1 ? new Date($1).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'"
    );

    // 2. From Date: -> From:
    content = content.replace(/From Date:/g, "From:");
    content = content.replace(/To Date:/g, "To:");

    return content;
}

targetDirs.forEach(dir => {
    const dirPath = path.join('f:/Dev/ProMS/ProMSDev/app/dashboard/reports', dir);
    if (!fs.existsSync(dirPath)) return;
    
    ['page.js'].forEach(file => {
        const filePath = path.join(dirPath, file);
        if(!fs.existsSync(filePath)) return;
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        content = doReplacements(content);

        // Update passing variables to ReportTable:
        // fromDate={filter.fromDate} -> 
        // fromDate={filter.fromDate ? new Date(filter.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}
        content = content.replace(
            /(from\s*Date=\{)(filter\.fromDate)(\})/g,
            "$1$2 ? new Date($2).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-$3"
        );
        content = content.replace(
            /(to\s*Date=\{)(filter\.toDate)(\})/g,
            "$1$2 ? new Date($2).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-$3"
        );

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', path.join(dir, file));
        }
    });

    // Also look for Table components in the dir just in case
    const nestedFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('Table.js') || f.includes('Table'));
    nestedFiles.forEach(file => {
        const filePath = path.join(dirPath, file);
        if(!fs.existsSync(filePath)) return;
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

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
