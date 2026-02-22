const fs = require('fs');
const file = 'app/dashboard/reports/equipment-performance/page.js';
let code = fs.readFileSync(file, 'utf8');

const widthLogicToReplace = `            ws.views = [
                { state: 'frozen', xSplit: freezeCol, ySplit: 7 } // Freeze up to Equ Name, and freeze headers (row 7)
            ];`;

const newWidthLogic = `            ws.views = [
                { state: 'frozen', xSplit: freezeCol, ySplit: 8 } // Freeze up to Equ Name, and freeze all headers including Sub Headers (row 8)
            ];`;

code = code.replace(widthLogicToReplace, newWidthLogic);

fs.writeFileSync(file, code);
console.log("ySplit updated to 8 for Equipment Performance frozen panes!");
