const fs = require('fs');
const path = require('path');

const targetDirs = [
    'material-loading',
    'material-rehandling',
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

        // 1. Ensure Excel Export has formatted dates (replace .split('-').reverse().join('/'))
        // For loading/hauling master it has fDate.split('-').reverse().join('/')
        content = content.replace(
            /(let\s+fDate\s*=\s*fromDate,\s*tDate\s*=\s*toDate;\s*if\s*\(fDate\s*&&\s*fDate\.includes\('-'\)\s*\)\s*fDate\s*=)\s*fDate\.split\('-'\)\.reverse\(\)\.join\('\/'\);/g,
            "$1 fDate ? new Date(fDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';"
        );

        content = content.replace(
            /(if\s*\(tDate\s*&&\s*tDate\.includes\('-'\)\s*\)\s*tDate\s*=)\s*tDate\.split\('-'\)\.reverse\(\)\.join\('\/'\);/g,
            "$1 tDate ? new Date(tDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';"
        );

        // For material loading/rehandling it has:
        // if (fDate && fDate.includes('-') && fDate.split('-')[0].length === 4) fDate = fDate ? new Date...
        content = content.replace(
            /if\s*\(\s*fDate\s*&&\s*fDate\.includes\('-'\)\s*&&\s*fDate\.split\('-'\)\[0\]\.length\s*===\s*4\s*\)\s*fDate\s*=\s*fDate\.split\('-'\)\.reverse\(\)\.join\('-'\);/g,
            "if (fDate && fDate.includes('-') && fDate.split('-')[0].length === 4) fDate = fDate ? new Date(fDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';"
        );

        content = content.replace(
            /if\s*\(\s*tDate\s*&&\s*tDate\.includes\('-'\)\s*&&\s*tDate\.split\('-'\)\[0\]\.length\s*===\s*4\s*\)\s*tDate\s*=\s*tDate\.split\('-'\)\.reverse\(\)\.join\('-'\);/g,
            "if (tDate && tDate.includes('-') && tDate.split('-')[0].length === 4) tDate = tDate ? new Date(tDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';"
        );

        // Standardize Excel headers
        content = content.replace(/From Date:/g, "From:");
        content = content.replace(/To Date:/g, "To:");

        // 2. ONLY Format parameters passed to <ReportTable>
        // Use a targeted block replacement by splitting on <ReportTable
        const parts = content.split('<ReportTable');
        if (parts.length > 1) {
            // Replace `fromDate={fromDate}` OR `fromDate={filter.fromDate}` with formatted version
            parts[1] = parts[1].replace(/fromDate=\{fromDate\}/, "fromDate={fromDate ? new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}");
            parts[1] = parts[1].replace(/toDate=\{toDate\}/, "toDate={toDate ? new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}");
            
            parts[1] = parts[1].replace(/fromDate=\{filter\.fromDate\}/, "fromDate={filter.fromDate ? new Date(filter.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}");
            parts[1] = parts[1].replace(/toDate=\{filter\.toDate\}/, "toDate={filter.toDate ? new Date(filter.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}");
            
            content = parts.join('<ReportTable');
        }

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed ReportTable & Excel mapping:', path.join(dir, file));
        }
    });

    console.log(dir, "done check");
});
