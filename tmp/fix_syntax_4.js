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

        // Fix the syntax error injected by the previous regex script. '-} -> '-' }
        content = content.replace(/ : '-\}/g, " : '-'}");
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed:', path.join(dir, file));
        }
    });

});
