const fs = require('fs');
const path = require('path');

const targetDirs = [
    'loading-master',
    'hauling-master'
];

targetDirs.forEach(dir => {
    const dirPath = path.join('f:/Dev/ProMS/ProMSDev/app/dashboard/reports', dir);
    if (!fs.existsSync(dirPath)) return;
    
    ['page.js'].forEach(file => {
        const filePath = path.join(dirPath, file);
        if(!fs.existsSync(filePath)) return;
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // 1. .split('-').reverse().join('-') -> new format for 'date'
        content = content.replace(
            /(let\s+fDate\s*=\s*fromDate,\s*tDate\s*=\s*toDate;\s*if\s*\(fDate\s*&&\s*fDate\.includes\('-'\)\s*&&\s*fDate\.split\('-'\)\[0\]\.length\s*===\s*4\)\s*fDate\s*=)\s*fDate\.split\('-'\)\.reverse\(\)\.join\('-'\);/g,
            "$1 fDate ? new Date(fDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';"
        );

        content = content.replace(
            /(if\s*\(tDate\s*&&\s*tDate\.includes\('-'\)\s*&&\s*tDate\.split\('-'\)\[0\]\.length\s*===\s*4\)\s*tDate\s*=)\s*tDate\.split\('-'\)\.reverse\(\)\.join\('-'\);/g,
            "$1 tDate ? new Date(tDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';"
        );

        content = content.replace(/From Date:/g, "From:");
        content = content.replace(/To Date:/g, "To:");

        // For UI: specifically inside <ReportTable ...>
        // We will split the file by <ReportTable and then replace fromDate={fromDate} in the second part
        const parts = content.split('<ReportTable');
        if (parts.length > 1) {
            parts[1] = parts[1].replace(/fromDate=\{fromDate\}/, "fromDate={fromDate ? new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}");
            parts[1] = parts[1].replace(/toDate=\{toDate\}/, "toDate={toDate ? new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}");
            content = parts.join('<ReportTable');
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', path.join(dir, file));
        }
    });
});
