'use client';
import { useState } from 'react';
import styles from '../daily-production/DailyProduction.module.css';
import HaulingTripTable from './HaulingTripTable';
import { Printer, Download } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

export default function HaulingTripPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleShowReport = async () => {
        if (!date) {
            alert("Please select Date");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/hauling-model-trip-hr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
            } else {
                setError(result.message || 'Failed to fetch report');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    const handleExportExcel = async () => {
        if (!reportData || reportData.length === 0) {
            alert("No data available to export.");
            return;
        }

        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const dateObj = new Date(date);
            const displayDate = dateObj.toLocaleDateString('en-GB');
            const monthName = dateObj.toLocaleString('default', { month: 'short' }) + "'" + dateObj.getFullYear().toString().slice(-2);

            const daysUpToSelected = dateObj.getDate();
            const dates = Array.from({ length: daysUpToSelected }, (_, i) => i + 1);

            // Reshape logic
            const obMap = {};
            const coalMap = {};
            reportData.forEach(row => {
                const cat = row.MaterialCategory;
                const model = row.ModelName;
                if (cat === 'OB') {
                    if (!obMap[model]) obMap[model] = [];
                    obMap[model].push(row);
                } else if (cat === 'Coal') {
                    if (!coalMap[model]) coalMap[model] = [];
                    coalMap[model].push(row);
                }
            });
            const grouped = {
                OB: Object.keys(obMap).sort().map(m => ({ model: m, data: obMap[m] })),
                Coal: Object.keys(coalMap).sort().map(m => ({ model: m, data: coalMap[m] }))
            };

            const getModelData = (modelData, day) => {
                const row = modelData.find(d => new Date(d.Date).getDate() === day);
                return row || { TotalTrips: 0, TotalQty: 0, TotalHrs: 0 };
            };
            const calcTripHr = (trips, hrs) => (hrs > 0 ? trips / hrs : 0);

            const calcAvg = (modelsList, day, type) => {
                let sumNum = 0;
                let sumDenom = 0;
                modelsList.forEach(m => {
                    const rd = getModelData(m.data, day);
                    if (type === 'TripHr') { sumNum += rd.TotalTrips; sumDenom += rd.TotalHrs; }
                    else { sumNum += rd.TotalQty; }
                });
                if (type === 'TripHr') return sumDenom > 0 ? sumNum / sumDenom : 0;
                return sumNum;
            };

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Hauling Trip-Hr');

            // Columns setup (Model column + all days + MTD)
            const cols = [
                { width: 3 },  // A: Padding
                { width: 30 }  // B: Model
            ];
            dates.forEach(() => cols.push({ width: 8 })); // Day cols
            cols.push({ width: 14 }); // MTD
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
                if (opts.numFmt) cell.numFmt = opts.numFmt;
            };

            const lastColIdx = 2 + dates.length + 1; // Pad + Model + Days + MTD
            const getColLetter = (colIndex) => {
                let temp, letter = '';
                while (colIndex > 0) {
                    temp = (colIndex - 1) % 26;
                    letter = String.fromCharCode(temp + 65) + letter;
                    colIndex = (colIndex - temp - 1) / 26;
                }
                return letter;
            };
            const lastDataColLetter = getColLetter(lastColIdx);

            // 1. App Headers
            ws.getRow(1).height = 15;
            ws.mergeCells(`B2:${lastDataColLetter}2`);
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:${lastDataColLetter}3`);
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:${lastDataColLetter}4`);
            setCell(ws.getCell('B4'), "HAULING MODEL WISE TRIP/HR", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 160, height: 60 }
                });
            }

            ws.mergeCells('B5:D5');
            setCell(ws.getCell('B5'), `Date: ${displayDate}`, { bold: true, align: 'left', border: false });
            ws.getRow(6).height = 10;

            let currentRow = 7;
            const fmtDec1 = '#,##0.0';
            const fmtDec0 = '#,##0';

            // Shared logic for Table render
            const renderTable = (title, type) => {
                // Table Title Row
                ws.mergeCells(`B${currentRow}:${lastDataColLetter}${currentRow}`);
                setCell(ws.getCell(currentRow, 2), `${title} ${monthName}`, { bold: true, align: 'left', border: true, fontSize: 12, color: 'FF1D4ED8' });
                currentRow++;

                // Table Headers
                setCell(ws.getCell(currentRow, 2), "Model", { bold: true, bg: 'FFF1F5F9' });
                let cIdx = 3;
                dates.forEach(d => setCell(ws.getCell(currentRow, cIdx++), d, { bold: true, bg: 'FFF1F5F9' }));
                setCell(ws.getCell(currentRow, cIdx), "MTD", { bold: true, bg: 'FFE2E8F0' });
                currentRow++;

                // Helper for data rows
                const renderRow = (modelName, modelRows) => {
                    let mtdTrips = 0, mtdQty = 0, mtdHrs = 0;
                    setCell(ws.getCell(currentRow, 2), modelName, { align: 'left' });
                    let idx = 3;
                    dates.forEach(day => {
                        const rd = getModelData(modelRows, day);
                        mtdTrips += rd.TotalTrips; mtdQty += rd.TotalQty; mtdHrs += rd.TotalHrs;

                        const val = type === 'TripHr' ? calcTripHr(rd.TotalTrips, rd.TotalHrs) : rd.TotalQty;
                        setCell(ws.getCell(currentRow, idx++), val, { numFmt: type === 'TripHr' ? fmtDec1 : fmtDec0, align: 'right' });
                    });
                    const mtdVal = type === 'TripHr' ? calcTripHr(mtdTrips, mtdHrs) : mtdQty;
                    setCell(ws.getCell(currentRow, idx), mtdVal, { numFmt: type === 'TripHr' ? fmtDec1 : fmtDec0, align: 'right', bold: true, bg: 'FFF8FAFC' });
                    currentRow++;
                };

                // Helper for average/total rows
                const renderAvgRow = (label, modelsList) => {
                    let mtdNum = 0, mtdDenom = 0;
                    setCell(ws.getCell(currentRow, 2), label, { align: 'left', bold: true, bg: 'FFFACC15' }); // Yellow bg
                    let idx = 3;
                    dates.forEach(day => {
                        const val = calcAvg(modelsList, day, type);
                        modelsList.forEach(m => {
                            const rd = getModelData(m.data, day);
                            if (type === 'TripHr') { mtdNum += rd.TotalTrips; mtdDenom += rd.TotalHrs; }
                            else { mtdNum += rd.TotalQty; }
                        });
                        setCell(ws.getCell(currentRow, idx++), val, { numFmt: type === 'TripHr' ? fmtDec1 : fmtDec0, align: 'right', bold: true, bg: 'FFFACC15' });
                    });
                    const mtdVal = type === 'TripHr' ? (mtdDenom > 0 ? mtdNum / mtdDenom : 0) : mtdNum;
                    setCell(ws.getCell(currentRow, idx), mtdVal, { numFmt: type === 'TripHr' ? fmtDec1 : fmtDec0, align: 'right', bold: true, bg: 'FFFACC15' });
                    currentRow++;
                };

                // Render OB
                grouped.OB.forEach(m => renderRow(m.model, m.data));
                renderAvgRow(type === 'TripHr' ? "Average OB" : "Total OB", grouped.OB);

                // Render Coal
                grouped.Coal.forEach(m => renderRow(m.model, m.data));
                renderAvgRow(type === 'TripHr' ? "Average Coal" : "Total Coal", grouped.Coal);

                currentRow += 2; // Spacer
            };

            // Render both tables
            renderTable("Hauling Model Wise Trip / Hr.", "TripHr");
            renderTable("Hauling Model Wise Quantity", "Qty");

            // Freeze panes to lock company header and dates row (approx row 8)
            ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 8 }];

            const buf = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `ProMS_Hauling_Trip_Hr_${date}.xlsx`);
            toast.success("Excel Downloaded Successfully");

        } catch (error) {
            console.error("Excel Export Error:", error);
            alert("Failed to export Excel");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Hauling Model Wise Trip/Hr</h1>
            </div>

            <div className={styles.filterContainer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <button
                        className={styles.generateBtn}
                        onClick={handleShowReport}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Show Report'}
                    </button>
                </div>

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
                    <HaulingTripTable data={reportData} date={date} />
                </div>
            )}
        </div>
    );
}
