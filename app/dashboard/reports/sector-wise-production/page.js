'use client';
import { useState, useEffect } from 'react';
import styles from './SectorWiseProduction.module.css';
import SectorWiseProductionTable from './SectorWiseProductionTable';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function SectorWiseProductionPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [shiftId, setShiftId] = useState('');
    const [shifts, setShifts] = useState([]);

    // State
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Shifts on mount
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const res = await fetch('/api/master/shift');
                if (res.ok) {
                    const data = await res.json();
                    let fetchedShifts = [];
                    if (Array.isArray(data)) {
                        fetchedShifts = data;
                    } else if (data.success && Array.isArray(data.data)) {
                        fetchedShifts = data.data;
                    }
                    setShifts(fetchedShifts);
                    if (fetchedShifts.length > 0) {
                        setShiftId(fetchedShifts[0].SlNo.toString());
                    }
                } else {
                    console.warn("Could not fetch shifts");
                }
            } catch (e) {
                console.error("Shift fetch error:", e);
                toast.error("Failed to load shifts");
            }
        };
        fetchShifts();
    }, []);

    const handleShowReport = async () => {
        if (!date) {
            toast.error("Please select Date");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/sector-wise-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, shiftId })
            });
            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
            } else {
                setError(result.message || 'Failed to fetch report');
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = async () => {
        if (!reportData || reportData.length === 0) return;
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Sector Wise Production');

            // 1. Column Widths (A is empty for padding, matching 9 columns)
            // Sector wise has 9 columns: Si No, Equipment Name, Patch, Trip, Qty, OB Hrs, Target, BCM/Hr, Method
            ws.columns = [
                { width: 3 },  // A (padding)
                { width: 8 },  // B
                { width: 25 }, // C
                { width: 20 }, // D
                { width: 10 }, // E
                { width: 15 }, // F
                { width: 10 }, // G
                { width: 15 }, // H
                { width: 12 }, // I
                { width: 15 }  // J
            ];

            // Add Logo
            let logoId;
            try {
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

            ws.mergeCells('B2:J2');
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells('B3:J3');
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells('B4:J4');
            setCell(ws.getCell('B4'), "SECTOR WISE PRODUCTION REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            const shiftName = shifts.find(s => s.SlNo == shiftId)?.ShiftName || 'All';
            ws.mergeCells('B5:J5');
            setCell(ws.getCell('B5'), `Shift: ${shiftName}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.mergeCells('B6:J6');
            let formattedDate = date;
            if (date) {
                const [y, m, d] = date.split('-');
                formattedDate = `${d}/${m}/${y}`;
            }
            setCell(ws.getCell('B6'), `Date: ${formattedDate}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            // Set heights
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

            ws.getRow(7).height = 10; // Empty spacer

            let currentRowIdx = 8;

            // Helper to add data row
            const addDataRow = (values, opts = {}) => {
                const row = ws.getRow(currentRowIdx);
                values.forEach((val, i) => {
                    if (val === null) return;
                    const cOpts = { ...opts };
                    if (i === 1 && !opts.bold) cOpts.align = 'left'; // Equipment Name
                    if (i === 2 && !opts.bold) cOpts.align = 'left'; // Patch Name
                    if (typeof val === 'number') {
                        cOpts.numFmt = '#,##0';
                        if (val === 0) cOpts.numFmt = '0';
                    }
                    setCell(row.getCell(i + 2), val, cOpts);
                });
                row.height = opts.height || 18;
                currentRowIdx++;
            };

            // Group Data
            const groups = {};
            reportData.forEach(row => {
                const sector = row.SectorName || 'Unknown';
                if (!groups[sector]) groups[sector] = [];
                groups[sector].push(row);
            });
            const sectors = Object.keys(groups).sort();

            let grandTrips = 0, grandQty = 0, grandHrs = 0;

            // Header Row
            addDataRow(["Si No", "Equipment Name", "Patch", "Trip", "Tentative Production Qty", "OB Hrs", "Target BCM/Hr", "BCM/Hr", "Method"], { bold: true, bg: 'FFBFDBFE' });

            sectors.forEach((sector, sIdx) => {
                const rows = groups[sector];

                // Sector Header manually merged
                ws.mergeCells(`B${currentRowIdx}:J${currentRowIdx}`);
                setCell(ws.getCell(`B${currentRowIdx}`), String.fromCharCode(65 + sIdx) + ". " + sector, { bold: true, align: 'left', bg: 'FFE5E7EB', border: false });

                // Add borders explicitly due to merge
                for (let c = 2; c <= 10; c++) {
                    ws.getCell(currentRowIdx, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                }

                ws.getRow(currentRowIdx).height = 20;
                currentRowIdx++;

                let secTrips = 0, secQty = 0, secHrs = 0;

                rows.forEach((r, rIdx) => {
                    addDataRow([
                        rIdx + 1,
                        r.EquipmentName,
                        r.PatchName,
                        r.Trips,
                        r.QtyBCM,
                        r.OBHrs,
                        r.TargetBCMHr,
                        Number(r.BCMHr), // Excel JS handles toFixed if numFmt applied, but we set string to keep decimal
                        r.MethodName
                    ]);
                    // Override BCM/Hr numFmt
                    ws.getCell(`I${currentRowIdx - 1}`).numFmt = '0.00';

                    secTrips += (r.Trips || 0);
                    secQty += (r.QtyBCM || 0);
                    secHrs += (r.OBHrs || 0);
                });

                // Sector Total
                ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
                setCell(ws.getCell(`B${currentRowIdx}`), "Total", { bold: true, align: 'center', bg: 'FFDBEAFE' });
                ws.getCell(`C${currentRowIdx}`).border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
                ws.getCell(`D${currentRowIdx}`).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                const secBCMHr = secHrs > 0 ? (secQty / secHrs) : 0;

                setCell(ws.getCell(`E${currentRowIdx}`), secTrips, { bold: true, bg: 'FFDBEAFE', numFmt: '#,##0' });
                setCell(ws.getCell(`F${currentRowIdx}`), secQty, { bold: true, bg: 'FFDBEAFE', numFmt: '#,##0' });
                setCell(ws.getCell(`G${currentRowIdx}`), secHrs, { bold: true, bg: 'FFDBEAFE', numFmt: '#,##0.0' });
                setCell(ws.getCell(`H${currentRowIdx}`), "-", { bold: true, bg: 'FFDBEAFE' });
                setCell(ws.getCell(`I${currentRowIdx}`), secBCMHr, { bold: true, bg: 'FFDBEAFE', numFmt: '0.00' });
                setCell(ws.getCell(`J${currentRowIdx}`), "", { bold: true, bg: 'FFDBEAFE' });

                ws.getRow(currentRowIdx).height = 18;
                currentRowIdx++;

                grandTrips += secTrips;
                grandQty += secQty;
                grandHrs += secHrs;
            });

            // Grand Total
            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Grand Total", { bold: true, align: 'center', bg: 'FF92C5FE' }); // darker blue
            ws.getCell(`C${currentRowIdx}`).border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
            ws.getCell(`D${currentRowIdx}`).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

            const gradBCMHr = grandHrs > 0 ? (grandQty / grandHrs) : 0;

            setCell(ws.getCell(`E${currentRowIdx}`), grandTrips, { bold: true, bg: 'FF92C5FE', numFmt: '#,##0' });
            setCell(ws.getCell(`F${currentRowIdx}`), grandQty, { bold: true, bg: 'FF92C5FE', numFmt: '#,##0' });
            setCell(ws.getCell(`G${currentRowIdx}`), grandHrs, { bold: true, bg: 'FF92C5FE', numFmt: '#,##0.0' });
            setCell(ws.getCell(`H${currentRowIdx}`), "-", { bold: true, bg: 'FF92C5FE' });
            setCell(ws.getCell(`I${currentRowIdx}`), gradBCMHr, { bold: true, bg: 'FF92C5FE', numFmt: '0.00' });
            setCell(ws.getCell(`J${currentRowIdx}`), "", { bold: true, bg: 'FF92C5FE' });

            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx += 2; // Add Spacer before Summary

            // --- Summary Section ---
            ws.mergeCells(`B${currentRowIdx}:J${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Summary", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 12 });
            ws.getRow(currentRowIdx).height = 22;
            currentRowIdx++;

            // Summary Header Row 1
            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx + 1}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Location", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`E${currentRowIdx}:J${currentRowIdx}`);
            setCell(ws.getCell(`E${currentRowIdx}`), "OB", { bold: true, bg: 'FFBFDBFE' });

            // Summary Header Row 2
            ws.mergeCells(`E${currentRowIdx + 1}:F${currentRowIdx + 1}`);
            setCell(ws.getCell(`E${currentRowIdx + 1}`), "Total Qty", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`G${currentRowIdx + 1}:H${currentRowIdx + 1}`);
            setCell(ws.getCell(`G${currentRowIdx + 1}`), "Target", { bold: true, bg: 'FFBFDBFE' });

            ws.mergeCells(`I${currentRowIdx + 1}:J${currentRowIdx + 1}`);
            setCell(ws.getCell(`I${currentRowIdx + 1}`), "Achieved %", { bold: true, bg: 'FFBFDBFE' });

            // Borders for Summary Headers
            for (let r = 0; r <= 1; r++) {
                for (let c = 2; c <= 10; c++) {
                    const cell = ws.getCell(currentRowIdx + r, c);
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    if (r === 0 || (r === 1 && c >= 5)) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBFDBFE' } };
                    }
                }
            }

            ws.getRow(currentRowIdx).height = 20;
            ws.getRow(currentRowIdx + 1).height = 20;
            currentRowIdx += 2;

            let sumAchieved = 0;
            let sumTarget = 0;

            sectors.forEach((sector) => {
                const rows = groups[sector];
                const secAchieved = rows.reduce((s, r) => s + (r.QtyBCM || 0), 0);
                const secTarget = rows.reduce((s, r) => s + (r.TargetBCMHr || 0), 0);
                const percent = secTarget > 0 ? ((secAchieved / secTarget) * 100).toFixed(0) + '%' : '0%';

                ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
                setCell(ws.getCell(`B${currentRowIdx}`), sector, { bold: true });

                ws.mergeCells(`E${currentRowIdx}:F${currentRowIdx}`);
                setCell(ws.getCell(`E${currentRowIdx}`), secAchieved, { bold: true, numFmt: '#,##0' });

                ws.mergeCells(`G${currentRowIdx}:H${currentRowIdx}`);
                const targetCellOpts = { bold: true, numFmt: '#,##0', color: 'FFC026D3' }; // fuchsia-600 approx
                setCell(ws.getCell(`G${currentRowIdx}`), secTarget, targetCellOpts);

                ws.mergeCells(`I${currentRowIdx}:J${currentRowIdx}`);
                setCell(ws.getCell(`I${currentRowIdx}`), percent, { bold: true });

                for (let c = 2; c <= 10; c++) {
                    ws.getCell(currentRowIdx, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                }

                ws.getRow(currentRowIdx).height = 18;
                currentRowIdx++;

                sumAchieved += secAchieved;
                sumTarget += secTarget;
            });

            // Summary Total Row
            const sumPercent = sumTarget > 0 ? ((sumAchieved / sumTarget) * 100).toFixed(0) + '%' : '0%';

            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Total", { bold: true, bg: 'FFE5E7EB' });

            ws.mergeCells(`E${currentRowIdx}:F${currentRowIdx}`);
            setCell(ws.getCell(`E${currentRowIdx}`), sumAchieved, { bold: true, bg: 'FFE5E7EB', numFmt: '#,##0' });

            ws.mergeCells(`G${currentRowIdx}:H${currentRowIdx}`);
            setCell(ws.getCell(`G${currentRowIdx}`), sumTarget, { bold: true, bg: 'FFE5E7EB', numFmt: '#,##0', color: 'FFC026D3' });

            ws.mergeCells(`I${currentRowIdx}:J${currentRowIdx}`);
            setCell(ws.getCell(`I${currentRowIdx}`), sumPercent, { bold: true, bg: 'FFE5E7EB' });

            for (let c = 2; c <= 10; c++) {
                ws.getCell(currentRowIdx, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                ws.getCell(currentRowIdx, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
            }

            ws.getRow(currentRowIdx).height = 20;

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `SectorWiseProduction_${date}.xlsx`);
            toast.success("Excel exported successfully!");
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Sector Wise Production Report</h1>
            </div>

            <div className={styles.filterContainer}>
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
                        className={styles.input}
                        value={shiftId}
                        onChange={(e) => setShiftId(e.target.value)}
                    >
                        {/* <option value="">All Shifts</option> */}
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

                {reportData && (
                    <>
                        <button onClick={handlePrint} className={styles.actionBtn}>
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExportExcel} className={`${styles.actionBtn} ${styles.excel}`}>
                            <Download size={16} /> Excel
                        </button>
                    </>
                )}
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {reportData && (
                <div className={styles.reportSheet} id="print-area">
                    <SectorWiseProductionTable
                        data={reportData}
                        date={date}
                        shiftName={shifts.find(s => s.SlNo == shiftId)?.ShiftName || 'All Shifts'}
                    />
                </div>
            )}
        </div>
    );
}
