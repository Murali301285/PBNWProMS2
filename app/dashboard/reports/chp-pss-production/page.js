'use client';
import { useState, useEffect, useMemo } from 'react';
import styles from './ChpPssProduction.module.css';
import ChpPssProductionTable from './ChpPssProductionTable';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

export default function ChpPssProductionPage() {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(currentMonth);
    const [plantId, setPlantId] = useState('');
    const [plantList, setPlantList] = useState([]);

    const [reportData, setReportData] = useState(null); // { production, stoppages, allReasons }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Plants
    useEffect(() => {
        async function fetchPlants() {
            try {
                const res = await fetch('/api/master/plant');
                const data = await res.json();

                if (Array.isArray(data)) {
                    const validPlants = data.filter(p => !p.IsDelete && p.IsActive);
                    setPlantList(validPlants);
                } else {
                    console.error("Invalid Plant data format", data);
                }
            } catch (e) {
                console.error("Failed to load plants", e);
            }
        }
        fetchPlants();
    }, []);

    const handleShowReport = async () => {
        if (!month || !plantId) {
            toast.error("Please select Month and Plant");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/chp-pss-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, plantId })
            });
            const result = await response.json();
            if (result.success) {
                setReportData({ production: result.production, stoppages: result.stoppages, allReasons: result.allReasons });
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
        if (!reportData) return;
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const { production, stoppages, allReasons } = reportData;
            const monthObj = new Date(month + "-01");
            const monthName = monthObj.toLocaleString('default', { month: 'long', year: 'numeric' });

            // Determine distinct reasons
            let distinctReasons = [];
            if (allReasons && allReasons.length > 0) {
                distinctReasons = allReasons.map(r => r.BDReasonName);
            } else {
                const reasons = new Set();
                stoppages.forEach(s => {
                    if (s.ReasonName) reasons.add(s.ReasonName);
                });
                distinctReasons = Array.from(reasons).sort();
            }

            // Merge Data by Date
            const daysInMonth = new Date(monthObj.getFullYear(), monthObj.getMonth() + 1, 0).getDate();
            const mergedData = [];

            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(monthObj.getFullYear(), monthObj.getMonth(), i);
                const matchDate = (dataRow) => {
                    const rowDate = new Date(dataRow.WorkDate);
                    return rowDate.getDate() === i && rowDate.getMonth() === monthObj.getMonth();
                };

                const prodRow = production.find(matchDate) || {};
                const stopRows = stoppages.filter(matchDate);

                const stopMap = {};
                let totalStopHrs = 0;

                distinctReasons.forEach(r => {
                    const entry = stopRows.find(s => s.ReasonName === r);
                    const hrs = entry ? entry.StoppageHours : 0;
                    stopMap[r] = hrs;
                    totalStopHrs += hrs;
                });

                const runHr = prodRow.RunningHr || 0;
                const totalDay = 24.00;
                const idleHr = Math.max(0, totalDay - (runHr + totalStopHrs));

                mergedData.push({
                    date: d,
                    prod: prodRow.ProductionQty || 0,
                    tph: prodRow.TPH_Calculated || 0,
                    runHr: runHr,
                    stopMap,
                    totalStopHrs,
                    idleHr,
                    totalDay,
                    units: prodRow.PowerKWH || 0,
                });
            }

            // Calculate Grand Totals
            const grand = mergedData.reduce((acc, r) => {
                acc.prod += r.prod;
                acc.runHr += r.runHr;
                acc.totalStopHrs += r.totalStopHrs;
                acc.idleHr += r.idleHr;
                acc.totalDay += r.totalDay;
                acc.units += r.units;

                distinctReasons.forEach(reason => {
                    acc.stopMap[reason] = (acc.stopMap[reason] || 0) + (r.stopMap[reason] || 0);
                });

                return acc;
            }, { prod: 0, runHr: 0, totalStopHrs: 0, idleHr: 0, totalDay: 0, units: 0, stopMap: {} });

            grand.tph = grand.prod > 0 ? grand.prod / 18.9 : 0;

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('CHP PSS Production');

            // 1. Column Widths Setup 
            // A(padding)=3, B(Date)=14, C(Prod)=20, D(TPH)=12, E(RunHr)=16
            // F... onwards are dynamic reasons (14 each)
            // Following 5 summary columns (18 each)
            const dynamicColsCount = distinctReasons.length;
            const totalCols = 5 + dynamicColsCount + 6; // Padding + 4 fixed + reasons + 5 summary + remarks

            const cols = [
                { width: 3 },  // A
                { width: 14 }, // B: Date
                { width: 22 }, // C: Plant Total Production
                { width: 12 }, // D: TPH
                { width: 16 }  // E: Running Hours
            ];

            for (let i = 0; i < dynamicColsCount; i++) {
                cols.push({ width: 16 }); // Dynamic Reason Columns
            }

            cols.push(
                { width: 20 }, // Total Breakdown Hrs
                { width: 18 }, // Total Idle Hour
                { width: 18 }, // Total Stoppage
                { width: 18 }, // Total Day Hour
                { width: 22 }, // Total Unit Consumption
                { width: 20 }  // Remarks
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

            // Get the last column letter for merging headers based on dynamic column length
            const getColLetter = (colIndex) => {
                let temp, letter = '';
                while (colIndex > 0) {
                    temp = (colIndex - 1) % 26;
                    letter = String.fromCharCode(temp + 65) + letter;
                    colIndex = (colIndex - temp - 1) / 26;
                }
                return letter;
            };
            const lastDataColLetter = getColLetter(totalCols);

            // 2. Headers
            ws.getRow(1).height = 15; // Empty padding row

            ws.mergeCells(`B2:${lastDataColLetter}2`);
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:${lastDataColLetter}3`);
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:${lastDataColLetter}4`);
            setCell(ws.getCell('B4'), "CHP PSS PRODUCTION REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 160, height: 60 }
                });
            }

            const monthStr = `Month: ${monthName}`;
            ws.mergeCells(`B5:D5`);
            setCell(ws.getCell('B5'), monthStr, { bold: true, align: 'left', border: false });

            // Plant Name
            const plantName = plantList?.find(p => p.SlNo == plantId)?.Name || '';
            ws.mergeCells(`E5:H5`);
            if (plantName) {
                setCell(ws.getCell('E5'), `Plant: ${plantName}`, { bold: true, align: 'left', border: false });
            }

            // 3. Table Headers
            const headerRow = ws.getRow(6);
            if (distinctReasons.length > 5) {
                headerRow.height = 45; // Taller for reason headers if needed
            } else {
                headerRow.height = 30;
            }

            const headers = [
                "Date", "Plant Total Production", "TPH", "Running Hours",
                ...distinctReasons,
                "Total Breakdown Hrs", "Total Idle Hour", "Total Stoppage", "Total Day Hour", "Total Unit Consumption", "Remarks"
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
            let currentRow = 7;
            const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

            mergedData.forEach((row) => {
                let startCol = 2; // Col B

                setCell(ws.getCell(currentRow, startCol++), fmtDate(row.date));
                setCell(ws.getCell(currentRow, startCol++), row.prod, { numFmt: '#,##0.00', align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.tph, { numFmt: '#,##0', align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.runHr, { numFmt: '#,##0.00', align: 'right' });

                distinctReasons.forEach(reason => {
                    setCell(ws.getCell(currentRow, startCol++), row.stopMap[reason] || 0, { numFmt: '#,##0.00', align: 'right' });
                });

                setCell(ws.getCell(currentRow, startCol++), row.totalStopHrs, { numFmt: '#,##0.00', align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.idleHr, { numFmt: '#,##0.00', align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.totalStopHrs, { numFmt: '#,##0.00', align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.totalDay, { numFmt: '#,##0.00', align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), row.units, { numFmt: '#,##0', align: 'right' });
                setCell(ws.getCell(currentRow, startCol++), ""); // Remarks

                currentRow++;
            });

            // 5. Grand Total Footer
            ws.getRow(currentRow).height = 20;
            let footCol = 2;
            setCell(ws.getCell(currentRow, footCol++), "Grand Total", { bold: true, align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, footCol++), grand.prod, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, footCol++), grand.tph, { bold: true, numFmt: '#,##0', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, footCol++), grand.runHr, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });

            distinctReasons.forEach(reason => {
                setCell(ws.getCell(currentRow, footCol++), grand.stopMap[reason] || 0, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            });

            setCell(ws.getCell(currentRow, footCol++), grand.totalStopHrs, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, footCol++), grand.idleHr, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, footCol++), grand.totalStopHrs, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, footCol++), grand.totalDay, { bold: true, numFmt: '#,##0.00', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, footCol++), grand.units, { bold: true, numFmt: '#,##0', align: 'right', bg: 'FFF5F5F5' });
            setCell(ws.getCell(currentRow, footCol++), "", { bold: true, align: 'center', bg: 'FFF5F5F5' }); // Remarks

            // 6. Generate file
            const buf = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `ChpPssProduction_${month}.xlsx`);
            toast.success("Excel Downloaded Successfully");

        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("Failed to export Excel");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>CHP PSS Production Report</h1>
            </div>

            <div className={styles.filterContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Month</label>
                    <input
                        type="month"
                        className={styles.input}
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Plant</label>
                    <select
                        className={styles.select}
                        value={plantId}
                        onChange={(e) => setPlantId(e.target.value)}
                    >
                        <option value="">-- Select Plant --</option>
                        {plantList.map(p => (
                            <option key={p.SlNo} value={p.SlNo}>{p.Name}</option>
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
                    <ChpPssProductionTable
                        production={reportData.production}
                        stoppages={reportData.stoppages}
                        allReasons={reportData.allReasons}
                        month={month}
                    />
                </div>
            )}
        </div>
    );
}
