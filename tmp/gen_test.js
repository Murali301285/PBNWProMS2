const fs = require('fs');
let code = fs.readFileSync('app/dashboard/reports/daily-production/page.js', 'utf8');

let lines = code.split('\n');
let exportBody = '';
let inExport = false;

for (const line of lines) {
    if (line.includes('const handleExportExcel = async () => {')) {
        inExport = true;
        continue;
    }
    if (inExport) {
        if (line.trim() === 'return (') {
            break;
        }
        exportBody += line + '\n';
    }
}

const testCode = `
const ExcelJS = require('exceljs');
const reportData = [
  [], [], [], [], [], [], [], [], [], [], [], [], [], [] 
];
const toast = { error: console.error, success: console.log };
const date = '2023-10-10';
const logoId = undefined;

async function runExport() {
  try {
     const wb = new ExcelJS.Workbook();
     const ws = wb.addWorksheet('Daily Production');
     const saveAs = () => {};
     const fmt = (x) => x;
     const setCell = (cell, value, opts = {}) => { cell.value = value; };
     
     // Evaluate exactly what handleExportExcel does inside the try catch
     ${exportBody.substring(exportBody.indexOf('try {'), exportBody.lastIndexOf('} catch (e) {'))}
     
     console.log('Export Built Successfully without SaveAs!');
  } catch (err) {
      console.error('EXPORT CRASHED!');
      console.error(err);
  }
}
runExport();
`;

fs.writeFileSync('tmp/test_excel4.js', testCode);
