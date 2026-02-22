const fs = require('fs');
const file = 'app/dashboard/reports/production-tsmpl/page.js';
let code = fs.readFileSync(file, 'utf8');

// Use regex to strictly find the entire block from `const handleExportExcel = async () => {` to the `return (` statement.
const match = code.match(/    const handleExportExcel = async \(\) => \{[\s\S]*?    \};(?=\s*return \()/);

if (!match) {
    console.error("Could not find block via regex.");
    process.exit(1);
}

const newFunc = `    const handleExportExcel = async () => {
        if (!data) return;
        const { summary, crusher, headerInfo } = data;

        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Production TSMPL');

            // EXACT MATCH TO NTPC: 3 core columns
            ws.columns = [
                { width: 3 },  // A (padding)
                { width: 30 }, // B
                { width: 25 }, // C
                { width: 25 }, // D
            ];

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

            ws.mergeCells('B2:D2');
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells('B3:D3');
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells('B4:D4');
            setCell(ws.getCell('B4'), "PRODUCTION TSMPL REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells('B5:D5');
            const shiftName = headerInfo?.ShiftName?.replace('SHIFT', 'Shift') || '-';
            setCell(ws.getCell('B5'), \`Shift: \${shiftName}\`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.mergeCells('B6:D6');
            let formattedDate = filter.date;
            if (formattedDate) {
                const [y, m, d] = formattedDate.split('-');
                formattedDate = \`\${d}/\${m}/\${y}\`;
            } else {
                formattedDate = headerInfo?.Date || '-';
            }
            setCell(ws.getCell('B6'), \`Date: \${formattedDate}\`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.getRow(2).height = 30;
            ws.getRow(3).height = 22;
            ws.getRow(4).height = 20;
            ws.getRow(5).height = 18;
            ws.getRow(6).height = 18;

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 100, height: 90 }
                });
            }

            ws.getRow(7).height = 10;

            let currentRowIdx = 8;

            const addDataRow = (values, opts = {}) => {
                const row = ws.getRow(currentRowIdx);
                values.forEach((val, i) => {
                    if (val === null) return;
                    const cOpts = { ...opts };
                    if (i === 0 && !opts.bold) cOpts.align = 'left';
                    if (val && typeof val === 'number') {
                        cOpts.numFmt = '#,##0';
                        if (val === 0) cOpts.numFmt = '0';
                    }
                    setCell(row.getCell(i + 2), val, cOpts);
                });
                row.height = opts.height || 18;
                currentRowIdx++;
            };

            const fmt = (val) => {
                if (val === null || val === undefined) return '-';
                return Number(val).toLocaleString('en-IN');
            };

            // 1. Production Quantity
            ws.mergeCells(\`B\${currentRowIdx}:D\${currentRowIdx}\`);
            setCell(ws.getCell(\`B\${currentRowIdx}\`), "Production Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Material", "Shift Qty.", "Per Hour"], { bold: true, bg: 'FFBFDBFE' });

            addDataRow(["COAL", \`\${fmt(summary.ProdCoal)} MT\`, \`\${fmt(summary.ProdCoalPerHrs)} MT\`], { align: 'right' });
            ws.getCell(\`B\${currentRowIdx - 1}\`).alignment = { horizontal: 'left', vertical: 'middle' };
            ws.getCell(\`B\${currentRowIdx - 1}\`).font = { bold: true };

            addDataRow(["OB", \`\${fmt(summary.ProdOB)} BCM\`, \`\${fmt(summary.ProdOBPerHrs)} BCM\`], { align: 'right' });
            ws.getCell(\`B\${currentRowIdx - 1}\`).alignment = { horizontal: 'left', vertical: 'middle' };
            ws.getCell(\`B\${currentRowIdx - 1}\`).font = { bold: true };

            currentRowIdx++;

            // 2. WP-3 Quantity
            ws.mergeCells(\`B\${currentRowIdx}:D\${currentRowIdx}\`);
            setCell(ws.getCell(\`B\${currentRowIdx}\`), "WP-3 Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["COAL", null, \`\${fmt(summary.WPCoalQty)} MT\`], { align: 'right' });
            ws.mergeCells(\`B\${currentRowIdx - 1}:C\${currentRowIdx - 1}\`);
            setCell(ws.getCell(\`B\${currentRowIdx - 1}\`), "COAL", { bold: true, align: 'left' });

            addDataRow(["OB", null, \`\${fmt(summary.WPObQty)} BCM\`], { align: 'right' });
            ws.mergeCells(\`B\${currentRowIdx - 1}:C\${currentRowIdx - 1}\`);
            setCell(ws.getCell(\`B\${currentRowIdx - 1}\`), "OB", { bold: true, align: 'left' });

            currentRowIdx++;

            // 3. Carpeting Quantity
            ws.mergeCells(\`B\${currentRowIdx}:D\${currentRowIdx}\`);
            setCell(ws.getCell(\`B\${currentRowIdx}\`), "Carpeting Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Material", null, "Shift Qty."], { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(\`B\${currentRowIdx - 1}:C\${currentRowIdx - 1}\`);
            setCell(ws.getCell(\`B\${currentRowIdx - 1}\`), "Material", { bold: true, align: 'center', bg: 'FFBFDBFE' });
            setCell(ws.getCell(\`D\${currentRowIdx - 1}\`), "Shift Qty.", { bold: true, align: 'right', bg: 'FFBFDBFE' });

            addDataRow(["OB", null, \`\${fmt(summary.CarpettingObQty)} BCM\`], { align: 'right' });
            ws.mergeCells(\`B\${currentRowIdx - 1}:C\${currentRowIdx - 1}\`);
            setCell(ws.getCell(\`B\${currentRowIdx - 1}\`), "OB", { bold: true, align: 'left' });

            currentRowIdx++;
            
            // 4. Coal Rehandling
            ws.mergeCells(\`B\${currentRowIdx}:D\${currentRowIdx}\`);
            setCell(ws.getCell(\`B\${currentRowIdx}\`), "Coal Rehandling", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Material", null, "Shift Qty."], { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(\`B\${currentRowIdx - 1}:C\${currentRowIdx - 1}\`);
            setCell(ws.getCell(\`B\${currentRowIdx - 1}\`), "Material", { bold: true, align: 'center', bg: 'FFBFDBFE' });
            setCell(ws.getCell(\`D\${currentRowIdx - 1}\`), "Shift Qty.", { bold: true, align: 'right', bg: 'FFBFDBFE' });

            addDataRow(["COAL", null, \`\${fmt(summary.RehandlingCoalQty)} MT\`], { align: 'right' });
            ws.mergeCells(\`B\${currentRowIdx - 1}:C\${currentRowIdx - 1}\`);
            setCell(ws.getCell(\`B\${currentRowIdx - 1}\`), "COAL", { bold: true, align: 'left' });

            currentRowIdx++;

            // 5. Crusher Details
            ws.mergeCells(\`B\${currentRowIdx}:D\${currentRowIdx}\`);
            setCell(ws.getCell(\`B\${currentRowIdx}\`), "Crusher Details", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Plant", "W. Hours", "Quantity (MT)"], { bold: true, bg: 'FFBFDBFE' });

            let totalHrs = 0;
            let totalQty = 0;

            crusher.forEach(row => {
                addDataRow([row.Plant, row.RunningHr === null ? '-' : Number(row.RunningHr).toFixed(2), fmt(row.TotalQty)], { align: 'right' });
                ws.getCell(\`B\${currentRowIdx - 1}\`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                totalHrs += (row.RunningHr || 0);
                totalQty += (row.TotalQty || 0);
            });

            addDataRow(["Total", totalHrs.toFixed(2), fmt(totalQty)], { bold: true, bg: 'FFE5E7EB', align: 'right' });
            ws.getCell(\`B\${currentRowIdx - 1}\`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), \`ProductionTSMPL_\${headerInfo?.Date || 'Report'}.xlsx\`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };`;

code = code.replace(match[0], newFunc);

// Write exact matched code back preserving `\r\n` completely across the unmodified bounds
fs.writeFileSync(file, code);
console.log('TSMPL handleExportExcel REGEX string replaced successfully!');
