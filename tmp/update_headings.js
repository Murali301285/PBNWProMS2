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

            // Replace in JSX: >THRIVENI SAINIK MINING PRIVATE LIMITED<
            if (content.includes('>THRIVENI SAINIK MINING PRIVATE LIMITED<')) {
                content = content.replace(/>THRIVENI SAINIK MINING PRIVATE LIMITED</g, '>{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"}<');
                modified = true;
            }

            // Replace in JSX: >PAKRI BARWADIH COAL MINING PROJECT<
            if (content.includes('>PAKRI BARWADIH COAL MINING PROJECT<')) {
                content = content.replace(/>PAKRI BARWADIH COAL MINING PROJECT</g, '>{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"}<');
                modified = true;
            }

            // Replace strings (e.g. for setCell): "THRIVENI SAINIK MINING PRIVATE LIMITED"
            if (content.includes('"THRIVENI SAINIK MINING PRIVATE LIMITED"')) {
                content = content.replace(/"THRIVENI SAINIK MINING PRIVATE LIMITED"/g, '(process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED")');
                modified = true;
            }

            // Replace strings: "PAKRI BARWADIH COAL MINING PROJECT"
            if (content.includes('"PAKRI BARWADIH COAL MINING PROJECT"')) {
                content = content.replace(/"PAKRI BARWADIH COAL MINING PROJECT"/g, '(process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT")');
                modified = true;
            }
            
            // Single Quotes Replace (just in case)
            if (content.includes("'THRIVENI SAINIK MINING PRIVATE LIMITED'")) {
                content = content.replace(/'THRIVENI SAINIK MINING PRIVATE LIMITED'/g, '(process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED")');
                modified = true;
            }

            if (content.includes("'PAKRI BARWADIH COAL MINING PROJECT'")) {
                content = content.replace(/'PAKRI BARWADIH COAL MINING PROJECT'/g, '(process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT")');
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
console.log(modifiedFiles.join('\\n'));
