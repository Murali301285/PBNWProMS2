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

        // Display string split replacement for toLocaleDateString which generates slashes
        // Make sure not to double replace if it already has .replace(/\//g, '-')
        const regex = /\.toLocaleDateString\('en-GB'\)(?!(\s*\.replace|\s*===))/g;
        content = content.replace(regex, ".toLocaleDateString('en-GB').replace(/\\//g, '-')");

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', filePath);
        }
    });

    // Process nested files too
    const nestedFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('Table.js') || f.includes('Table'));
    nestedFiles.forEach(file => {
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        const regex = /\.toLocaleDateString\('en-GB'\)(?!(\s*\.replace|\s*===))/g;
        content = content.replace(regex, ".toLocaleDateString('en-GB').replace(/\\//g, '-')");
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed Table:', filePath);
        }
    });
});
