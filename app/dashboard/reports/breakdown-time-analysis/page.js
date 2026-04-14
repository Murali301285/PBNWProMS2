"use client";
import { useState } from 'react';
import styles from './BreakdownTime.module.css'; // Will create CSS module
import BreakdownTimeAnalysisTable from './BreakdownTimeAnalysisTable';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function BreakdownTimeAnalysisPage() {
    const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [filter, setFilter] = useState({
        fromDate: firstDayStr,
        toDate: todayStr
    });

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!filter.fromDate || !filter.toDate) return toast.error('Please select both dates');

        setLoading(true);
        setData(null);

        try {
            const res = await fetch('/api/reports/breakdown-time-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filter)
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                toast.success('Report Generated');
            } else {
                toast.error(result.message || 'Failed to fetch');
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
        document.title = `Breakdown_Time_Analysis_${filter.fromDate}_to_${filter.toDate}`;
        setTimeout(() => {
            window.print();
            setTimeout(() => { document.title = originalTitle; }, 500);
        }, 500);
    };

    // Excel export logic similar to other reports

    const handleExportExcel = async () => {
        if (!data || data.length === 0) {
            toast.error("No data to export");
            return;
        }

        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Breakdown Time Analysis');

            const columns = [
                { header: 'SlNo', accessor: 'SlNo' },
        { header: 'Date', accessor: 'Date', type: 'date' },
                { header: 'Shift', accessor: 'ShiftName' },
                { header: 'Shift Change (Min)', accessor: 'ShiftChange' },
                { header: 'Break/Tea (Min)', accessor: 'BreakTeaTime' },
                { header: 'Blasting (Min)', accessor: 'Blasting' },
                { header: 'Others (Min)', accessor: 'Others' },
                { header: 'Total Break (Min)', accessor: 'TotalBreakMinutes' },
                { header: 'Total Working (Hrs)', accessor: 'TotalWorkingHours' }
            ];

            const maxColSpan = columns.length;

            // 1. Calculate max widths for dynamic columns
            const maxColWidths = {};
            columns.forEach(col => {
                const textCols = ['ShiftName'];
                if (textCols.includes(col.accessor)) {
                    let maxLen = col.header.length;
                    data.forEach((row, rIdx) => {
                        let val = row[col.accessor];
                        if (val !== null && val !== undefined) {
                            const len = String(val).length;
                            if (len > maxLen) maxLen = len;
                        }
                    });
                    maxColWidths[col.accessor] = Math.min(Math.max((maxLen * 1.2) + 2, 12), 80);
                }
            });

            // 2. Custom width assignment
            ws.columns = Array(maxColSpan + 1).fill(0).map((_, i) => {
                if (i === 0) return { width: 3 }; // Padding

                const colDef = columns[i - 1];
                let w = 15;
                if (colDef) {
                    if (colDef.accessor === 'SlNo') w = 8;
                    else if (maxColWidths[colDef.accessor]) {
                        w = maxColWidths[colDef.accessor];
                    }
                }
                return { width: w };
            });

            // 3. Freeze panes (freeze headers only, no horizontal column freeze)
            ws.views = [
                { state: 'frozen', xSplit: 0, ySplit: 6 } // Freeze row 6 (headers), no columns
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

            ws.mergeCells(`B2:${endColLetter}2`);
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:${endColLetter}3`);
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:${endColLetter}4`);
            setCell(ws.getCell('B4'), "Breakdown Time Analysis Report", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(`B5:${endColLetter}5`);
            let fDate = filter.fromDate, tDate = filter.toDate;
            if (fDate && fDate.includes('-')) fDate = fDate ? new Date(fDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';
            if (tDate && tDate.includes('-')) tDate = tDate ? new Date(tDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';

            const dateStr = `From Date: ${fDate || '-'}        To Date: ${tDate || '-'}`;
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
            columns.forEach((col, i) => {
                setCell(rowHeader.getCell(i + 2), col.header, { bold: true, bg: 'FFBFDBFE' });
            });
            rowHeader.height = 35;
            currentRowIdx++;

            // Data Rows
            let totalShiftChange = 0;
            let totalBreakTea = 0;
            let totalBlasting = 0;
            let totalOthers = 0;
            let totalBreakMinutes = 0;
            let totalWorkingHours = 0;

            data.forEach((row, rIdx) => {
                const dataRow = ws.getRow(currentRowIdx);

                totalShiftChange += Number(row.ShiftChange || 0);
                totalBreakTea += Number(row.BreakTeaTime || 0);
                totalBlasting += Number(row.Blasting || 0);
                totalOthers += Number(row.Others || 0);
                totalBreakMinutes += Number(row.TotalBreakMinutes || 0);
                totalWorkingHours += Number(row.TotalWorkingHours || 0);

                columns.forEach((col, cIdx) => {
                    let val = row[col.accessor];

                    if (col.accessor === 'SlNo') val = rIdx + 1;

                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null && col.accessor !== 'Date' && col.accessor !== 'ShiftName') {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';

                        // Treat WorkingHours with 2 decimals precisely
                        if (['TotalWorkingHours'].includes(col.accessor)) {
                            nFmt = '0.00';
                            if (val % 1 === 0) nFmt = '0.00';
                        }
                    }

                    const isLeftAlign = ['ShiftName'].includes(col.accessor);

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, {
                        numFmt: nFmt,
                        align: isLeftAlign ? 'left' : 'center'
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            // Add Footer Row
            const footerRow = ws.getRow(currentRowIdx);
            setCell(footerRow.getCell(2), '', { bg: 'FFE5E7EB' });
            setCell(footerRow.getCell(3), '', { bg: 'FFE5E7EB' });
            setCell(footerRow.getCell(4), 'Total', { bold: true, bg: 'FFE5E7EB', align: 'right' });
            setCell(footerRow.getCell(5), totalShiftChange === 0 ? '0' : totalShiftChange, { numFmt: '#,##0', bg: 'FFE5E7EB', bold: true });
            setCell(footerRow.getCell(6), totalBreakTea === 0 ? '0' : totalBreakTea, { numFmt: '#,##0', bg: 'FFE5E7EB', bold: true });
            setCell(footerRow.getCell(7), totalBlasting === 0 ? '0' : totalBlasting, { numFmt: '#,##0', bg: 'FFE5E7EB', bold: true });
            setCell(footerRow.getCell(8), totalOthers === 0 ? '0' : totalOthers, { numFmt: '#,##0', bg: 'FFE5E7EB', bold: true });
            setCell(footerRow.getCell(9), totalBreakMinutes === 0 ? '0' : totalBreakMinutes, { numFmt: '#,##0', bg: 'FFE5E7EB', bold: true });
            setCell(footerRow.getCell(10), totalWorkingHours === 0 ? '0' : totalWorkingHours, { numFmt: '0.00', bg: 'FFE5E7EB', bold: true });
            footerRow.height = 20;

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Breakdown_Time_Analysis_${(fDate || '').replace(/\//g, '-')}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };


    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Breakdown Time Analysis Report</h1>
            </div>

            <div className={styles.filterContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>From Date</label>
                    <input type="date" className={styles.input} value={filter.fromDate} onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })} />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>To Date</label>
                    <input type="date" className={styles.input} value={filter.toDate} onChange={(e) => setFilter({ ...filter, toDate: e.target.value })} />
                </div>
                <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
                    {loading ? 'Loading...' : 'Show Report'}
                </button>
                <div style={{ flex: 1 }}></div>
                {data && (
                    <>
                        <button onClick={handlePrint} className={styles.actionBtn}><Printer size={16} /> Print</button>
                        <button onClick={handleExportExcel} className={`${styles.actionBtn} ${styles.excel}`}><Download size={16} /> Excel</button>
                    </>
                )}
            </div>

            {data && (
                <div className={styles.reportSheet} id="print-area">
                    <BreakdownTimeAnalysisTable data={data} loading={loading} filter={filter} />
                </div>
            )}
        </div>
    );
}
