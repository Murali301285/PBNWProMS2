'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Download, Printer } from 'lucide-react';
import styles from './CrStoppageCumulative.module.css';
import CrStoppageCumulativeTable from './CrStoppageCumulativeTable';
import * as XLSX from 'xlsx-js-style';

export default function CrStoppageCumulativePage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const handleFetchReport = async () => {
        if (!date) {
            toast.error("Please select a date");
            return;
        }

        setLoading(true);
        setReportData(null);
        try {
            const res = await fetch('/api/reports/cr-stoppage-cumulative', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            const result = await res.json();
            if (result.success) {
                setReportData(result.data);
                toast.success("Report generated");
            } else {
                toast.error(result.message || "Failed to fetch report");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Crusher_Stoppage_Cumulative_Report_${date}`;
        setTimeout(() => {
            window.print();
            document.title = originalTitle;
        }, 500);
    };

    const handleExportExcel = async () => {
        if (!reportData) return;
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const { plants, metricsMap, stoppageRows, calculatedTotalStop } = reportData;

            const fmtDec2 = '#,##0.00';
            const fmtDec0 = '#,##0';
            const getMetric = (pId, key) => metricsMap[pId]?.[key] || 0;

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Stoppage Cumulative');

            // 1. Column Widths
            const cols = [
                { width: 3 },  // A: Padding
                { width: 8 },  // B: Sl No
                { width: 35 }, // C: Description
            ];

            // Dynamic width for each plant
            plants.forEach(() => {
                cols.push({ width: 14 }); // D, E, F...
            });

            ws.columns = cols;

            // Add Logo
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

            const lastDataCol = 3 + plants.length; // A + SlNo + Desc + Plants
            const getColLetter = (colIndex) => {
                let temp, letter = '';
                while (colIndex > 0) {
                    temp = (colIndex - 1) % 26;
                    letter = String.fromCharCode(temp + 65) + letter;
                    colIndex = (colIndex - temp - 1) / 26;
                }
                return letter;
            };
            const lastDataColLetter = getColLetter(lastDataCol);

            // 2. Headers
            ws.getRow(1).height = 15; // padding

            ws.mergeCells(`B2:${lastDataColLetter}2`);
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:${lastDataColLetter}3`);
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:${lastDataColLetter}4`);
            setCell(ws.getCell('B4'), "SHIFT COAL CRUSHING REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 160, height: 60 }
                });
            }

            ws.mergeCells('B5:D5');
            const fmtDate = date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';
            setCell(ws.getCell('B5'), `Date: ${fmtDate}`, { bold: true, align: 'left', border: false });

            // Space
            ws.getRow(6).height = 10;

            // 3. Table Headers
            const headerRow = ws.getRow(7);
            headerRow.height = 30;
            const headers = ["Sl.No.", "Description", ...plants.map(p => p.name)];

            headers.forEach((h, i) => {
                setCell(ws.getCell(7, i + 2), h, { bold: true, bg: 'FFEAEAEA' });
            });

            // Freeze panes
            ws.views = [
                { state: 'frozen', xSplit: 0, ySplit: 7 }
            ];

            // 4. Data Rows
            let currentRow = 8;
            let slNoCounter = 1;

            const addMetricRow = (label, key, isInt = false, isBold = false, bg = null) => {
                let currentStartCol = 2; // Col B
                setCell(ws.getCell(currentRow, currentStartCol++), label ? slNoCounter++ : "", { align: 'center', bold: isBold, bg: bg });
                setCell(ws.getCell(currentRow, currentStartCol++), label || "REMARKS:-", { align: 'left', bold: isBold, bg: bg });

                plants.forEach(p => {
                    const val = getMetric(p.id, key);
                    setCell(ws.getCell(currentRow, currentStartCol++), val, {
                        numFmt: isInt ? fmtDec0 : fmtDec2,
                        align: 'right',
                        bold: isBold,
                        bg: bg
                    });
                });
                currentRow++;
            };

            // Basic Times
            addMetricRow("Apron Starting. Hour", "startingHour", false);
            addMetricRow("Apron Closing Hour", "closingHour", false);

            // Total Running (Light Blue equivalent, using light gray for cleanliness)
            addMetricRow("Total Running Hour", "runningHr", false, true, "FFF5F5F5");

            // Stoppages
            stoppageRows.forEach(r => {
                let startCol = 2;
                setCell(ws.getCell(currentRow, startCol++), slNoCounter++, { align: 'center' });
                setCell(ws.getCell(currentRow, startCol++), r.reason, { align: 'left' });

                plants.forEach(p => {
                    setCell(ws.getCell(currentRow, startCol++), r.values[p.id] || 0, { numFmt: fmtDec2, align: 'right' });
                });
                currentRow++;
            });

            // Total Stoppage (Light Yellow equivalent, using distinct styling)
            let startCol = 2;
            setCell(ws.getCell(currentRow, startCol++), slNoCounter++, { align: 'center', bold: true, bg: 'FFFFFCCC' });
            setCell(ws.getCell(currentRow, startCol++), "Total stoppage Hour", { align: 'left', bold: true, bg: 'FFFFFCCC' });
            plants.forEach(p => {
                setCell(ws.getCell(currentRow, startCol++), calculatedTotalStop[p.id] || 0, { numFmt: fmtDec2, align: 'right', bold: true, bg: 'FFFFFCCC' });
            });
            currentRow++;

            // Total Shift Hour
            addMetricRow("", "totalShiftHour", false, true, "FFF5F5F5");

            // Remarks
            startCol = 2;
            setCell(ws.getCell(currentRow, startCol++), "", { align: 'center' });
            setCell(ws.getCell(currentRow, startCol++), "REMARKS:-", { align: 'left', bold: true });
            plants.forEach(p => {
                setCell(ws.getCell(currentRow, startCol++), getMetric(p.id, "remarks") || "", { align: 'left' });
            });
            currentRow++;

            // Space at bottom
            ws.getRow(currentRow).height = 10;

            // 6. Generate file
            const buf = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `Crusher_Stoppage_Cumulative_Report_${date}.xlsx`);
            toast.success("Excel Downloaded Successfully");

        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("Failed to export Excel");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Crusher Stoppage Cumulative Report</h1>
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
                    onClick={handleFetchReport}
                    disabled={loading}
                    className={styles.generateBtn}
                >
                    {loading && <Loader2 className="animate-spin h-4 w-4 inline mr-2" />}
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

            {reportData && (
                <div className={styles.reportSheet} id="print-area">
                    <CrStoppageCumulativeTable
                        data={reportData}
                        date={date}
                    />
                </div>
            )}

            {!reportData && !loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flex: 1, padding: '50px' }}>
                    Select a date and click Show Report
                </div>
            )}
        </div>
    );
}
