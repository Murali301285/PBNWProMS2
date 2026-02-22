const fs = require('fs');
const ExcelJS = require('exceljs');

const pageCode = fs.readFileSync('app/dashboard/reports/daily-production/page.js', 'utf8');

const match = pageCode.match(/const handleExportExcel = async \(\) => \{([\s\S]*?)return/);
let body = match ? match[1] : '';
if (!body) {
    body = pageCode.substring(pageCode.indexOf('const handleExportExcel = async () => {') + 'const handleExportExcel = async () => {'.length, pageCode.indexOf('return ('));
}


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
        // MOCK the file-saver
        const saveAs = () => { };

        // Evaluate the body
        eval(body);

        const buffer = await wb.xlsx.writeBuffer();
        console.log('Export Built Successfully! File Size:', buffer.length);
    } catch (err) {
        console.error("EXPORT CRASHED!");
        console.error(err);
    }
}

runExport();
