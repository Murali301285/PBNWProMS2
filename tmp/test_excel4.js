
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
     try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Daily Production');

            // Max columns used is 18 (B to S, since A is padding)
            ws.columns = [
                { width: 3 },   // A (padding)
                { width: 6 },   // B SI No
                { width: 18 },  // C Scale
                { width: 8 },   // D Trip
                { width: 10 },  // E Qty
                { width: 8 },   // F Trip
                { width: 10 },  // G Qty
                { width: 8 },   // H Trip
                { width: 10 },  // I Qty
                { width: 8 },   // J Trip
                { width: 10 },  // K Qty
                { width: 8 },   // L Trip
                { width: 10 },  // M Qty
                { width: 8 },   // N Trip
                { width: 10 },  // O Qty
                { width: 8 },   // P Trip
                { width: 10 },  // Q Qty
                { width: 8 },   // R Trip
                { width: 10 }   // S Qty
            ];

            let logoId;
            try {
                const logoRes = await fetch('/Asset/Logo.png');
                const arrayBuffer = await logoRes.arrayBuffer();
                logoId = wb.addImage({ buffer: arrayBuffer, extension: 'png' });
            } catch (e) { console.error('Logo add failed', e); }

            const setCell = (cell, value, opts = {}) => {
                if (value !== undefined) cell.value = value;
                cell.font = {
                    name: 'Calibri',
                    size: opts.fontSize || 10,
                    bold: opts.bold || false,
                    underline: opts.underline || false,
                    color: { argb: opts.color || 'FF000000' },
                    italic: opts.italic || false
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
            };

            const fmt = (val, decimals = 2) => {
                if (val === null || val === undefined || val === '' || val === 0 || val === '0') return '-';
                if (val % 1 === 0 && val < 1000) return val;
                return Number(val).toLocaleString('en-IN', { maximumFractionDigits: decimals });
            };

            ws.getRow(1).height = 15;

            ws.mergeCells('B2:S2');
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells('B3:S3');
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells('B4:S4');
            setCell(ws.getCell('B4'), "DAILY PRODUCTION REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FF1D4ED8' });

            ws.mergeCells('B5:S5');
            let formattedDate = date;
            if (date) {
                const [y, m, d] = date.split('-');
                formattedDate = `${d}/${m}/${y}`;
            }
            setCell(ws.getCell('B5'), `Date: ${formattedDate}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.getRow(2).height = 30;
            ws.getRow(3).height = 22;
            ws.getRow(4).height = 20;
            ws.getRow(5).height = 18;

            if (logoId !== undefined) {
                ws.addImage(logoId, { tl: { col: 1, row: 1 }, ext: { width: 100, height: 90 } });
            }

            ws.getRow(6).height = 10;
            let currentRowIdx = 7;

            const addDataRow = (values, opts = {}, colSpans = null) => {
                const row = ws.getRow(currentRowIdx);
                let currentStartCol = 2; // B
                values.forEach((val, i) => {
                    if (val === null && !colSpans) return;
                    const span = colSpans ? colSpans[i] : 1;
                    if (!span) return;

                    const cOpts = { ...opts };
                    if (i === 1 && !opts.bold && !opts.forceCenterFirst) cOpts.align = 'left';

                    if (span > 1) {
                        const startCol = ws.getColumn(currentStartCol).letter;
                        const endCol = ws.getColumn(currentStartCol + span - 1).letter;
                        ws.mergeCells(`${startCol}${currentRowIdx}:${endCol}${currentRowIdx}`);
                    }

                    const cell = row.getCell(currentStartCol);
                    setCell(cell, val, cOpts);

                    for (let s = 0; s < span; s++) {
                        const styleCell = row.getCell(currentStartCol + s);
                        if (cOpts.border !== false) {
                            styleCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        }
                        if (cOpts.bg) {
                            styleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cOpts.bg } };
                        }
                        if (cOpts.color) {
                            styleCell.font = { ...styleCell.font, color: { argb: cOpts.color } };
                        }
                    }
                    currentStartCol += span;
                });
                row.height = opts.height || 18;
                currentRowIdx++;
            };

            const addHeaderRow = (titles, bg = 'FFBFDBFE', colSpans = null, opts = {}) => addDataRow(titles, { bold: true, bg, ...opts }, colSpans);

            const data = reportData;
            const shiftProdCoal = data[0] || [];
            const shiftProdWaste = data[1] || [];
            const coalDetails = data[2] || [];
            const wasteDetails = data[3] || [];
            const crushedCoal = data[4] || [];
            const coalCrushing = data[5] || [];
            const blasting = data[7] || [];

            // Coal Shift Pivot
            const coalShiftPivotMap = {};
            shiftProdCoal.forEach(r => {
                const key = r.Scale;
                if (!coalShiftPivotMap[key]) coalShiftPivotMap[key] = { Scale: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };
                const shift = r.ShiftName?.toUpperCase().replace('-', '').trim();
                let target = null;
                if (shift === 'SHIFTA') target = coalShiftPivotMap[key].ShiftA;
                else if (shift === 'SHIFTB') target = coalShiftPivotMap[key].ShiftB;
                else if (shift === 'SHIFTC') target = coalShiftPivotMap[key].ShiftC;
                if (target) {
                    target.Trip = (target.Trip || 0) + r.Trip;
                    target.Qty = (target.Qty || 0) + r.mngQty;
                }
            });
            Object.values(coalShiftPivotMap).forEach(row => {
                row.Total.Trip = (row.ShiftA.Trip || 0) + (row.ShiftB.Trip || 0) + (row.ShiftC.Trip || 0);
                row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);
            });
            const coalShiftPivot = Object.values(coalShiftPivotMap);

            // Waste Shift Pivot
            const wasteShiftPivotMap = {};
            shiftProdWaste.forEach(r => {
                const key = r.Scale;
                if (!wasteShiftPivotMap[key]) wasteShiftPivotMap[key] = { Scale: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };
                const shift = r.ShiftName?.toUpperCase().replace('-', '').trim();
                let target = null;
                if (shift === 'SHIFTA') target = wasteShiftPivotMap[key].ShiftA;
                else if (shift === 'SHIFTB') target = wasteShiftPivotMap[key].ShiftB;
                else if (shift === 'SHIFTC') target = wasteShiftPivotMap[key].ShiftC;
                if (target) {
                    target.Trip = (target.Trip || 0) + r.Trip;
                    target.Qty = (target.Qty || 0) + r.mngQty;
                }
            });
            Object.values(wasteShiftPivotMap).forEach(row => {
                row.Total.Trip = (row.ShiftA.Trip || 0) + (row.ShiftB.Trip || 0) + (row.ShiftC.Trip || 0);
                row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);
            });
            const wasteShiftPivot = Object.values(wasteShiftPivotMap);

            // SECTION 1
            ws.mergeCells(`B${currentRowIdx}:S${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "1. SHIFT PRODUCTION DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["SI No.", "Scale / Model", "SHIFT-A", null, null, null, "SHIFT-B", null, null, null, "SHIFT-C", null, null, null, "TOTAL", null, null, null], 'FFBFDBFE', [1, 1, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0]);
            addHeaderRow([null, null, "COAL", null, "OB", null, "COAL", null, "OB", null, "COAL", null, "OB", null, "COAL", null, "OB", null], 'FFBFDBFE', [1, 1, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0]);
            addHeaderRow([null, null, "TRIPS", "QTY.", "TRIP", "QTY.", "TRIP", "QTY.", "TRIP", "QTY.", "TRIP", "QTY.", "TRIP", "QTY.", "TRIPS", "QTY.", "TRIP", "QTY."], 'FFBFDBFE');

            ws.mergeCells(`B${currentRowIdx - 3}:B${currentRowIdx - 1}`);
            ws.mergeCells(`C${currentRowIdx - 3}:C${currentRowIdx - 1}`);

            const allScales = Array.from(new Set([...coalShiftPivot.map(r => r.Scale), ...wasteShiftPivot.map(r => r.Scale)]));
            allScales.forEach((scale, i) => {
                const c = coalShiftPivot.find(r => r.Scale === scale) || { ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };
                const w = wasteShiftPivot.find(r => r.Scale === scale) || { ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };
                addDataRow([
                    i + 1, scale,
                    fmt(c.ShiftA.Trip), fmt(c.ShiftA.Qty), fmt(w.ShiftA.Trip), fmt(w.ShiftA.Qty),
                    fmt(c.ShiftB.Trip), fmt(c.ShiftB.Qty), fmt(w.ShiftB.Trip), fmt(w.ShiftB.Qty),
                    fmt(c.ShiftC.Trip), fmt(c.ShiftC.Qty), fmt(w.ShiftC.Trip), fmt(w.ShiftC.Qty),
                    fmt(c.Total.Trip), fmt(c.Total.Qty), fmt(w.Total.Trip), fmt(w.Total.Qty)
                ]);
            });

            const t_c_a_trip = coalShiftPivot.reduce((s, r) => s + (r.ShiftA.Trip || 0), 0);
            const t_c_a_qty = coalShiftPivot.reduce((s, r) => s + (r.ShiftA.Qty || 0), 0);
            const t_w_a_trip = wasteShiftPivot.reduce((s, r) => s + (r.ShiftA.Trip || 0), 0);
            const t_w_a_qty = wasteShiftPivot.reduce((s, r) => s + (r.ShiftA.Qty || 0), 0);
            const t_c_b_trip = coalShiftPivot.reduce((s, r) => s + (r.ShiftB.Trip || 0), 0);
            const t_c_b_qty = coalShiftPivot.reduce((s, r) => s + (r.ShiftB.Qty || 0), 0);
            const t_w_b_trip = wasteShiftPivot.reduce((s, r) => s + (r.ShiftB.Trip || 0), 0);
            const t_w_b_qty = wasteShiftPivot.reduce((s, r) => s + (r.ShiftB.Qty || 0), 0);
            const t_c_c_trip = coalShiftPivot.reduce((s, r) => s + (r.ShiftC.Trip || 0), 0);
            const t_c_c_qty = coalShiftPivot.reduce((s, r) => s + (r.ShiftC.Qty || 0), 0);
            const t_w_c_trip = wasteShiftPivot.reduce((s, r) => s + (r.ShiftC.Trip || 0), 0);
            const t_w_c_qty = wasteShiftPivot.reduce((s, r) => s + (r.ShiftC.Qty || 0), 0);
            const t_c_T_trip = coalShiftPivot.reduce((s, r) => s + (r.Total.Trip || 0), 0);
            const t_c_T_qty = coalShiftPivot.reduce((s, r) => s + (r.Total.Qty || 0), 0);
            const t_w_T_trip = wasteShiftPivot.reduce((s, r) => s + (r.Total.Trip || 0), 0);
            const t_w_T_qty = wasteShiftPivot.reduce((s, r) => s + (r.Total.Qty || 0), 0);

            addDataRow([
                "Total", null,
                fmt(t_c_a_trip), fmt(t_c_a_qty), fmt(t_w_a_trip), fmt(t_w_a_qty),
                fmt(t_c_b_trip), fmt(t_c_b_qty), fmt(t_w_b_trip), fmt(t_w_b_qty),
                fmt(t_c_c_trip), fmt(t_c_c_qty), fmt(t_w_c_trip), fmt(t_w_c_qty),
                fmt(t_c_T_trip), fmt(t_c_T_qty), fmt(t_w_T_trip), fmt(t_w_T_qty)
            ], { bold: true, align: 'right', bg: 'FFFDE047' }, [2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);

            currentRowIdx++;

            // SECTION 2
            ws.mergeCells(`B${currentRowIdx}:S${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "2. TRIP-QUANTITY DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            // COAL 
            addHeaderRow(["COAL", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], 'FFEFF6FF', [18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { align: 'left' });
            addHeaderRow(["Scale / Model", null, null, null, null, "FTD", null, null, null, "MTD", null, null, null, "YTD", null, null, null, null], 'FFBFDBFE', [1, 1, 1, 1, 1, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 0], { color: 'FFDC2626' });
            addHeaderRow([null, null, null, null, null, "TRIP", null, "QTY.", null, "TRIPS", null, "QTY.", null, "TRIPS", null, "QTY.", null, null], 'FFBFDBFE', [1, 1, 1, 1, 1, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0]);

            ws.mergeCells(`B${currentRowIdx - 2}:F${currentRowIdx - 1}`);
            coalDetails.forEach(r => {
                addDataRow([r.Scale, null, null, null, null, fmt(r.Trip_FTD), null, fmt(r.Qty_FTD), null, fmt(r.Trip_MTD), null, fmt(r.Qty_MTD), null, fmt(r.Trip_YTD), null, fmt(r.Qty_YTD), null, null], {}, [5, 0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0]);
            });

            addDataRow(["Total", null, null, null, null,
                fmt(coalDetails.reduce((s, r) => s + r.Trip_FTD, 0)), null, fmt(coalDetails.reduce((s, r) => s + r.Qty_FTD, 0)), null,
                fmt(coalDetails.reduce((s, r) => s + r.Trip_MTD, 0)), null, fmt(coalDetails.reduce((s, r) => s + r.Qty_MTD, 0)), null,
                fmt(coalDetails.reduce((s, r) => s + r.Trip_YTD, 0)), null, fmt(coalDetails.reduce((s, r) => s + r.Qty_YTD, 0)), null, null
            ], { bold: true, align: 'right', bg: 'FFFDE047' }, [5, 0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0]);

            currentRowIdx++;

            // OB
            addHeaderRow(["OB", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], 'FFEFF6FF', [18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { align: 'left' });
            addHeaderRow(["Scale / Model", null, null, null, null, "FTD", null, null, null, "MTD", null, null, null, "YTD", null, null, null, null], 'FFBFDBFE', [1, 1, 1, 1, 1, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 0], { color: 'FFDC2626' });
            addHeaderRow([null, null, null, null, null, "TRIP", null, "QTY (BCM)", null, "TRIPS", null, "QTY (BCM)", null, "TRIPS", null, "QTY (BCM)", null, null], 'FFBFDBFE', [1, 1, 1, 1, 1, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0]);

            ws.mergeCells(`B${currentRowIdx - 2}:F${currentRowIdx - 1}`);
            wasteDetails.forEach(r => {
                addDataRow([r.Scale, null, null, null, null, fmt(r.Trip_FTD), null, fmt(r.Qty_FTD), null, fmt(r.Trip_MTD), null, fmt(r.Qty_MTD), null, fmt(r.Trip_YTD), null, fmt(r.Qty_YTD), null, null], {}, [5, 0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0]);
            });

            addDataRow(["Total", null, null, null, null,
                fmt(wasteDetails.reduce((s, r) => s + r.Trip_FTD, 0)), null, fmt(wasteDetails.reduce((s, r) => s + r.Qty_FTD, 0)), null,
                fmt(wasteDetails.reduce((s, r) => s + r.Trip_MTD, 0)), null, fmt(wasteDetails.reduce((s, r) => s + r.Qty_MTD, 0)), null,
                fmt(wasteDetails.reduce((s, r) => s + r.Trip_YTD, 0)), null, fmt(wasteDetails.reduce((s, r) => s + r.Qty_YTD, 0)), null, null
            ], { bold: true, align: 'right', bg: 'FFFDE047' }, [5, 0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0]);

            const coalTotal_FTD = coalDetails.reduce((s, r) => s + (r.Qty_FTD || 0), 0);
            const wasteTotal_FTD = wasteDetails.reduce((s, r) => s + (r.Qty_FTD || 0), 0);
            const sr_FTD = coalTotal_FTD > 0 ? (wasteTotal_FTD / coalTotal_FTD).toFixed(2) : "0.00";

            const coalTotal_MTD = coalDetails.reduce((s, r) => s + (r.Qty_MTD || 0), 0);
            const wasteTotal_MTD = wasteDetails.reduce((s, r) => s + (r.Qty_MTD || 0), 0);
            const sr_MTD = coalTotal_MTD > 0 ? (wasteTotal_MTD / coalTotal_MTD).toFixed(2) : "0.00";

            const coalTotal_YTD = coalDetails.reduce((s, r) => s + (r.Qty_YTD || 0), 0);
            const wasteTotal_YTD = wasteDetails.reduce((s, r) => s + (r.Qty_YTD || 0), 0);
            const sr_YTD = coalTotal_YTD > 0 ? (wasteTotal_YTD / coalTotal_YTD).toFixed(2) : "0.00";

            addDataRow(["STRIPING RATIO", null, null, null, null, "1 : " + sr_FTD, null, null, null, "1 : " + sr_MTD, null, null, null, "1 : " + sr_YTD, null, null, null, null], { bold: true, align: 'center' }, [5, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 0]);

            currentRowIdx += 2;

            // SECTION 3. COAL CRUSHING DETAILS
            ws.mergeCells('B' + currentRowIdx + ':S' + currentRowIdx);
            setCell(ws.getCell('B' + currentRowIdx), "3. COAL CRUSHING DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            const coalCrushingPivotMap = {};
            coalCrushing.forEach(r => {
                const key = r.PlantName;
                if (!coalCrushingPivotMap[key]) coalCrushingPivotMap[key] = { PlantName: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };
                const shift = r.ShiftName?.toUpperCase().replace('-', '').trim();
                let target = null;
                if (shift === 'SHIFTA') target = coalCrushingPivotMap[key].ShiftA;
                else if (shift === 'SHIFTB') target = coalCrushingPivotMap[key].ShiftB;
                else if (shift === 'SHIFTC') target = coalCrushingPivotMap[key].ShiftC;
                if (target) {
                    target.Hr = (target.Hr || 0) + Number(r.Hr || 0);
                    target.Qty = (target.Qty || 0) + Number(r.EstQty || 0);
                }
            });
            Object.values(coalCrushingPivotMap).forEach(row => {
                row.Total.Hr = (row.ShiftA.Hr || 0) + (row.ShiftB.Hr || 0) + (row.ShiftC.Hr || 0);
                row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);
            });
            const coalCrushingPivot = {
                rows: Object.values(coalCrushingPivotMap),
                grandTotal: {
                    ShiftA: { Hr: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftA.Hr || 0), 0), Qty: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftA.Qty || 0), 0) },
                    ShiftB: { Hr: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftB.Hr || 0), 0), Qty: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftB.Qty || 0), 0) },
                    ShiftC: { Hr: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftC.Hr || 0), 0), Qty: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftC.Qty || 0), 0) },
                    Total: { Hr: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.Total.Hr || 0), 0), Qty: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.Total.Qty || 0), 0) }
                }
            };

            addHeaderRow(["Plant / Crusher", null, null, null, "SHIFT-A", null, null, null, "SHIFT-B", null, null, null, "SHIFT-C", null, null, null, "TOTAL", null], 'FFBFDBFE', [1, 1, 1, 1, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 2, 0], { color: 'FFDC2626' });
            addHeaderRow([null, null, null, null, "Hr.", null, "Est.Qty", null, "Hr.", null, "Est.Qty", null, "Hr.", null, "Est.Qty", null, "Hr.", "Est.Qty"], 'FFBFDBFE', [1, 1, 1, 1, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1, 1]);

            ws.mergeCells('B' + (currentRowIdx - 2) + ':E' + (currentRowIdx - 1));
            coalCrushingPivot.rows.forEach(r => {
                addDataRow([r.PlantName, null, null, null, fmt(r.ShiftA.Hr), null, fmt(r.ShiftA.Qty), null, fmt(r.ShiftB.Hr), null, fmt(r.ShiftB.Qty), null, fmt(r.ShiftC.Hr), null, fmt(r.ShiftC.Qty), null, fmt(r.Total.Hr), fmt(r.Total.Qty)], {}, [4, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1, 1]);
            });

            addDataRow(["Total", null, null, null,
                fmt(coalCrushingPivot.grandTotal.ShiftA.Hr), null, fmt(coalCrushingPivot.grandTotal.ShiftA.Qty), null,
                fmt(coalCrushingPivot.grandTotal.ShiftB.Hr), null, fmt(coalCrushingPivot.grandTotal.ShiftB.Qty), null,
                fmt(coalCrushingPivot.grandTotal.ShiftC.Hr), null, fmt(coalCrushingPivot.grandTotal.ShiftC.Qty), null,
                fmt(coalCrushingPivot.grandTotal.Total.Hr), fmt(coalCrushingPivot.grandTotal.Total.Qty)
            ], { bold: true, align: 'right', bg: 'FFCBD5E1' }, [4, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1, 1]);

            currentRowIdx += 2;

            // SECTION 4 & 5
            ws.mergeCells('B' + currentRowIdx + ':J' + currentRowIdx);
            setCell(ws.getCell('B' + currentRowIdx), "4. BLASTING DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });

            ws.mergeCells('K' + currentRowIdx + ':S' + currentRowIdx);
            setCell(ws.getCell('K' + currentRowIdx), "5. CRUSHER COAL QTY.", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(
                ["Parameters", null, null, null, "Value", null, null, null, null, "QTY.", null, "FTD", null, "MTD", null, "YTD", null, null],
                'FFBFDBFE',
                [4, 0, 0, 0, 5, 0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0],
                { color: 'FFDC2626' }
            );

            const blastingRowsArr = [];
            blasting.forEach(r => {
                blastingRowsArr.push({ k: 'No. of Holes', v: r.Noofholesblasted });
                blastingRowsArr.push({ k: 'Explosive (kg)', v: fmt(r.ExplosiveCosumed) });
                blastingRowsArr.push({ k: 'Drilling (Mtr)', v: fmt(r.TotalMetersDrilled) });
            });

            const maxRows1 = Math.max(blastingRowsArr.length, crushedCoal.length === 0 ? 1 : crushedCoal.length);
            for (let i = 0; i < maxRows1; i++) {
                let col1a = "", col1b = "";
                if (i < blastingRowsArr.length) {
                    col1a = blastingRowsArr[i].k;
                    col1b = blastingRowsArr[i].v;
                }

                let col2a = "", col2b = "", col2c = "", col2d = "";
                if (crushedCoal.length === 0 && i === 0) {
                    col2a = "No Data";
                } else if (i < crushedCoal.length) {
                    col2a = "QTY.";
                    col2b = fmt(crushedCoal[i].Qty_FTD);
                    col2c = fmt(crushedCoal[i].Qty_MTD);
                    col2d = fmt(crushedCoal[i].Qty_YTD);
                }

                if (crushedCoal.length === 0 && i === 0) {
                    addDataRow([col1a, null, null, null, col1b, null, null, null, null, col2a, null, null, null, null, null, null, null, null], {}, [4, 0, 0, 0, 5, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0]);
                } else {
                    addDataRow([col1a, null, null, null, col1b, null, null, null, null, col2a, null, col2b, null, col2c, null, col2d, null, null], {}, [4, 0, 0, 0, 5, 0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0]);
                }
            }
            currentRowIdx += 2;

            // SECTION 6 , 7, 8 horizontally
            const smaslQuantity = data[10] || [];
            const inpitDumping = data[11] || [];
            const wp3Excavation = data[12] || [];

            const smaslAggregated = {
                WasteQty: smaslQuantity.reduce((s, r) => s + Number(r.WasteQty || 0), 0),
                CoalQty: smaslQuantity.reduce((s, r) => s + Number(r.CoalQty || 0), 0)
            };
            const inpitAggregated = (() => {
                const agg = { Coal: { FTD: 0, MTD: 0, YTD: 0 }, OB: { FTD: 0, MTD: 0, YTD: 0 } };
                if (!inpitDumping || inpitDumping.length === 0) return [];
                inpitDumping.forEach(r => {
                    if (r.Material === 'COAL') {
                        agg.Coal.FTD += Number(r.FTD || 0); agg.Coal.MTD += Number(r.MTD || 0); agg.Coal.YTD += Number(r.YTD || 0);
                    } else if (r.Material === 'OB' || r.Material === 'OVER BURDEN') {
                        agg.OB.FTD += Number(r.FTD || 0); agg.OB.MTD += Number(r.MTD || 0); agg.OB.YTD += Number(r.YTD || 0);
                    }
                });
                const totalRow = { Type: 'Total', FTD: 0, MTD: 0, YTD: 0 };
                const rowValues = [];
                if (agg.OB.FTD > 0 || agg.OB.MTD > 0 || agg.OB.YTD > 0) rowValues.push({ Type: 'OVER BURDEN', FTD: agg.OB.FTD, MTD: agg.OB.MTD, YTD: agg.OB.YTD });
                if (agg.Coal.FTD > 0 || agg.Coal.MTD > 0 || agg.Coal.YTD > 0) rowValues.push({ Type: 'COAL', FTD: agg.Coal.FTD, MTD: agg.Coal.MTD, YTD: agg.Coal.YTD });
                rowValues.forEach(r => { totalRow.FTD += r.FTD; totalRow.MTD += r.MTD; totalRow.YTD += r.YTD; });
                if (rowValues.length > 0) rowValues.push(totalRow);
                return rowValues;
            })();
            const wp3Aggregated = (() => {
                const agg = { OB: { FTD: 0, MTD: 0, YTD: 0 }, Coal: { FTD: 0, MTD: 0, YTD: 0 } };
                if (!wp3Excavation || wp3Excavation.length === 0) return agg;
                wp3Excavation.forEach(r => {
                    if (r.Type === 'COAL') {
                        agg.Coal.FTD += Number(r.Qty_FTD || 0); agg.Coal.MTD += Number(r.Qty_MTD || 0); agg.Coal.YTD += Number(r.Qty_YTD || 0);
                    } else if (r.Type === 'OB' || r.Type === 'OVER BURDEN') {
                        agg.OB.FTD += Number(r.Qty_FTD || 0); agg.OB.MTD += Number(r.Qty_MTD || 0); agg.OB.YTD += Number(r.Qty_YTD || 0);
                    }
                });
                return agg;
            })();

            ws.mergeCells('B' + currentRowIdx + ':F' + currentRowIdx);
            setCell(ws.getCell('B' + currentRowIdx), "6. SMASL Quantity (FTD)", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });

            ws.mergeCells('G' + currentRowIdx + ':L' + currentRowIdx);
            setCell(ws.getCell('G' + currentRowIdx), "7. INPIT DUMPING", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });

            ws.mergeCells('M' + currentRowIdx + ':S' + currentRowIdx);
            setCell(ws.getCell('M' + currentRowIdx), "8. WP-3 EXCAVATION DETAIL", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(
                ["", null, "Quantity", null, null,
                    "", null, "FTD", null, "MTD", null,
                    "", null, "FTD", "MTD", "YTD", null, null],
                'FFBFDBFE',
                [2, 0, 3, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1, 1, 3, 0, 0],
                { color: 'FFDC2626' }
            );

            const s6_final = [{ k: 'OB (BCM)', v: fmt(smaslAggregated.WasteQty) }, { k: 'Coal(MT)', v: fmt(smaslAggregated.CoalQty) }];
            const maxRows2_final = Math.max(s6_final.length, inpitAggregated.length === 0 ? 1 : inpitAggregated.length, 2);

            for (let i = 0; i < maxRows2_final; i++) {
                const s6r = s6_final[i] || { k: '', v: '' };
                let s7type = "", s7ftd = "", s7mtd = "", s7ytd = "";
                if (inpitAggregated.length === 0 && i === 0) {
                    s7type = "No Data";
                } else if (i < inpitAggregated.length) {
                    s7type = inpitAggregated[i].Type; s7ftd = fmt(inpitAggregated[i].FTD); s7mtd = fmt(inpitAggregated[i].MTD); s7ytd = fmt(inpitAggregated[i].YTD);
                }

                let s8type = "", s8ftd = "", s8mtd = "", s8ytd = "";
                if (i === 0) {
                    s8type = "OB"; s8ftd = fmt(wp3Aggregated.OB.FTD); s8mtd = fmt(wp3Aggregated.OB.MTD); s8ytd = fmt(wp3Aggregated.OB.YTD);
                } else if (i === 1) {
                    s8type = "COAL"; s8ftd = fmt(wp3Aggregated.Coal.FTD); s8mtd = fmt(wp3Aggregated.Coal.MTD); s8ytd = fmt(wp3Aggregated.Coal.YTD);
                }

                if (inpitAggregated.length === 0 && i === 0) {
                    addDataRow([s6r.k, null, s6r.v, null, null, s7type, null, null, null, null, null, s8type, null, s8ftd, s8mtd, s8ytd, null, null], {}, [2, 0, 3, 0, 0, 6, 0, 0, 0, 0, 0, 2, 0, 1, 1, 3, 0, 0]);
                } else {
                    addDataRow([
                        s6r.k, null, s6r.v, null, null,
                        s7type, null, s7ftd, null, s7mtd, null,
                        s8type, null, s8ftd, s8mtd, s8ytd, null, null],
                        {}, [2, 0, 3, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1, 1, 3, 0, 0]);
                }
            }
            currentRowIdx += 2;

            // SECTION 9. DUMPER-LOADER TRIP DETAILS
            ws.mergeCells(`B${currentRowIdx}:S${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "9. DUMPER-LOADER TRIP DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            const dumperLoaderDetails = data[13] || [];
            const dumperObj = {};
            const loadersByShift = { 'SHIFTA': new Set(), 'SHIFTB': new Set(), 'SHIFTC': new Set() };
            dumperLoaderDetails.forEach(r => {
                const shiftName = r.ShiftName?.toUpperCase().replace('-', '').trim() || '';
                const dumper = r.Dumper || '';
                const factor = r.FACTOR || '';
                const loader = r.Loader || '';
                const trips = r.Trip || 0;

                if (!dumperObj[dumper]) dumperObj[dumper] = { Dumper: dumper, Factor: factor, SHIFTA: {}, SHIFTB: {}, SHIFTC: {}, Total: 0 };
                if (shiftName && ['SHIFTA', 'SHIFTB', 'SHIFTC'].includes(shiftName)) {
                    if (loader) {
                        loadersByShift[shiftName].add(loader);
                        dumperObj[dumper][shiftName][loader] = (dumperObj[dumper][shiftName][loader] || 0) + trips;
                    }
                }
                dumperObj[dumper].Total += trips;
            });
            const headersDL = [
                { name: 'SHIFTA', loaders: Array.from(loadersByShift['SHIFTA']).sort() },
                { name: 'SHIFTB', loaders: Array.from(loadersByShift['SHIFTB']).sort() },
                { name: 'SHIFTC', loaders: Array.from(loadersByShift['SHIFTC']).sort() }
            ];
            const rowsDL = Object.values(dumperObj).sort((a, b) => a.Dumper.localeCompare(b.Dumper));
            const grandTotalsDL = { SHIFTA: {}, SHIFTB: {}, SHIFTC: {}, Total: 0 };
            headersDL.forEach(h => {
                h.loaders.forEach(l => {
                    let sum = 0;
                    rowsDL.forEach(r => sum += (r[h.name][l] || 0));
                    grandTotalsDL[h.name][l] = sum;
                });
            });
            grandTotalsDL.Total = rowsDL.reduce((s, r) => s + r.Total, 0);

            const dlStartRow = currentRowIdx;
            ws.getRow(dlStartRow).height = 40;

            let currentDlCol = 2; // B
            ws.mergeCells(`B${dlStartRow}:B${dlStartRow + 1}`);
            setCell(ws.getCell(`B${dlStartRow}`), "Dumper", { bold: true, bg: 'FFBFDBFE' });
            currentDlCol++;

            ws.mergeCells(`C${dlStartRow}:C${dlStartRow + 1}`);
            setCell(ws.getCell(`C${dlStartRow}`), "FACTOR", { bold: true, bg: 'FFBFDBFE' });
            currentDlCol++;

            headersDL.forEach(h => {
                const shiftColSpan = Math.max(1, h.loaders.length);
                const shiftEndCol = currentDlCol + shiftColSpan - 1;
                const letterStart = ws.getColumn(currentDlCol).letter;
                const letterEnd = ws.getColumn(shiftEndCol).letter;
                if (shiftColSpan > 1) {
                    ws.mergeCells(`${letterStart}${dlStartRow}:${letterEnd}${dlStartRow}`);
                }

                setCell(ws.getCell(`${letterStart}${dlStartRow}`), h.name === 'SHIFTA' ? 'SHIFT-A' : h.name === 'SHIFTB' ? 'SHIFT-B' : 'SHIFT-C', { bold: true, bg: 'FFBFDBFE', color: 'FFDC2626' });

                if (h.loaders.length > 0) {
                    h.loaders.forEach((loader, i) => {
                        const loaderCell = ws.getCell(`${ws.getColumn(currentDlCol + i).letter}${dlStartRow + 1}`);
                        setCell(loaderCell, loader, { bold: true, bg: 'FFBFDBFE' });
                        loaderCell.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center' };
                    });
                } else {
                    setCell(ws.getCell(`${ws.getColumn(currentDlCol).letter}${dlStartRow + 1}`), "", { bold: true, bg: 'FFBFDBFE' });
                }
                currentDlCol += shiftColSpan;
            });

            ws.mergeCells(`${ws.getColumn(currentDlCol).letter}${dlStartRow}:${ws.getColumn(currentDlCol).letter}${dlStartRow + 1}`);
            setCell(ws.getCell(`${ws.getColumn(currentDlCol).letter}${dlStartRow}`), "TOTAL", { bold: true, bg: 'FFFDE047', color: 'FFDC2626' });

            currentRowIdx += 2;

            rowsDL.forEach(r => {
                const rowObj = ws.getRow(currentRowIdx);
                let col = 2;
                setCell(rowObj.getCell(col++), r.Dumper);
                setCell(rowObj.getCell(col++), r.Factor);
                headersDL.forEach(h => {
                    if (h.loaders.length > 0) {
                        h.loaders.forEach(l => {
                            setCell(rowObj.getCell(col++), fmt(r[h.name][l]));
                        });
                    } else {
                        setCell(rowObj.getCell(col++), "");
                    }
                });
                setCell(rowObj.getCell(col), r.Total, { bold: true, bg: 'FFFDE047' });
                currentRowIdx++;
            });

            const stRow = ws.getRow(currentRowIdx);
            ws.mergeCells(`B${currentRowIdx}:C${currentRowIdx}`);
            setCell(stRow.getCell(2), "SUB TOTAL", { bold: true, align: 'right', bg: 'FFBFDBFE' });
            setCell(stRow.getCell(3), "", { bold: true, align: 'right', bg: 'FFBFDBFE' });
            let col = 4;
            headersDL.forEach(h => {
                if (h.loaders.length > 0) {
                    h.loaders.forEach(l => {
                        setCell(stRow.getCell(col++), fmt(grandTotalsDL[h.name][l] || 0));
                    });
                } else {
                    setCell(stRow.getCell(col++), "");
                }
            });
            setCell(stRow.getCell(col), grandTotalsDL.Total, { bold: true, color: 'FFDC2626', bg: 'FFFDE047' });


            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `DailyProduction_${date}.xlsx`);
            toast.success("Excel exported successfully!");
        
     
     console.log('Export Built Successfully without SaveAs!');
  } catch (err) {
      console.error('EXPORT CRASHED!');
      console.error(err);
  }
}
runExport();
