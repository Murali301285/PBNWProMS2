const fs = require('fs');
const file = 'app/dashboard/reports/equipment-performance/page.js';
let code = fs.readFileSync(file, 'utf8');

// Ensure we are not duplicating
if (code.includes('handleExportExcel')) {
    console.log("Already has custom logic, exiting...");
    process.exit(0);
}

// 1. Add handleExportExcel into the component body just before return
const exportLogic = `
    const handleExportExcel = async (sortedData, visibleCols) => {
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Equipment Performance');

            // Find the maximum column span needed for the header
            const maxColSpan = visibleCols.length > 0 ? visibleCols.length : 15;

            // Simple width assignment
            ws.columns = Array(maxColSpan + 1).fill(0).map((_, i) => ({ 
                width: i === 0 ? 3 : (i === 4 ? 25 : 15) // A is padding, equipment name is wider
            }));

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
            setCell(ws.getCell('B4'), "Equipment Performance Report", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(\`B5:\${endColLetter}5\`);
            
            let formattedDate = date;
            if (formattedDate && formattedDate.includes('-')) {
                const [y, m, d] = formattedDate.split('-');
                formattedDate = \`\${d}/\${m}/\${y}\`;
            }

            setCell(ws.getCell('B5'), \`Date: \${formattedDate}\`, { bold: true, align: 'center', border: false, fontSize: 11 });

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

            ws.getRow(6).height = 10;

            let currentRowIdx = 7;

            // Render Dynamic Column Groups (Top Header Logic identical to UI)
            const rowGroup = ws.getRow(currentRowIdx);
            let colIndex = 2; // Start from B
            
            // Apply grouping headers exactly as defined in local UI columnGroups
            // For export visibility, we trace how many visible cols belong to each group.
            // Simplified: Write raw title across matching visible columns count.
            
            // To ensure matching, let's just lay down the active visible cols sub headers and top headers linearly.
            let currentGroupTitle = '';
            let currentGroupStartCol = colIndex;
            let currentGroupSpan = 0;

            visibleCols.forEach((col, idx) => {
                // Find matching group for this column logically based on UI groups
                let groupForCol = columnGroups.find(g => {
                   // This is complex to perfectly map without the exact offset logic, 
                   // Let's use a simpler string matching based on the column headers
                   if (col.header.includes('FTD')) return g.title === 'FTD';
                   if (col.header.includes('MTD')) return g.title === 'MTD';
                   if (col.accessor.startsWith('Shift A')) return g.title === 'SHIFT A';
                   if (col.accessor.startsWith('Shift B')) return g.title === 'SHIFT B';
                   if (col.accessor.startsWith('Shift C')) return g.title === 'SHIFT C';
                   return g.title === '';
                }) || { title: '' };

                if (groupForCol.title !== currentGroupTitle) {
                    // Close previous group
                    if (currentGroupSpan > 0) {
                        const startL = ws.getColumn(currentGroupStartCol).letter;
                        const endL = ws.getColumn(currentGroupStartCol + currentGroupSpan - 1).letter;
                        if (currentGroupSpan > 1) {
                            ws.mergeCells(\`\${startL}\${currentRowIdx}:\${endL}\${currentRowIdx}\`);
                        }
                        setCell(ws.getCell(\`\${startL}\${currentRowIdx}\`), currentGroupTitle, { bold: true, bg: 'FFE5E7EB' });
                    }
                    currentGroupTitle = groupForCol.title;
                    currentGroupStartCol = colIndex + idx;
                    currentGroupSpan = 1;
                } else {
                    currentGroupSpan++;
                }
            });
            // Close final group
            if (currentGroupSpan > 0) {
                const startL = ws.getColumn(currentGroupStartCol).letter;
                const endL = ws.getColumn(currentGroupStartCol + currentGroupSpan - 1).letter;
                if (currentGroupSpan > 1 && startL !== endL) {
                    try { ws.mergeCells(\`\${startL}\${currentRowIdx}:\${endL}\${currentRowIdx}\`); } catch(e){}
                }
                setCell(ws.getCell(\`\${startL}\${currentRowIdx}\`), currentGroupTitle, { bold: true, bg: 'FFE5E7EB' });
            }
            
            rowGroup.height = 20;
            currentRowIdx++;

            // Sub Headers
            const rowSub = ws.getRow(currentRowIdx);
            visibleCols.forEach((col, i) => {
                setCell(rowSub.getCell(i + 2), col.header, { bold: true, bg: 'FFBFDBFE' });
            });
            rowSub.height = 22;
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

                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null) {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';
                    }

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, { 
                        numFmt: nFmt, 
                        align: (cIdx === 1 || cIdx === 2 || cIdx === 3) ? 'left' : 'center' 
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), \`Equipment_Performance_\${formattedDate.replace(/\\//g, '-')}.xlsx\`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };
`;

code = code.replace(
    "if (initializing) {",
    exportLogic + "\n    if (initializing) {"
);

code = code.replace(
    "columnGroups={columnGroups}",
    "columnGroups={columnGroups}\n                onExportExcel={handleExportExcel}"
);

fs.writeFileSync(file, code);
console.log("Injected custom ExcelJS export into Equipment Performance layout!");
