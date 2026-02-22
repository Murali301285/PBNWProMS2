const fs = require('fs');
const file = 'app/dashboard/reports/material-loading/page.js';
let code = fs.readFileSync(file, 'utf8');

if (code.includes('handleExportExcel')) {
    console.log("Already has custom logic, exiting...");
    process.exit(0);
}

const exportLogic = `
    const handleExportExcel = async (sortedData, visibleCols) => {
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Material Loading');

            const maxColSpan = visibleCols.length > 0 ? visibleCols.length : 25;

            // 1. Calculate max widths for dynamic columns
            const maxColWidths = {};
            visibleCols.forEach(col => {
                if (['CostCenterLoading', 'CostCenterHauler', 'SourceName', 'Destination', 'HaulerEquipment', 'LoadingMachine', 'MaterialName', 'LoadingModel', 'HaulingModel', 'ShiftInchargeLarge', 'ShiftInchargeMid', 'Sector', 'Patch'].includes(col.accessor)) {
                    let maxLen = col.header.length;
                    sortedData.forEach((row, rIdx) => {
                        let val = row[col.accessor];
                        if (col.render) {
                            const res = col.render(row, rIdx);
                            if (res !== null && typeof res !== 'object') val = res;
                        }
                        if (val !== null && val !== undefined) {
                            const len = String(val).length;
                            if (len > maxLen) maxLen = len;
                        }
                    });
                    maxColWidths[col.accessor] = Math.min(Math.max((maxLen * 1.2) + 2, 20), 80);
                }
            });

            // 2. Custom width assignment
            ws.columns = Array(maxColSpan + 1).fill(0).map((_, i) => {
                if (i === 0) return { width: 3 }; // Padding
                
                const colDef = visibleCols[i - 1]; 
                let w = 15;
                if (colDef) {
                     if (colDef.accessor === 'SlNo') w = 8;
                     else if (maxColWidths[colDef.accessor]) {
                         w = maxColWidths[colDef.accessor];
                     }
                }
                return { width: w };
            });

            // 3. Freeze panes (freeze up to Date, and freeze headers)
            let freezeCol = 6; // Default to F if not found
            const dateIdx = visibleCols.findIndex(c => c.accessor === 'Date');
            if (dateIdx !== -1) freezeCol = dateIdx + 2; 
            
            ws.views = [
                { state: 'frozen', xSplit: freezeCol, ySplit: 6 } // Freeze up to Date column, and freeze row 6 (headers)
            ];

            // 4. Logo
            let logoId;
            try {
                const logoRes = await fetch('/Asset/Logo.png');
                const arrayBuffer = await logoRes.arrayBuffer();
                logoId = wb.addImage({
                    buffer: arrayBuffer,
                    extension: 'png',
                });
            } catch (e) {
                console.error('Logo add failed', e);
            }

            const setCell = (cell, value, opts = {}) => {
                if (value !== undefined) cell.value = value;
                cell.font = {
                    name: 'Calibri',
                    size: opts.fontSize || 10,
                    bold: opts.bold || false,
                    underline: opts.underline || false,
                    color: { argb: opts.color || 'FF000000' }
                };
                cell.alignment = {
                    horizontal: opts.align || 'center',
                    vertical: 'middle',
                    wrapText: true
                };
                if (opts.bg) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg } };
                }
                if (opts.border !== false) {
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                }
                if (opts.numFmt) {
                    cell.numFmt = opts.numFmt;
                }
            };

            ws.getRow(1).height = 15;

            const endColLetter = ws.getColumn(maxColSpan + 1).letter;

            ws.mergeCells(\`B2:\${endColLetter}2\`);
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(\`B3:\${endColLetter}3\`);
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(\`B4:\${endColLetter}4\`);
            setCell(ws.getCell('B4'), "Material Loading Report", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(\`B5:\${endColLetter}5\`);
            let fDate = filter.fromDate, tDate = filter.toDate;
            if (fDate && fDate.includes('-')) fDate = fDate.split('-').reverse().join('/');
            if (tDate && tDate.includes('-')) tDate = tDate.split('-').reverse().join('/');
            
            const dateStr = \`From Date: \${fDate || '-'}        To Date: \${tDate || '-'}\`;
            setCell(ws.getCell('B5'), dateStr, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.getRow(2).height = 30;
            ws.getRow(3).height = 22;
            ws.getRow(4).height = 20;
            ws.getRow(5).height = 18;

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 100, height: 90 }
                });
            }

            let currentRowIdx = 6;

            // Headers
            const rowHeader = ws.getRow(currentRowIdx);
            visibleCols.forEach((col, i) => {
                setCell(rowHeader.getCell(i + 2), col.header, { bold: true, bg: 'FFBFDBFE' });
            });
            rowHeader.height = 25;
            currentRowIdx++;

            // Data Rows
            sortedData.forEach((row, rIdx) => {
                const dataRow = ws.getRow(currentRowIdx);
                visibleCols.forEach((col, cIdx) => {
                    let val = row[col.accessor];

                    if (col.accessor === 'SlNo') val = rIdx + 1;
                    if (col.render) {
                        const res = col.render(row, rIdx);
                        if (res !== null && typeof res !== 'object') val = res;
                    }

                    // Format Date if applicable (assuming Date column strings look like SQL timestamp or ISO)
                    if (col.accessor === 'Date' && val) {
                         const d = new Date(val);
                         if (!isNaN(d.getTime())) {
                             val = d.toLocaleDateString('en-GB');
                         }
                    }

                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null && col.accessor !== 'Date' && col.accessor !== 'Year' && col.accessor !== 'Month') {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';
                    }

                    // Remove comma parsing for Cost Centers / Year / Month
                    if (val !== null && val !== undefined) {
                        if (['CostCenterLoading', 'CostCenterHauler', 'Year', 'Month'].includes(col.accessor)) {
                            nFmt = '0';
                        }
                    }

                    const isLeftAlign = ['CostCenterLoading', 'CostCenterHauler', 'SourceName', 'Destination', 'HaulerEquipment', 'LoadingMachine', 'MaterialName', 'LoadingModel', 'HaulingModel', 'ShiftInchargeLarge', 'ShiftInchargeMid'].includes(col.accessor);

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, { 
                        numFmt: nFmt, 
                        align: isLeftAlign ? 'left' : 'center' 
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), \`Material_Loading_\${(fDate || '').replace(/\\//g, '-')}.xlsx\`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };
`;

code = code.replace(
    /return \(\s*<div className=\"p-6 h-screen flex flex-col bg-slate-50\">/,
    exportLogic + "\n    return (\n        <div className=\"p-6 h-screen flex flex-col bg-slate-50\">"
);

code = code.replace(
    /generated=\{generated\}\s*\/>/,
    'generated={generated}\n                onExportExcel={handleExportExcel}\n            />'
);

fs.writeFileSync(file, code);
console.log("Injected Material Loading export logic!");
