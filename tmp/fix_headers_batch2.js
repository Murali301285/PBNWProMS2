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

        // Display string split replacement
        content = content.replace(/\.split\('-'\)\.reverse\(\)\.join\('\/'\)/g, ".split('-').reverse().join('-')");
        
        // Excel format strings / formatDate mappings
        content = content.replace(/`\$\{([a-zA-Z0-9_]+)\}\/\$\{([a-zA-Z0-9_]+)\}\/\$\{([a-zA-Z0-9_]+)\}`/g, "`\${$1}-\${$2}-\${$3}`");
        content = content.replace(/`\$\{day\}\/\$\{m\}\/\$\{y\}`/g, "`\${day}-\${m}-\${y}`");
        content = content.replace(/`\$\{day\}\/\$\{month\}\/\$\{year\}`/g, "`\${day}-\${month}-\${year}`");

        // Specific manual Date: formats using /
        content = content.replace(/'Date: '\s*\+\s*date\.split\('-'\)\.reverse\(\)\.join\('\/'\)/g, "'Date: ' + date.split('-').reverse().join('-')");

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', filePath);
        }
    });

    // Also process any child files if any (like Table components)
    files.filter(f => f.includes('Table')).forEach(file => {
        // usually already caught by the filter above since all are flat in the directory
    });
});
