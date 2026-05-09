const fs = require('fs');
const path = require('path');

const targetDir = 'f:\\\\Dev\\\\ProMS\\\\ProMSDev\\\\app\\\\dashboard\\\\reports';
let modifiedFiles = [];

const walkSync = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkSync(filePath);
        } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;

            // Fix the double variable injected in JSX fallback string
            const bad1 = '{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || (process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED")}';
            const good1 = '{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"}';
            
            if (content.includes(bad1)) {
                content = content.split(bad1).join(good1);
                modified = true;
            }

            const bad2 = '{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || (process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT")}';
            const good2 = '{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"}';

            if (content.includes(bad2)) {
                content = content.split(bad2).join(good2);
                modified = true;
            }

            // Also fix the single quotes case that might have been hit
            const bad3 = "{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || (process.env.NEXT_PUBLIC_REPORT_HEADING_1 || 'THRIVENI SAINIK MINING PRIVATE LIMITED')}";
            if (content.includes(bad3)) {
                content = content.split(bad3).join(good1);
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                modifiedFiles.push(filePath);
            }
        }
    }
};

walkSync(targetDir);
console.log('Fixed files:', modifiedFiles.length);
