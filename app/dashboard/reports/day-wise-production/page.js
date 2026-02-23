
'use client';

import { useState } from 'react';
import styles from '../daily-production/DailyProduction.module.css';
import DayWiseProductionTable from './DayWiseProductionTable';
import { Toaster, toast } from 'sonner';
import { Loader2, Printer, Download } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function DayWiseProductionPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleShowReport = async () => {
        if (!date) {
            toast.error("Please select a Date");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/day-wise-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
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
            const ws = wb.addWorksheet('Day Wise Production');

            // 1. Column Widths Setup (A is padding, B-L are data columns)
            ws.columns = [
                { width: 3 },  // A (padding)
                { width: 14 }, // B: Date
                { width: 14 }, // C: Coal
                { width: 14 }, // D: OB
                { width: 18 }, // E: Total Prod
                { width: 14 }, // F: Dispatch
                { width: 14 }, // G: HSD
                { width: 14 }, // H: Ltr/BCM
                { width: 14 }, // I: HEMM Lead
                { width: 14 }, // J: Mid Scale Lead
                { width: 14 }, // K: OB Lead KM
                { width: 14 }  // L: Coal Lead KM
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

            // 2. Headers
            ws.getRow(1).height = 15; // Empty padding row

            ws.mergeCells('B2:L2');
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells('B3:L3');
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells('B4:L4');
            setCell(ws.getCell('B4'), "DAY WISE PRODUCTION REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 160, height: 60 }
                });
            }

            const activeDateObj = new Date(date);
            const reportMonth = activeDateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

            ws.mergeCells('B5:D5');
            setCell(ws.getCell('B5'), `Month: ${reportMonth}`, { bold: true, align: 'left', border: false });

            ws.mergeCells('H5:L5');
            setCell(ws.getCell('H5'), `Date: ${date}`, { bold: true, align: 'right', border: false });

            // 3. Table Headers
            const headerRow = ws.getRow(6);
            headerRow.height = 30;

            const headers = [
                "Date", "Coal (MT)", "OB (BCM)", "Total Production (BCM)", "Dispatch (MT)",
                "HSD (Ltr)", "Ltr/BCM", "HEMM Lead", "Mid Scale Lead", "OB Lead KM", "Coal Lead KM"
            ];

            headers.forEach((h, i) => {
                const cell = ws.getCell(6, i + 2); // B is 2
                setCell(cell, h, { bold: true, bg: 'FFEAEAEA' });
            });

            // Freeze panes
            ws.views = [
                { state: 'frozen', xSplit: 0, ySplit: 6 } // Freeze top 6 rows
            ];

            // 4. Data Rows
            let grandCoal = 0;
            let grandOB = 0;
            let grandTotal = 0;
            let grandDispatch = 0;

            let currentRow = 7;
            const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

            reportData.forEach((row) => {
                const coal = row.Coal_MT || 0;
                const ob = row.OB_BCM || 0;
                const total = row.TotalProduction_BCM || 0;
                const dispatch = row.Dispatch_MT || 0;

                grandCoal += coal;
                grandOB += ob;
                grandTotal += total;
                grandDispatch += dispatch;

                // Set Data Cells
                setCell(ws.getCell(currentRow, 2), fmtDate(row.Date));
                setCell(ws.getCell(currentRow, 3), coal, { numFmt: '#,##0.00', align: 'right' });
                setCell(ws.getCell(currentRow, 4), ob, { numFmt: '#,##0.00', align: 'right' });
                setCell(ws.getCell(currentRow, 5), total, { numFmt: '#,##0.00', align: 'right' });
                setCell(ws.getCell(currentRow, 6), dispatch, { numFmt: '#,##0.00', align: 'right' });
                setCell(ws.getCell(currentRow, 7), "-", { align: 'center' }); // HSD
                setCell(ws.getCell(currentRow, 8), "-", { align: 'center' }); // Ltr/BCM
                setCell(ws.getCell(currentRow, 9), "-", { align: 'center' }); // HEMM Lead
                setCell(ws.getCell(currentRow, 10), "-", { align: 'center' }); // Mid Scale Lead
                setCell(ws.getCell(currentRow, 11), "-", { align: 'center' }); // OB Lead KM
                setCell(ws.getCell(currentRow, 12), "-", { align: 'center' }); // Coal Lead KM

                currentRow++;
            });

            // 5. Grand Total Footer
            ws.getRow(currentRow).height = 20;
            setCell(ws.getCell(currentRow, 2), "Grand Total", { bold: true, align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 3), grandCoal, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 4), grandOB, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 5), grandTotal, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 6), grandDispatch, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 7), "-", { bold: true, align: 'center', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 8), "-", { bold: true, align: 'center', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 9), "-", { bold: true, align: 'center', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 10), "-", { bold: true, align: 'center', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 11), "-", { bold: true, align: 'center', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, 12), "-", { bold: true, align: 'center', bg: 'FFF5F5F5' });

            // 6. Generate file
            const buf = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `DayWiseProduction_${date}.xlsx`);
            toast.success("Excel Downloaded Successfully");

        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("Failed to export Excel");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Day Wise Production Report</h1>
            </div>

            <div className={styles.filterContainer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
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
                </div>

                {/* Right Side Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handlePrint}
                        disabled={!reportData}
                        className={`${styles.actionBtn} ${!reportData ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Printer size={16} /> Print
                    </button>
                    <button
                        onClick={handleExportExcel}
                        disabled={!reportData}
                        className={`${styles.actionBtn} ${styles.excel} ${!reportData ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Download size={16} /> Excel
                    </button>
                </div>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {reportData && (
                <div className={styles.reportSheet} id="print-area">
                    <DayWiseProductionTable data={reportData} date={date} />
                </div>
            )}
        </div>
    );
}

