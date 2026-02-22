const fs = require('fs');

// 1. Update API route
const apiFile = 'app/api/reports/operator-performance-hauling/route.js';
let apiCode = fs.readFileSync(apiFile, 'utf8');

apiCode = apiCode.replace(
    "const { date, operatorIds, haulingMachineIds, relayIds, shiftIds } = body;",
    "const { fromDate, toDate, operatorIds, haulingMachineIds, relayIds, shiftIds } = body;"
);
apiCode = apiCode.replace(
    "{ name: 'FromDate', value: date },",
    "{ name: 'FromDate', value: fromDate },"
);
apiCode = apiCode.replace(
    "{ name: 'ToDate', value: date },",
    "{ name: 'ToDate', value: toDate },"
);
apiCode = apiCode.replace(
    "console.log(\"Operator Hauling Report Request:\", { date, operatorIds });",
    "console.log(\"Operator Hauling Report Request:\", { fromDate, toDate, operatorIds });"
);

fs.writeFileSync(apiFile, apiCode);
console.log("Updated API route to support fromDate and toDate.");

// 2. Update Page UI and inject Export Logic
const pageFile = 'app/dashboard/reports/operator-performance-hauling/page.js';
let pageCode = fs.readFileSync(pageFile, 'utf8');

// Replace date state with fromDate and toDate
pageCode = pageCode.replace(
    "const [date, setDate] = useState(new Date().toISOString().split('T')[0]);",
    "const today = new Date().toISOString().split('T')[0];\n    const [fromDate, setFromDate] = useState(today);\n    const [toDate, setToDate] = useState(today);"
);

// Replace payload
pageCode = pageCode.replace(
    "date,\n                operatorIds: selectedOperators,",
    "fromDate,\n                toDate,\n                operatorIds: selectedOperators,"
);

// Replace handleGenerate date check
pageCode = pageCode.replace(
    "if (!date) {",
    "if (!fromDate || !toDate) {"
);
pageCode = pageCode.replace(
    "toast.error(\"Please select a date\");",
    "toast.error(\"Please select both dates\");"
);

// Replace Date UI Input
const oldDateInput = `<div className={styles.inputGroup}>
                    <label className={styles.label}>
                        Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={styles.input}
                    />
                </div>`;

const newDateInput = `<div className={styles.inputGroup}>
                    <label className={styles.label}>
                        From Date
                    </label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>
                        To Date
                    </label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className={styles.input}
                    />
                </div>`;

pageCode = pageCode.replace(oldDateInput, newDateInput);


// Inject Excel Export
if (!pageCode.includes('handleExportExcel')) {
    const exportLogic = `
    const handleExportExcel = async (sortedData, visibleCols) => {
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Operator Performance');

            const maxColSpan = visibleCols.length > 0 ? visibleCols.length : 15;

            // 1. Calculate max widths for dynamic columns
            const maxColWidths = {};
            visibleCols.forEach(col => {
                // Determine which columns dynamically scale
                if (col.accessor === "OPERATOR'S NAME" || col.accessor === 'EQUIPMENT NO.' || col.accessor === 'MODEL' || col.accessor === 'Shift Incharge(Large Scale)' || col.accessor === 'Shift Incharge - Mid Scale') {
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

            // 3. Freeze panes (freeze up to OPERATOR'S NAME, and freeze headers)
            let freezeCol = 4; // Default to D if not found
            const eqIdx = visibleCols.findIndex(c => c.accessor === "OPERATOR'S NAME");
            if (eqIdx !== -1) freezeCol = eqIdx + 2; 
            
            ws.views = [
                { state: 'frozen', xSplit: freezeCol, ySplit: 6 } // Freeze up to Operator, and freeze row 6 (headers)
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
            setCell(ws.getCell('B4'), "Operator Performance Report - Hauling", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(\`B5:\${endColLetter}5\`);
            let fDate = fromDate, tDate = toDate;
            if (fDate && fDate.includes('-')) fDate = fDate.split('-').reverse().join('/');
            if (tDate && tDate.includes('-')) tDate = tDate.split('-').reverse().join('/');
            
            const dateStr = fDate === tDate ? \`Date: \${fDate}\` : \`Date: \${fDate} To \${tDate}\`;
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

                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null && col.accessor !== 'Date') {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';
                    }

                    // Remove comma parsing for HMR and KMR readings if they are numeric
                    // These are just meter reading codes, probably shouldn't have commas
                    if (val !== null && val !== undefined) {
                        if (['Open HMR', 'Close HMR', 'Net HMR', 'Open KMR', 'Close KMR', 'Net KMR'].includes(col.accessor)) {
                            nFmt = '0.00'; // Actually keep decimals for HMR, but no comma
                            if (val % 1 === 0) nFmt = '0';
                        }
                    }

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, { 
                        numFmt: nFmt, 
                        align: (col.accessor === "OPERATOR'S NAME" || col.accessor === 'EQUIPMENT NO.' || col.accessor === 'MODEL' || col.accessor === 'Shift Incharge(Large Scale)' || col.accessor === 'Shift Incharge - Mid Scale') ? 'left' : 'center' 
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), \`Operator_Performance_Hauling_\${fDate.replace(/\\//g, '-')}.xlsx\`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };
`;

    pageCode = pageCode.replace(
        /return \(\s*<div className=\{styles\.container\}>/,
        exportLogic + "\n    return (\n        <div className={styles.container}>"
    );

    // Add stickyBgColor and onExportExcel to ReportTable at the bottom
    pageCode = pageCode.replace(
        "toDate={date}",
        "toDate={toDate}\n                stickyLeft={4}\n                stickyBgColor=\"#e0f2fe\"\n                onExportExcel={handleExportExcel}"
    );
    // Replace fromDate={date} too
    pageCode = pageCode.replace(
        "fromDate={date}",
        "fromDate={fromDate}"
    );
}

fs.writeFileSync(pageFile, pageCode);
console.log("Updated Page UI to support fromDate and toDate and injected Excel export.");
