'use client';

import { useState, useEffect } from 'react';
import styles from './TentativeProduction.module.css'; // Updated CSS Import
import TentativeReportTable from './TentativeReportTable';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';

export default function TentativeProductionPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [shiftId, setShiftId] = useState('');
    const [shifts, setShifts] = useState([]);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch Shifts on Load
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const res = await fetch('/api/reports/tentative-production?type=shifts');
                const result = await res.json();
                if (result.success) {
                    setShifts(result.data);
                }
            } catch (error) {
                console.error("Failed to load shifts", error);
            }
        };
        fetchShifts();
    }, []);

    const handleShowReport = async () => {
        if (!date) return toast.error('Please select a date');
        // Shift is optional in Sector Wise, assume optional here too? 
        // Or keep mandatory as per previous logic. Keeping mandatory for now if old logic required it. 
        // Actually old logic: if (!filter.shiftId) return toast.error('Please select a shift');
        // Sector Wise made it optional. Let's make it optional to match pattern if backend supports it.
        // But backend for Tentative might require it. Let's check ProMS2_SPReportTentativeProduction.sql
        // It uses @ShiftId in WHERE clause: T0.ShiftId=@ShiftId. So it is MANDATORY in current SP.
        // User asked to match DESIGN, not necessarily logic, but better to keep working logic.
        if (!shiftId) return toast.error('Please select a shift');

        setLoading(true);
        setData(null);

        try {
            const res = await fetch('/api/reports/tentative-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, shiftId })
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                toast.success('Report Generated');
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Tentative_Production_${date}`;
        setTimeout(() => {
            window.print();
            setTimeout(() => { document.title = originalTitle; }, 500);
        }, 500);
    };

    // --- Totals Calculation Helpers (Moved from Table) ---
    const calculateWasteTotal = (arr) => arr.reduce((acc, row) => ({
        OverBurden: acc.OverBurden + (row.OverBurden || 0),
        TopSoil: acc.TopSoil + (row.TopSoil || 0),
        TotalTrip: acc.TotalTrip + (row.TotalTrip || 0),
        QtyBcm: acc.QtyBcm + (row.QtyBcm || 0),
        Diff: acc.Diff + (row.Diff || 0)
    }), { OverBurden: 0, TopSoil: 0, TotalTrip: 0, QtyBcm: 0, Diff: 0 });

    const calculateCoalTotal = (arr) => arr.reduce((acc, row) => ({
        RomCoal: acc.RomCoal + (row.RomCoal || 0),
        Qty: acc.Qty + (row.Qty || 0),
        Diff: acc.Diff + (row.Diff || 0)
    }), { RomCoal: 0, Qty: 0, Diff: 0 });

    const calculateRehandlingTotal = (arr) => arr.reduce((acc, row) => ({
        Trip: acc.Trip + (row.Trip || 0),
        Qty: acc.Qty + (row.Qty || 0)
    }), { Trip: 0, Qty: 0 });

    const formatDate = (d) => {
        if (!d) return '';
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return d;
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(month, 10) - 1]}-${year}`;
    };

    const handleExportExcel = async () => {
        if (!data) return;

        const { wasteHandling, coalProduction, wp3, obRehandling, coalRehandling, headerInfo } = data;

        const wasteTotal = calculateWasteTotal(wasteHandling);
        const wp3Total = calculateWasteTotal(wp3);
        const coalTotal = calculateCoalTotal(coalProduction);
        const obRehandlingTotal = calculateRehandlingTotal(obRehandling);
        const coalRehandlingTotal = calculateRehandlingTotal(coalRehandling);

        const fmt = (val) => (val !== undefined && val !== null) ? Number(val) : 0;

        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Tentative Production');

            // 1. Column Widths (A is empty for padding)
            ws.columns = [
                { width: 3 },  // A
                { width: 25 }, // B
                { width: 12 }, // C
                { width: 10 }, // D
                { width: 10 }, // E
                { width: 10 }, // F
                { width: 12 }, // G
                { width: 15 }, // H
                { width: 10 }, // I
                { width: 12 }, // J
                { width: 10 }  // K
            ];

            // Add Logo
            let logoId;
            try {
                // Fetch image to blob
                const logoRes = await fetch('/Asset/Logo.png');
                const arrayBuffer = await logoRes.arrayBuffer();
                logoId = wb.addImage({
                    buffer: arrayBuffer,
                    extension: 'png',
                });
            } catch (e) { console.error('Logo add failed', e); }

            // Helper to style a cell
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

            // 2. Headers (Empty Row 1 for padding)
            ws.getRow(1).height = 15; // Empty padding row

            ws.mergeCells('B2:K2');
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells('B3:K3');
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells('B4:K4');
            setCell(ws.getCell('B4'), "TENTATIVE PRODUCTION QTY", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells('B5:K5');
            setCell(ws.getCell('B5'), `Shift: ${headerInfo?.ShiftName || '-'}   |   Relay: ${headerInfo?.Relay || '-'}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.mergeCells('B6:K6');
            setCell(ws.getCell('B6'), `Incharge: ${headerInfo?.ShiftIncharge || '-'}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.mergeCells('B7:K7');
            setCell(ws.getCell('B7'), `Date: ${formatDate(headerInfo?.Date) || '-'}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            // Set heights
            ws.getRow(2).height = 30;
            ws.getRow(3).height = 22;
            ws.getRow(4).height = 20;
            ws.getRow(5).height = 18;
            ws.getRow(6).height = 18;
            ws.getRow(7).height = 18;

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 100, height: 90 }
                });
            }

            ws.getRow(8).height = 10; // Empty spacer

            let currentRowIdx = 9;

            // Helper to add data row with column spans
            const addDataRow = (values, opts = {}, colSpans = null) => {
                const row = ws.getRow(currentRowIdx);
                let currentStartCol = 2; // B
                values.forEach((val, i) => {
                    if (val === null && !colSpans) return;
                    const span = colSpans ? colSpans[i] : 1;
                    if (!span) return;

                    const cOpts = { ...opts };
                    if (i === 0 && !opts.bold) cOpts.align = 'left';
                    if (typeof val === 'number') {
                        cOpts.numFmt = '#,##0'; // Or #,##0.00 if decimals needed
                        if (val === 0) cOpts.numFmt = '0'; // Keep 0 simple
                    }

                    if (span > 1) {
                        const startCol = ws.getColumn(currentStartCol).letter;
                        const endCol = ws.getColumn(currentStartCol + span - 1).letter;
                        ws.mergeCells(`${startCol}${currentRowIdx}:${endCol}${currentRowIdx}`);
                    }

                    const cell = row.getCell(currentStartCol);
                    setCell(cell, val, cOpts);

                    // Apply styles to all merged cells
                    for (let s = 0; s < span; s++) {
                        const styleCell = row.getCell(currentStartCol + s);
                        if (cOpts.border !== false) {
                            styleCell.border = {
                                top: { style: 'thin' }, left: { style: 'thin' },
                                bottom: { style: 'thin' }, right: { style: 'thin' }
                            };
                        }
                        if (cOpts.bg) {
                            styleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cOpts.bg } };
                        }
                    }

                    currentStartCol += span;
                });
                row.height = opts.height || 18;
                currentRowIdx++;
            };

            const addHeaderRow = (titles, bg = 'FFBFDBFE', colSpans = null) => addDataRow(titles, { bold: true, bg }, colSpans);

            // --- OB Handling --- 10 columns (span 1 each)
            const obSpans = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
            ws.mergeCells(`B${currentRowIdx}:K${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "OB Handling", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            // Split header manually
            ws.mergeCells(`B${currentRowIdx}:B${currentRowIdx + 1}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Model", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`C${currentRowIdx}:C${currentRowIdx + 1}`);
            setCell(ws.getCell(`C${currentRowIdx}`), "OB/IB", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`D${currentRowIdx}:D${currentRowIdx + 1}`);
            setCell(ws.getCell(`D${currentRowIdx}`), "Factor", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`E${currentRowIdx}:E${currentRowIdx + 1}`);
            setCell(ws.getCell(`E${currentRowIdx}`), "Free Dig", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`F${currentRowIdx}:F${currentRowIdx + 1}`);
            setCell(ws.getCell(`F${currentRowIdx}`), "Factor", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`G${currentRowIdx}:G${currentRowIdx + 1}`);
            setCell(ws.getCell(`G${currentRowIdx}`), "Total Trip", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`H${currentRowIdx}:H${currentRowIdx + 1}`);
            setCell(ws.getCell(`H${currentRowIdx}`), "Qty (BCM)", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`I${currentRowIdx}:K${currentRowIdx}`);
            setCell(ws.getCell(`I${currentRowIdx}`), "Mapio", { bold: true, bg: 'FFE2E8F0' });

            setCell(ws.getCell(`I${currentRowIdx + 1}`), "Trip", { bold: true, bg: 'FFF1F5F9' });
            setCell(ws.getCell(`J${currentRowIdx + 1}`), "Qty (BCM)", { bold: true, bg: 'FFF1F5F9' });
            setCell(ws.getCell(`K${currentRowIdx + 1}`), "Diff.", { bold: true, bg: 'FFF1F5F9' });

            // Ensure borders for headers
            for (let r = 0; r < 2; r++) {
                for (let c = 2; c <= 11; c++) {
                    const cell = ws.getCell(currentRowIdx + r, c);
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (r === 0 && c <= 8) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFDBFE' } };
                    if (r === 0 && c >= 9) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                    if (r === 1 && c >= 9) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                }
            }

            ws.getRow(currentRowIdx).height = 20;
            ws.getRow(currentRowIdx + 1).height = 20;
            currentRowIdx += 2;

            wasteHandling.forEach(row => {
                addDataRow([row.EquipmentGroup, fmt(row.OverBurden), row.OverBurdenFactor || "", fmt(row.TopSoil), row.TopSoilFactor || "", fmt(row.TotalTrip), fmt(row.QtyBcm), fmt(row.MapioTrip), fmt(row.MapioQty), fmt(row.Diff)], {}, obSpans);
            });
            addDataRow(["Total", fmt(wasteTotal.OverBurden), "", fmt(wasteTotal.TopSoil), "", fmt(wasteTotal.TotalTrip), fmt(wasteTotal.QtyBcm), 0, 0, fmt(wasteTotal.Diff)], { bold: true, bg: 'FFDBEAFE' }, obSpans);

            currentRowIdx++; // Spacer

            // --- Coal Production ---
            const coalSpans = [2, 2, 1, 2, 1, 1, 1]; // Total = 10 columns
            ws.mergeCells(`B${currentRowIdx}:K${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Coal Production", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            // Split header manually 
            ws.mergeCells(`B${currentRowIdx}:C${currentRowIdx + 1}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Model", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`D${currentRowIdx}:E${currentRowIdx + 1}`);
            setCell(ws.getCell(`D${currentRowIdx}`), "ROM COAL", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`F${currentRowIdx}:F${currentRowIdx + 1}`);
            setCell(ws.getCell(`F${currentRowIdx}`), "Factor", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`G${currentRowIdx}:H${currentRowIdx + 1}`);
            setCell(ws.getCell(`G${currentRowIdx}`), "Qty (MT)", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`I${currentRowIdx}:K${currentRowIdx}`);
            setCell(ws.getCell(`I${currentRowIdx}`), "Mapio", { bold: true, bg: 'FFE2E8F0' });

            setCell(ws.getCell(`I${currentRowIdx + 1}`), "Trip", { bold: true, bg: 'FFF1F5F9' });
            setCell(ws.getCell(`J${currentRowIdx + 1}`), "Qty (MT)", { bold: true, bg: 'FFF1F5F9' });
            setCell(ws.getCell(`K${currentRowIdx + 1}`), "Diff.", { bold: true, bg: 'FFF1F5F9' });

            for (let r = 0; r < 2; r++) {
                for (let c = 2; c <= 11; c++) {
                    const cell = ws.getCell(currentRowIdx + r, c);
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (r === 0 && c <= 8) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFDBFE' } };
                    if (r === 0 && c >= 9) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                    if (r === 1 && c >= 9) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                }
            }

            ws.getRow(currentRowIdx).height = 20;
            ws.getRow(currentRowIdx + 1).height = 20;
            currentRowIdx += 2;

            coalProduction.forEach(row => {
                addDataRow([row.EquipmentGroup, fmt(row.RomCoal), row.Factor || "", fmt(row.Qty), fmt(row.MapioTrip), fmt(row.MapioQty), fmt(row.Diff)], {}, coalSpans);
            });
            addDataRow(["Total", fmt(coalTotal.RomCoal), "", fmt(coalTotal.Qty), 0, 0, fmt(coalTotal.Diff)], { bold: true, bg: 'FFDBEAFE' }, coalSpans);

            currentRowIdx++;

            // --- WP-3 ---
            ws.mergeCells(`B${currentRowIdx}:K${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "WP-3 Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["Model", "OB/IB", "Factor", "Free Dig", "Factor", "Coal", "Factor", "Total Trip", "Coal Qty", "Qty (BCM)"], 'FFBFDBFE', obSpans);

            wp3.forEach(row => {
                addDataRow([row.EquipmentGroup, fmt(row.OverBurden), row.OverBurdenFactor || "", fmt(row.TopSoil), row.TopSoilFactor || "", fmt(row.Coal), row.CoalFactor || "", fmt(row.TotalTrip), fmt(row.CoalQty), fmt(row.QtyBcm)], {}, obSpans);
            });
            addDataRow(["Total", fmt(wp3Total.OverBurden), "", fmt(wp3Total.TopSoil), "", fmt(wp3Total.Coal), "", fmt(wp3Total.TotalTrip), fmt(wp3Total.CoalQty), fmt(wp3Total.QtyBcm)], { bold: true, bg: 'FFDBEAFE' }, obSpans);

            currentRowIdx++;

            // --- Rehandling ---
            const rehandlingSpans = [3, 2, 2, 3]; // 3+2+2+3 = 10 columns
            ws.mergeCells(`B${currentRowIdx}:K${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "OB Rehandling/Carpeting Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["Model", "Trip", "Factor", "Qty (BCM)"], 'FFBFDBFE', rehandlingSpans);
            obRehandling.forEach(row => {
                addDataRow([row.EquipmentGroup, fmt(row.Trip), row.Factor || "", fmt(row.Qty)], {}, rehandlingSpans);
            });
            addDataRow(["Total", fmt(obRehandlingTotal.Trip), "", fmt(obRehandlingTotal.Qty)], { bold: true, bg: 'FFDBEAFE' }, rehandlingSpans);

            currentRowIdx++;

            ws.mergeCells(`B${currentRowIdx}:K${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Coal Rehandling Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["Model", "Trip", "Factor", "Qty (MT)"], 'FFBFDBFE', rehandlingSpans);
            coalRehandling.forEach(row => {
                addDataRow([row.EquipmentGroup, fmt(row.Trip), row.Factor || "", fmt(row.Qty)], {}, rehandlingSpans);
            });
            addDataRow(["Total", fmt(coalRehandlingTotal.Trip), "", fmt(coalRehandlingTotal.Qty)], { bold: true, bg: 'FFDBEAFE' }, rehandlingSpans);

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `TentativeProduction_${headerInfo?.Date || 'Report'}.xlsx`);

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Tentative Production</h1>
            </div>

            <div className={styles.filterContainer}> {/* Replaced Header Controls */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Shift</label>
                    <select
                        className={styles.select}
                        value={shiftId}
                        onChange={(e) => setShiftId(e.target.value)}
                    >
                        <option value="">Select Shift</option>
                        {shifts.map((s) => (
                            <option key={s.SlNo} value={s.SlNo}>
                                {s.ShiftName}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleShowReport}
                    disabled={loading}
                    className={styles.generateBtn}
                >
                    {loading ? 'Generating...' : 'Show Report'}
                </button>

                <div style={{ flex: 1 }}></div>

                {data && (
                    <>
                        <button onClick={handlePrint} className={styles.actionBtn}>
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExportExcel} className={`${styles.actionBtn} ${styles.excel}`}>
                            <Download size={16} /> Export Excel
                        </button>
                    </>
                )}
            </div>

            <div className={styles.tableContainer}>
                <TentativeReportTable data={data} loading={loading} />
            </div>
        </div>
    );
}
