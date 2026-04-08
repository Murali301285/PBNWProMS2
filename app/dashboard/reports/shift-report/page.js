'use client';
import { useState, useEffect } from 'react';
import styles from './ShiftReport.module.css';
import ShiftReportTable from './ShiftReportTable';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

export default function ShiftReportPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [shiftId, setShiftId] = useState('');
    const [shifts, setShifts] = useState([]);

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
                    if (Array.isArray(data)) {
                        setShifts(data);
                    } else if (data.success && Array.isArray(data.data)) {
                        setShifts(data.data);
                    }
                } else {
                    console.warn("Could not fetch shifts");
                }
            } catch (e) { console.error(e); }
        };
        fetchShifts();
    }, []);

    const handleShowReport = async () => {
        if (!date || !shiftId) {
            toast.error("Please select both Date and Shift");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/shift-production', {
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
        const shiftName = shifts.find(s => s.SlNo == shiftId)?.ShiftName || '';
        const originalTitle = document.title;
        document.title = `Shift_Report_${date}_${shiftName}`.replace(/\s+/g, '_');
        setTimeout(() => {
            window.print();
            setTimeout(() => { document.title = originalTitle; }, 500);
        }, 500);
    };

    const handleExportExcel = async () => {
        if (!reportData) return;
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Shift Report');

            // 1. Column Widths (A is empty for padding, matching 13 total data columns)
            // Max columns used is by Section B (13 data columns from B to N)
            ws.columns = [
                { width: 3 },  // A (padding)
                { width: 18 },  // B 
                { width: 9 },   // C
                { width: 9 },   // D
                { width: 9 },   // E
                { width: 10 },  // F
                { width: 10 },  // G
                { width: 10 },  // H
                { width: 8 },   // I
                { width: 12 },  // J
                { width: 9 },   // K
                { width: 12 },  // L
                { width: 10 },  // M
                { width: 16 }   // N
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

            // 2. Headers
            ws.getRow(1).height = 15; // Empty padding row

            ws.mergeCells('B2:N2');
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells('B3:N3');
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells('B4:N4');
            setCell(ws.getCell('B4'), "SHIFT REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

            const shiftName = shifts.find(s => s.SlNo == shiftId)?.ShiftName || 'All';
            ws.mergeCells('B5:N5');
            setCell(ws.getCell('B5'), `SHIFT: ${shiftName}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.mergeCells('B6:N6');
            let formattedDate = date;
            if (date) {
                const [y, m, d] = date.split('-');
                formattedDate = `${d}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m, 10) - 1]}-${y}`;
            }
            setCell(ws.getCell('B6'), `Date: ${formattedDate}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.mergeCells('B7:N7');
            setCell(ws.getCell('B7'), `Incharge : ${reportData.inchargeDetails?.LargeScale || '-'}(Large Scale), ${reportData.inchargeDetails?.SmallScale || '-'}(Mid Scale)`, { bold: true, align: 'center', border: false, fontSize: 10 });

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
                    if (i === 0 && !opts.bold && !opts.forceCenterFirst) cOpts.align = 'left';
                    if (typeof val === 'number') {
                        cOpts.numFmt = '#,##0';
                        if (val === 0) cOpts.numFmt = '0';
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

            const {
                sectionA_Coal, sectionA_Waste,
                sectionB_Loading,
                sectionC_Coal, sectionC_Waste,
                sectionD_Coal, sectionD_Waste,
                sectionE_Coal, sectionE_Waste,
                crushingDetails, dewateringDetails
            } = reportData;

            // SECTION A: TRIP-QUANTITY
            ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "A. TRIP-QUANTITY DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            const secASpans = [3, 2, 3, 2, 3]; // 13 cols total
            addHeaderRow(["Coal", "SHIFT Production", null, "FTD Production", null], 'FFBBF7D0', secASpans, { color: 'FFB91C1C', align: 'center', forceCenterFirst: true }); // bg-green-200, text-red-700

            // Re-merge second header row properly
            const secARow2Spans = [3, 1, 2, 1, 1, 2, 1, 2]; // Needs to match underlying data
            // To make it easy, we just draw it explicitly
            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`); setCell(ws.getCell(`B${currentRowIdx}`), "Segment", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`E${currentRowIdx}:F${currentRowIdx}`); setCell(ws.getCell(`E${currentRowIdx}`), "Trip", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`G${currentRowIdx}:I${currentRowIdx}`); setCell(ws.getCell(`G${currentRowIdx}`), "MT", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`J${currentRowIdx}:K${currentRowIdx}`); setCell(ws.getCell(`J${currentRowIdx}`), "Trip", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`L${currentRowIdx}:N${currentRowIdx}`); setCell(ws.getCell(`L${currentRowIdx}`), "MT", { bold: true, bg: 'FFBFDBFE' });
            for (let c = 2; c <= 14; c++) ws.getCell(currentRowIdx, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            ws.getRow(currentRowIdx).height = 18;
            currentRowIdx++;

            sectionA_Coal.forEach(r => {
                addDataRow([r.Scale, r.Shift_Trips, r.Shift_Qty, r.FTD_Trips, r.FTD_Qty], {}, [3, 2, 3, 2, 3]);
            });
            addDataRow(["Total", sectionA_Coal.reduce((s, r) => s + r.Shift_Trips, 0), sectionA_Coal.reduce((s, r) => s + r.Shift_Qty, 0), sectionA_Coal.reduce((s, r) => s + r.FTD_Trips, 0), sectionA_Coal.reduce((s, r) => s + r.FTD_Qty, 0)], { bold: true, align: 'center', forceCenterFirst: true }, [3, 2, 3, 2, 3]);

            // Waste Table directly underneath
            currentRowIdx++; // Small separator
            addHeaderRow(["OB", "SHIFT Production", null, "FTD Production", null], 'FFBBF7D0', secASpans, { color: 'FFB91C1C', align: 'center', forceCenterFirst: true });

            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`); setCell(ws.getCell(`B${currentRowIdx}`), "Segment", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`E${currentRowIdx}:F${currentRowIdx}`); setCell(ws.getCell(`E${currentRowIdx}`), "Trip", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`G${currentRowIdx}:I${currentRowIdx}`); setCell(ws.getCell(`G${currentRowIdx}`), "BCM", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`J${currentRowIdx}:K${currentRowIdx}`); setCell(ws.getCell(`J${currentRowIdx}`), "Trip", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`L${currentRowIdx}:N${currentRowIdx}`); setCell(ws.getCell(`L${currentRowIdx}`), "BCM", { bold: true, bg: 'FFBFDBFE' });
            for (let c = 2; c <= 14; c++) ws.getCell(currentRowIdx, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            ws.getRow(currentRowIdx).height = 18;
            currentRowIdx++;

            sectionA_Waste.forEach(r => {
                addDataRow([r.Scale, r.Shift_Trips, r.Shift_Qty, r.FTD_Trips, r.FTD_Qty], {}, [3, 2, 3, 2, 3]);
            });
            addDataRow(["Total", sectionA_Waste.reduce((s, r) => s + r.Shift_Trips, 0), sectionA_Waste.reduce((s, r) => s + r.Shift_Qty, 0), sectionA_Waste.reduce((s, r) => s + r.FTD_Trips, 0), sectionA_Waste.reduce((s, r) => s + r.FTD_Qty, 0)], { bold: true, align: 'center', forceCenterFirst: true }, [3, 2, 3, 2, 3]);

            currentRowIdx++;

            // SECTION B: LOADING EQUIPMENTS
            ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "B. LOADING EQUIPMENT'S TRIP DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["LOADING EQP.", "OB/IB", "FREE DIG", "COAL", "Total Trip", "BCM", "MT", "W. Hr", "Target Trip/Hr", "Trip/Hr", "Target BCM/Hr", "BCM/Hr", "LOCATION"], 'FFBFDBFE', [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);

            sectionB_Loading.forEach((r, i) => {
                const bg = i % 2 === 0 ? 'FFEFF6FF' : null; // blue-50 equivalent
                addDataRow([r.LoadingEquipment, r.OBIB_Trip || '-', r.TopSoil_Trip || '-', r.Coal_Trip || '-', r.Total_Trip, r.BCM, r.MT, r.WHr, '-', r.WHr > 0 ? Math.round(r.Total_Trip / r.WHr) : '-', '-', r.WHr > 0 ? Math.round(r.BCM / r.WHr) : '-', r.Location], { bg });
            });

            addDataRow([
                "TOTAL",
                sectionB_Loading.reduce((s, r) => s + (r.OBIB_Trip || 0), 0),
                sectionB_Loading.reduce((s, r) => s + (r.TopSoil_Trip || 0), 0),
                sectionB_Loading.reduce((s, r) => s + (r.Coal_Trip || 0), 0),
                sectionB_Loading.reduce((s, r) => s + (r.Total_Trip || 0), 0),
                sectionB_Loading.reduce((s, r) => s + (r.BCM || 0), 0),
                sectionB_Loading.reduce((s, r) => s + (r.MT || 0), 0),
                "-", "-", "-", "-", "-", "-"
            ], { bold: true, bg: 'FFFDE047' }); // yellow-200

            currentRowIdx++;

            // SECTION C: LOADING EQUIPMENT SUMMARY
            const secCSpans = [3, 2, 3, 2, 3]; // 13 cols total

            // C.1 Coal
            ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "C.1. Loading Equipment (in Coal)", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["Equip. Model", "No's", "MT/Hr", "Hr/Eq.", "MT"], 'FFBFDBFE', secCSpans);
            sectionC_Coal.forEach(r => {
                addDataRow([r.EquipmentModel, r.EqCount, (r.TotalHrs > 0 ? r.MT / r.TotalHrs : 0).toFixed(0), (r.EqCount > 0 ? r.TotalHrs / r.EqCount : 0).toFixed(1), r.MT], {}, secCSpans);
            });
            addDataRow(["Total", sectionC_Coal.reduce((s, r) => s + (r.EqCount || 0), 0), "-", "-", sectionC_Coal.reduce((s, r) => s + (r.MT || 0), 0)], { bold: true, align: 'center', forceCenterFirst: true, bg: 'FFFDE047' }, secCSpans);

            currentRowIdx++;

            // C.2 Waste
            ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "C.2. Loading Equipment (in OB)", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["Equip. Model", "No's", "BCM/Hr", "Hr/Eq.", "BCM"], 'FFBFDBFE', secCSpans);
            sectionC_Waste.forEach(r => {
                addDataRow([r.EquipmentModel, r.EqCount, (r.TotalHrs > 0 ? r.BCM / r.TotalHrs : 0).toFixed(0), (r.EqCount > 0 ? r.TotalHrs / r.EqCount : 0).toFixed(1), r.BCM], {}, secCSpans);
            });
            addDataRow(["Total", sectionC_Waste.reduce((s, r) => s + (r.EqCount || 0), 0), "-", "-", sectionC_Waste.reduce((s, r) => s + (r.BCM || 0), 0)], { bold: true, align: 'center', forceCenterFirst: true, bg: 'FFFDE047' }, secCSpans);

            currentRowIdx++;

            // SECTION D: HAULING SUMMARY
            ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "D. Hauling Equipment", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["COAL", null, null, "OB", null], 'FFBFDBFE', [3, 2, 3, 2, 3], { align: 'center', forceCenterFirst: true });

            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`); setCell(ws.getCell(`B${currentRowIdx}`), "Equip. Model", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`E${currentRowIdx}:F${currentRowIdx}`); setCell(ws.getCell(`E${currentRowIdx}`), "Trip", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`G${currentRowIdx}:I${currentRowIdx}`); setCell(ws.getCell(`G${currentRowIdx}`), "MT", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`J${currentRowIdx}:K${currentRowIdx}`); setCell(ws.getCell(`J${currentRowIdx}`), "Trip", { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`L${currentRowIdx}:N${currentRowIdx}`); setCell(ws.getCell(`L${currentRowIdx}`), "BCM", { bold: true, bg: 'FFBFDBFE' });
            for (let c = 2; c <= 14; c++) ws.getCell(currentRowIdx, c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            ws.getRow(currentRowIdx).height = 18;
            currentRowIdx++;

            const haulingModels = new Set([...sectionD_Coal.map(r => r.Equip), ...sectionD_Waste.map(r => r.Equip)]);
            Array.from(haulingModels).forEach((m) => {
                const c = sectionD_Coal.find(x => x.Equip === m) || {};
                const w = sectionD_Waste.find(x => x.Equip === m) || {};
                addDataRow([m, c.Trip || '-', c.MT, w.Trip || '-', w.BCM], {}, [3, 2, 3, 2, 3]);
            });

            addDataRow([
                "Total",
                sectionD_Coal.reduce((s, r) => s + (r.Trip || 0), 0),
                sectionD_Coal.reduce((s, r) => s + (r.MT || 0), 0),
                sectionD_Waste.reduce((s, r) => s + (r.Trip || 0), 0),
                sectionD_Waste.reduce((s, r) => s + (r.BCM || 0), 0)
            ], { bold: true, align: 'right', bg: 'FFFDE047', forceCenterFirst: true }, [3, 2, 3, 2, 3]);

            currentRowIdx++;

            // SECTION E: DUMP WISE
            ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "E. Dump Wise Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["Dump", "Coal Trips", "Coal Qty(MT)", "OB Trips", "OB BCM"], 'FFBFDBFE', [3, 2, 3, 2, 3]);

            const dumps = new Set([...sectionE_Coal.map(r => r.DumpWise), ...sectionE_Waste.map(r => r.DumpWise)]);
            Array.from(dumps).forEach(d => {
                const c = sectionE_Coal.find(x => x.DumpWise === d) || {};
                const w = sectionE_Waste.find(x => x.DumpWise === d) || {};
                addDataRow([d, c.Trips || '-', c.MT || '-', w.Trips || '-', w.BCM || '-'], {}, [3, 2, 3, 2, 3]);
            });

            addDataRow([
                "Total",
                sectionE_Coal.reduce((s, r) => s + (r.Trips || 0), 0) || '-',
                sectionE_Coal.reduce((s, r) => s + (r.MT || 0), 0) || '-',
                sectionE_Waste.reduce((s, r) => s + (r.Trips || 0), 0) || '-',
                sectionE_Waste.reduce((s, r) => s + (r.BCM || 0), 0) || '-'
            ], { bold: true, bg: 'FFFDE047' }, [3, 2, 3, 2, 3]);

            currentRowIdx++;

            // SECTION F: CRUSHING DETAILS
            const secFSpans = [1, 3, 2, 3, 2, 2]; // Total 13 (1+3+2+3+2+2)
            ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "F. Crushing Details (1150 TPH)", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["Sl No", "EQUIPMENT", "Hrs", "Qty", "Budget", "Actual"], 'FFBFDBFE', secFSpans);
            if (crushingDetails && crushingDetails.length > 0) {
                crushingDetails.forEach((r, i) => {
                    addDataRow([i + 1, r.EquipmentName || '-', r.RunningHr, r.TotalQty, r.Budget, r.Actual], {}, secFSpans);
                });
            } else {
                ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
                setCell(ws.getCell(`B${currentRowIdx}`), "No Data", { border: true });
                ws.getRow(currentRowIdx).height = 18;
                currentRowIdx++;
            }

            currentRowIdx++;

            // SECTION G: DEWATERING
            const secGSpans = [2, 6, 5]; // Total 13
            ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "G. Dewatering Pump Details :", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(["Sl No", "Pump", "Rn Hr"], 'FFBFDBFE', secGSpans);
            if (dewateringDetails && dewateringDetails.length > 0) {
                dewateringDetails.forEach((r, i) => {
                    addDataRow([i + 1, r.Pump || '-', r.RunHr], {}, secGSpans);
                });
            } else {
                ws.mergeCells(`B${currentRowIdx}:N${currentRowIdx}`);
                setCell(ws.getCell(`B${currentRowIdx}`), "No Data", { border: true });
                ws.getRow(currentRowIdx).height = 18;
                currentRowIdx++;
            }

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `ShiftReport_${date}_${shiftName}.xlsx`);
            toast.success("Excel exported successfully!");
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Shift Report</h1>
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
                        className={styles.select}
                        value={shiftId}
                        onChange={(e) => setShiftId(e.target.value)}
                    >
                        <option value="">-- Select --</option>
                        {shifts.map(s => (
                            <option key={s.SlNo} value={s.SlNo}>{s.ShiftName}</option>
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
                    <ShiftReportTable
                        data={reportData}
                        date={date}
                        shiftName={shifts.find(s => s.SlNo == shiftId)?.ShiftName || ''}
                    />
                </div>
            )}
        </div>
    );
}
