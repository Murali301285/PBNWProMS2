const fs = require('fs');
const path = require('path');

const targetDirs = [
    'daily-progress',
    'daily-production',
    'shift-report',
    'sector-wise-production',
    'chp-pss-production',
    'breakdown-time-analysis',
    'tentative-production',
    'day-wise-production'
];

targetDirs.forEach(dir => {
    const dirPath = path.join('f:/Dev/ProMS/ProMSDev/app/dashboard/reports', dir);
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
    
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        let originalContent = content;

        // Header and parameter display cases where split('-').reverse().join('/') is used
        content = content.replace(/\.split\('-'\)\.reverse\(\)\.join\('\/'\)/g, ".split('-').reverse().join('-')");
        
        // Excel format strings using '/'
        // Example: formattedDate = `${d}/${m}/${y}`;
        content = content.replace(/`\$\{([a-zA-Z0-9_]+)\}\/\$\{([a-zA-Z0-9_]+)\}\/\$\{([a-zA-Z0-9_]+)\}`/g, "`\${$1}-\${$2}-\${$3}`");

        // Example: return `${day}/${m}/${y}`;
        content = content.replace(/`\$\{day\}\/\$\{m\}\/\$\{y\}`/g, "`\${day}-\${m}-\${y}`");

        // Example: return `${day}/${month}/${year}`;
        content = content.replace(/`\$\{day\}\/\$\{month\}\/\$\{year\}`/g, "`\${day}-\${month}-\${year}`");

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', filePath);
        }
    });
});
