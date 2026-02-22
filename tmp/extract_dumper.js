const fs = require('fs');
const lines = fs.readFileSync('tmp/orig_sp.txt', 'utf16le').split('\n');
const start = lines.findIndex(l => l.includes('SECTION H: DUMPER'));
let end = start;
for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].includes('SELECT Remarks FROM')) {
        end = i;
        break;
    }
}
console.log(lines.slice(start, end).join('\n'));
