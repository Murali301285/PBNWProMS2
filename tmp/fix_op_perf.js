const fs = require('fs');
const files = [
    'f:/Dev/ProMS/ProMSDev/app/dashboard/reports/operator-performance-hauling/page.js',
    'f:/Dev/ProMS/ProMSDev/app/dashboard/reports/operator-performance-loading/page.js'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Change 1
    content = content.replace(
        /\{ header: 'Date', accessor: 'Date', width: '100px', render: r => new Date\(r\.Date\)\.toLocaleDateString\('en-GB'\) \},/,
        `{ header: 'Date', accessor: 'Date', width: '100px' },`
    );

    // Change 2
    content = content.replace(
        /if \(fDate && fDate\.includes\('-'\)\) fDate = fDate\.split\('-'\)\.reverse\(\)\.join\('\/'\);/,
        `if (fDate && fDate.includes('-') && fDate.split('-')[0].length === 4) fDate = fDate.split('-').reverse().join('-');`
    );
    content = content.replace(
        /if \(tDate && tDate\.includes\('-'\)\) tDate = tDate\.split\('-'\)\.reverse\(\)\.join\('\/'\);/,
        `if (tDate && tDate.includes('-') && tDate.split('-')[0].length === 4) tDate = tDate.split('-').reverse().join('-');`
    );

    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed', f);
});
