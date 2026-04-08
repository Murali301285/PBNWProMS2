"use client";
import React, { useState } from 'react';
import DailyProgressTable from './DailyProgressTable';
import { toast } from 'sonner';
import { Download, Printer, FileText } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import styles from './DailyProgressPage.module.css';

export default function DailyProgressPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleShowReport = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/reports/daily-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });
            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
                if (result.data.production.length === 0) {
                    toast.info("No data found for the selected date.");
                }
            } else {
                toast.error(result.message || "Failed to fetch report");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("An error occurred while fetching the report.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Daily_Progress_Report_${date}`;
        setTimeout(() => {
            window.print();
            setTimeout(() => { document.title = originalTitle; }, 500);
        }, 500);
    };

    // Export Logic
    const handleExportExcel = async () => {
        if (!reportData) return;
        const { production, drilling, blasting, crusher, headerInfo } = reportData;
        let displayDate = date;
        if (displayDate && displayDate.includes('-')) {
            const [y, m, d] = displayDate.split('-');
            displayDate = `${d}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m, 10) - 1]}-${y}`;
        } else {
            displayDate = headerInfo?.Date || '-';
        }

        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Daily Progress');

            ws.columns = [
                { width: 3 },  // A (padding)
                { width: 8 },  // B (Sl No.)
                { width: 30 }, // C (Material / Plant)
                { width: 15 }, // D
                { width: 15 }, // E
                { width: 15 }, // F
                { width: 15 }, // G
                { width: 15 }, // H
                { width: 15 }, // I
                { width: 15 }, // J
                { width: 15 }, // K
                { width: 15 }, // L
                { width: 15 }, // M
                { width: 15 }, // N
                { width: 15 }  // O
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

            ws.mergeCells('B2:O2');
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells('B3:O3');
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells('B4:O4');
            setCell(ws.getCell('B4'), "DAILY PROGRESS REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells('B5:O5');
            setCell(ws.getCell('B5'), `Date: ${displayDate}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.mergeCells('B6:O6');
            setCell(ws.getCell('B6'), `Conversion Factor: ${headerInfo?.ConversionFactor || '1.55'}`, { align: 'center', border: false, fontSize: 11 });

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

            const addDataRow = (values, opts = {}, colSpans = []) => {
                const row = ws.getRow(currentRowIdx);
                let colIdx = 2; // Start from B
                for (let i = 0; i < values.length; i++) {
                    const val = values[i];
                    const spanCount = colSpans[i] || 1;

                    if (spanCount > 1) {
                        const startLet = ws.getColumn(colIdx).letter;
                        const endLet = ws.getColumn(colIdx + spanCount - 1).letter;
                        ws.mergeCells(`${startLet}${currentRowIdx}:${endLet}${currentRowIdx}`);
                    }

                    const cell = row.getCell(colIdx);
                    const cOpts = { ...opts };
                    if (i === 1 && !opts.bold && !opts.align) cOpts.align = 'left';
                    // Set native number formatting for exceljs
                    if (val !== null && typeof val === 'number') {
                        cOpts.numFmt = '#,##0.00';
                        if (val % 1 === 0) cOpts.numFmt = '#,##0';
                        if (val === 0) cOpts.numFmt = '0';
                    }
                    setCell(cell, val, cOpts);

                    if (spanCount > 1) {
                        for (let s = 1; s < spanCount; s++) {
                            row.getCell(colIdx + s).border = {
                                top: { style: 'thin' }, left: { style: 'thin' },
                                bottom: { style: 'thin' }, right: { style: 'thin' }
                            };
                        }
                    }
                    colIdx += spanCount;
                }
                row.height = opts.height || 18;
                currentRowIdx++;
            };

            const fmt = (val) => {
                if (val === null || val === undefined || val === '') return '-';
                const num = Number(String(val).replace(/,/g, ''));
                if (isNaN(num)) return val;
                return num;
            };

            const calculateTotal = (dataArr, fields) => {
                return dataArr.reduce((acc, row) => {
                    fields.forEach(f => {
                        const valStr = String(row[f] || '').replace(/,/g, '');
                        const num = Number(valStr);
                        acc[f] = (acc[f] || 0) + (isNaN(num) ? 0 : num);
                    });
                    return acc;
                }, {});
            };

            // --- Production Details ---
            ws.mergeCells(`B${currentRowIdx}:O${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "PRODUCTION DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Sl No.", "Material", "Unit", "For The Day", "For The Month", "For The Year"], { bold: true, bg: 'FFBFDBFE' }, [1, 1, 1, 2, 2, 2]);
            addDataRow(["", "", "", "Trips", "Qty", "Trips", "Qty", "Trips", "Qty"], { bold: true, bg: 'FFF3F4F6' });
            // Re-merge top headers where they span vertically for aesthetics
            ws.mergeCells(`B${currentRowIdx - 2}:B${currentRowIdx - 1}`);
            ws.mergeCells(`C${currentRowIdx - 2}:C${currentRowIdx - 1}`);
            ws.mergeCells(`D${currentRowIdx - 2}:D${currentRowIdx - 1}`);

            production.forEach(row => {
                let displayMaterial = row.MaterialName;
                if (displayMaterial === 'Waste') displayMaterial = 'OB';
                if (displayMaterial === 'TOTAL WASTE') displayMaterial = 'TOTAL OB';

                addDataRow([
                    row.SlNo,
                    displayMaterial,
                    row.Unit,
                    fmt(row.DayTrip),
                    fmt(row.DayQty),
                    fmt(row.MonthTrip),
                    fmt(row.MonthQty),
                    fmt(row.YearTrip),
                    fmt(row.YearQty)
                ]);
            });

            currentRowIdx++;

            // --- Drilling Details ---
            const drillTotals = calculateTotal(drilling, ['Holes_FTD', 'Holes_MTD', 'Holes_YTD', 'Drilling_FTD', 'Drilling_MTD', 'Drilling_YTD', 'Hrs_FTD', 'Hrs_MTD', 'Hrs_YTD']);
            ws.mergeCells(`B${currentRowIdx}:O${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "DRILLING DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Sl No.", "Material Type", "No. of Holes Drilled", "Drilled Meters", "Total Hrs", "Meters/Hr"], { bold: true, bg: 'FFBFDBFE' }, [1, 1, 3, 3, 3, 3]);
            addDataRow(["", "", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD"], { bold: true, bg: 'FFF3F4F6' });
            ws.mergeCells(`B${currentRowIdx - 2}:B${currentRowIdx - 1}`);
            ws.mergeCells(`C${currentRowIdx - 2}:C${currentRowIdx - 1}`);

            drilling.forEach(row => {
                addDataRow([
                    row.SlNo,
                    row.MaterialType,
                    fmt(row.Holes_FTD), fmt(row.Holes_MTD), fmt(row.Holes_YTD),
                    fmt(row.Drilling_FTD), fmt(row.Drilling_MTD), fmt(row.Drilling_YTD),
                    fmt(row.Hrs_FTD), fmt(row.Hrs_MTD), fmt(row.Hrs_YTD),
                    null, null, null
                ]);
            });

            if (drilling.length > 0) {
                addDataRow([
                    "TOTAL", null,
                    fmt(drillTotals.Holes_FTD), fmt(drillTotals.Holes_MTD), fmt(drillTotals.Holes_YTD),
                    fmt(drillTotals.Drilling_FTD), fmt(drillTotals.Drilling_MTD), fmt(drillTotals.Drilling_YTD),
                    fmt(drillTotals.Hrs_FTD), fmt(drillTotals.Hrs_MTD), fmt(drillTotals.Hrs_YTD),
                    null, null, null
                ], { bold: true, bg: 'FFF3F4F6' }, [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
                ws.getCell(`B${currentRowIdx - 1}`).alignment = { horizontal: 'left', vertical: 'middle' };
            }

            currentRowIdx++;

            // --- Blasting Details ---
            const blastTotals = calculateTotal(blasting, ['Holes_FTD', 'Holes_MTD', 'Holes_YTD', 'Exp_FTD', 'Exp_MTD', 'Exp_YTD', 'TotalVolume_FTD', 'TotalVolume_MTD', 'TotalVolume_YTD']);
            ws.mergeCells(`B${currentRowIdx}:O${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "BLASTING DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Sl No.", "No. of Holes", "Total Explosive Used", "Blasted Volume", "Powder Factor"], { bold: true, bg: 'FFBFDBFE' }, [1, 3, 3, 3, 3]);
            addDataRow(["", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD"], { bold: true, bg: 'FFF3F4F6' });
            ws.mergeCells(`B${currentRowIdx - 2}:B${currentRowIdx - 1}`);

            blasting.forEach(row => {
                addDataRow([
                    row.SlNo,
                    fmt(row.Holes_FTD), fmt(row.Holes_MTD), fmt(row.Holes_YTD),
                    fmt(row.Exp_FTD), fmt(row.Exp_MTD), fmt(row.Exp_YTD),
                    fmt(row.TotalVolume_FTD), fmt(row.TotalVolume_MTD), fmt(row.TotalVolume_YTD),
                    fmt(row.PowderFactor_FTD), fmt(row.PowderFactor_MTD), fmt(row.PowderFactor_YTD),
                ]);
            });

            if (blasting.length > 0) {
                addDataRow([
                    "TOTAL",
                    fmt(blastTotals.Holes_FTD), fmt(blastTotals.Holes_MTD), fmt(blastTotals.Holes_YTD),
                    fmt(blastTotals.Exp_FTD), fmt(blastTotals.Exp_MTD), fmt(blastTotals.Exp_YTD),
                    fmt(blastTotals.TotalVolume_FTD), fmt(blastTotals.TotalVolume_MTD), fmt(blastTotals.TotalVolume_YTD),
                    null, null, null
                ], { bold: true, bg: 'FFF3F4F6' });
                ws.getCell(`B${currentRowIdx - 1}`).alignment = { horizontal: 'left', vertical: 'middle' };
            }

            currentRowIdx++;

            // --- Crusher Details ---
            const crusherTotals = calculateTotal(crusher, ['Hrs_FTD', 'Hrs_MTD', 'Hrs_YTD', 'Qty_FTD', 'Qty_MTD', 'Qty_YTD', 'KWH_FTD', 'KWH_MTD', 'KWH_YTD']);
            ws.mergeCells(`B${currentRowIdx}:O${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "CRUSHER PRODUCTION", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Plant", "Hrs Run", "Production Qty.", "KWH", "KWH/Hrs"], { bold: true, bg: 'FFBFDBFE' }, [1, 3, 3, 3, 3]);
            addDataRow(["", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD"], { bold: true, bg: 'FFF3F4F6' });
            ws.mergeCells(`B${currentRowIdx - 2}:B${currentRowIdx - 1}`);

            crusher.forEach(row => {
                addDataRow([
                    row.Plant,
                    fmt(row.Hrs_FTD), fmt(row.Hrs_MTD), fmt(row.Hrs_YTD),
                    fmt(row.Qty_FTD), fmt(row.Qty_MTD), fmt(row.Qty_YTD),
                    fmt(row.KWH_FTD), fmt(row.KWH_MTD), fmt(row.KWH_YTD),
                    fmt(row.KWH_HR_FTD), fmt(row.KWH_HR_MTD), fmt(row.KWH_HR_YTD),
                ]);
            });

            if (crusher.length > 0) {
                addDataRow([
                    "TOTAL",
                    fmt(crusherTotals.Hrs_FTD), fmt(crusherTotals.Hrs_MTD), fmt(crusherTotals.Hrs_YTD),
                    fmt(crusherTotals.Qty_FTD), fmt(crusherTotals.Qty_MTD), fmt(crusherTotals.Qty_YTD),
                    fmt(crusherTotals.KWH_FTD), fmt(crusherTotals.KWH_MTD), fmt(crusherTotals.KWH_YTD),
                    null, null, null
                ], { bold: true, bg: 'FFF3F4F6' });
                ws.getCell(`B${currentRowIdx - 1}`).alignment = { horizontal: 'left', vertical: 'middle' };
            }

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Daily_Progress_Report_${displayDate.replace(/\//g, '-')}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };


    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Daily Progress Report</h1>

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

                <button
                    onClick={handleShowReport}
                    disabled={loading}
                    className={styles.generateBtn}
                >
                    {loading ? 'Generating...' : 'Show Report'}
                </button>

                {reportData?.headerInfo?.ConversionFactor && (
                    <div className="ml-4 font-semibold text-blue-600 flex items-center">
                        BCM Conversion Factor : {reportData.headerInfo.ConversionFactor}
                    </div>
                )}

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

            {reportData && (
                <div className={styles.reportSheet} id="print-area">
                    <DailyProgressTable data={reportData} date={date} />
                </div>
            )}
        </div>
    );
}
