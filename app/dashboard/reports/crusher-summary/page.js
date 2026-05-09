'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Download, Printer } from 'lucide-react';
import styles from './CrusherSummary.module.css';
import CrusherSummaryTable from './CrusherSummaryTable';
import * as XLSX from 'xlsx-js-style';

export default function CrusherSummaryPage() {
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
            const res = await fetch('/api/reports/crusher-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            const result = await res.json();
            if (result.success) {
                setReportData(result);
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
        document.title = `Crusher_Summary_Report_${date}`;
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

            const { data, meta } = reportData;
            const { shiftNames } = meta;

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Crusher Summary');

            // 1. Column Widths
            const cols = [
                { width: 3 },  // A (padding)
                { width: 8 },  // B (Sl No)
                { width: 20 }, // C (Details/Plant Name)
                { width: 14 }  // D (Running Hour)
            ];

            // Add columns for dynamic shifts
            for (let i = 0; i < shiftNames.length; i++) {
                cols.push({ width: 14 }); // E, F, G...
            }

            // Add remaining static columns
            cols.push(
                { width: 18 }, // Cum Prod FTD
                { width: 12 }, // Cum TPH
                { width: 18 }, // Cum Prod FTM
                { width: 22 }  // Prod YTD
            );

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

            const lastDataCol = 4 + shiftNames.length + 4; // A + Sl.No, Details, RunHr + Shifts + 4 metrics
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
            setCell(ws.getCell('B2'), (process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"), { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:${lastDataColLetter}3`);
            setCell(ws.getCell('B3'), (process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"), { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:${lastDataColLetter}4`);
            setCell(ws.getCell('B4'), "CRUSHER PRODUCTION REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

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

            // Formatters
            const fmtQty = '#,##0.00';
            const fmtHr = '#,##0.00';
            const fmtInt = '#,##0';

            // 3. Table 1 Headers
            const headerRow1 = ws.getRow(7);
            headerRow1.height = 30;
            const header1 = [
                "Sl.No.", "Details", "Running Hour Actuals for the day",
                ...shiftNames,
                "Cum Production FTD", "Cum TPH FTD", "Cum Production FTM", "Production YTD 25-26"
            ];

            header1.forEach((h, i) => {
                setCell(ws.getCell(7, i + 2), h, { bold: true, bg: 'FFEAEAEA' });
            });

            // Freeze panes
            ws.views = [
                { state: 'frozen', xSplit: 0, ySplit: 7 }
            ];

            // 4. Data Rows for Table 1
            let currentRow = 8;

            const totalProdShift = {};
            shiftNames.forEach(s => totalProdShift[s] = 0);

            const totals = data.reduce((acc, row) => {
                acc.RunningHr += row.RunningHr || 0;
                acc.ProdFTD += row.ProductionQty || 0;
                acc.ProdFTM += row.ProdFTM || 0;
                acc.ProdYTD += row.ProdYTD || 0;

                shiftNames.forEach(s => {
                    totalProdShift[s] += (row.shifts[s] || 0);
                });

                acc.monthlyCumRHR += row.monthlyCumRHR || 0;
                acc.prodFromBSR += row.monthlyCumBSR || 0;

                return acc;
            }, {
                RunningHr: 0, ProdFTD: 0, ProdFTM: 0, ProdYTD: 0,
                monthlyCumRHR: 0, prodFromBSR: 0
            });

            data.forEach((row, i) => {
                let currentStartCol = 2; // Col B
                const cumTphFtd = row.RunningHr > 0 ? (row.ProductionQty / row.RunningHr) : 0;

                setCell(ws.getCell(currentRow, currentStartCol++), i + 1, { align: 'center' });
                setCell(ws.getCell(currentRow, currentStartCol++), row.PlantName, { align: 'left' });
                setCell(ws.getCell(currentRow, currentStartCol++), row.RunningHr, { numFmt: fmtHr, align: 'right' });

                shiftNames.forEach(s => {
                    setCell(ws.getCell(currentRow, currentStartCol++), row.shifts[s] || 0, { numFmt: fmtQty, align: 'right' });
                });

                setCell(ws.getCell(currentRow, currentStartCol++), row.ProductionQty, { numFmt: fmtQty, align: 'right' });
                setCell(ws.getCell(currentRow, currentStartCol++), cumTphFtd, { numFmt: fmtInt, align: 'right' });
                setCell(ws.getCell(currentRow, currentStartCol++), row.ProdFTM, { numFmt: fmtQty, align: 'right' });
                setCell(ws.getCell(currentRow, currentStartCol++), row.ProdYTD, { numFmt: fmtQty, align: 'right' });

                currentRow++;
            });

            // Totals Table 1
            ws.getRow(currentRow).height = 20;
            let currentStartCol = 2;
            const totalTphFtd = totals.RunningHr > 0 ? (totals.ProdFTD / totals.RunningHr) : 0;

            setCell(ws.getCell(currentRow, currentStartCol++), "Total", { bold: true, align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, currentStartCol++), "", { bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, currentStartCol++), totals.RunningHr, { bold: true, numFmt: fmtHr, align: 'right', bg: 'FFF5F5F5' });

            shiftNames.forEach(s => {
                setCell(ws.getCell(currentRow, currentStartCol++), totalProdShift[s] || 0, { bold: true, numFmt: fmtQty, align: 'right', bg: 'FFF5F5F5' });
            });

            setCell(ws.getCell(currentRow, currentStartCol++), totals.ProdFTD, { bold: true, numFmt: fmtQty, align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, currentStartCol++), totalTphFtd, { bold: true, numFmt: fmtInt, align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, currentStartCol++), totals.ProdFTM, { bold: true, numFmt: fmtQty, align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, currentStartCol++), totals.ProdYTD, { bold: true, numFmt: fmtQty, align: 'right', bg: 'FFF5F5F5' });

            currentRow += 2; // Empty row space

            // 5. Table 2 Headers
            const headerRow2 = ws.getRow(currentRow);
            headerRow2.height = 30;
            const header2 = [
                "Sl.No.", "Details", "Month Starting HMR", "As on Date Closing HMR", "Monthly cum RHR",
                "Month Starting BSR", "As on Date Closing BSR", "Monthly cum BSR", "AVG TPH FTM", "Budget FTM"
            ];

            header2.forEach((h, i) => {
                setCell(ws.getCell(currentRow, i + 2), h, { bold: true, bg: 'FFEAEAEA' });
            });
            currentRow++;

            // Body Table 2
            data.forEach((row, i) => {
                let startCol = 2;
                setCell(ws.getCell(currentRow, startCol++), i + 1, { align: 'center' });
                setCell(ws.getCell(currentRow, startCol++), row.PlantName, { align: 'left' });
                setCell(ws.getCell(currentRow, startCol++), row.HMR?.MonthStartingHMR || 0, { numFmt: fmtHr, align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.HMR?.AsonDateClosingHMR || 0, { numFmt: fmtHr, align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.monthlyCumRHR || 0, { numFmt: fmtHr, align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.HMR?.MonthStartingBSR || 0, { numFmt: fmtInt, align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.HMR?.AsonDateClosingBSR || 0, { numFmt: fmtInt, align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.monthlyCumBSR || 0, { numFmt: fmtQty, align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.avgTphFtm || 0, { numFmt: fmtInt, align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.budgetFtm || 0, { numFmt: fmtInt, align: 'right' });
                currentRow++;
            });

            // Totals Table 2
            ws.getRow(currentRow).height = 20;
            let startCol = 2;
            setCell(ws.getCell(currentRow, startCol++), "Total Production", { bold: true, align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, startCol++), "", { bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, startCol++), "", { bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, startCol++), "", { bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, startCol++), "", { bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, startCol++), "", { bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, startCol++), "", { bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, startCol++), totals.prodFromBSR, { bold: true, numFmt: fmtQty, align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, startCol++), "", { bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, startCol++), "-", { bold: true, align: 'center', bg: 'FFF5F5F5' });

            currentRow += 2; // Footer spacing

            // 6. Generate file
            const buf = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `ProMS_Crusher_Summary_Dated_${date}.xlsx`);
            toast.success("Excel Downloaded Successfully");

        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("Failed to export Excel");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Crusher Summary Report</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>Daily production and performance summary</p>
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
                    <CrusherSummaryTable
                        data={reportData.data}
                        meta={reportData.meta}
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
