'use client';
import { useState } from 'react';
import styles from './ElectricalMonitoring.module.css';
import ElectricalMonitoringTable from './ElectricalMonitoringTable';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';

export default function ElectricalMonitoringPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleShowReport = async () => {
        if (!date) {
            toast.error("Please select Date");
            return;
        }
        setLoading(true);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/electrical-monitoring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
                if (!result.data || result.data.length === 0) {
                    toast.info("No data found for the selected date.");
                }
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while fetching the report.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    // Placeholder for Excel Export - Logic to be moved to Table or kept here if data is handy.
    // For now, I'll keep the button but trigger the alert or move logic later if needed.
    // Actually, usually buttons are here. I will pass the handleExportExcel trigger to the table?
    // Or better, implement it here if I have data. 
    // The previous implementation had it in the table. 
    // DailyProgress has it in the Page. Redesign dictates sticking to DailyProgress pattern.
    // I will implement a stub for now or better, keep it simple.
    // Let's keep the logic in the page if possible.
    const handleExportExcel = async () => {
        if (!reportData || reportData.length === 0) {
            toast.info("No data available to export.");
            return;
        }
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const dateObj = new Date(date);
            const dayOfMonth = dateObj.getDate();
            const displayDate = dateObj.toLocaleDateString('en-GB');

            // Pre-process data
            const processedData = reportData.map(row => {
                const ftdHrs = row.FTD_WorkingHr || 0;
                const ftdTrips = row.FTD_Trips || 0;
                const ftdQty = row.FTD_Qty || 0;
                const ftmHrs = row.FTM_WorkingHr || 0;
                const ftmTrips = row.FTM_Trips || 0;
                const ftmQty = row.FTM_Qty || 0;

                const ftdTripsHr = ftdHrs > 0 ? ftdTrips / ftdHrs : 0;
                const ftdBCMHr = ftdHrs > 0 ? ftdQty / ftdHrs : 0;
                const ftmTripsHr = ftmHrs > 0 ? ftmTrips / ftmHrs : 0;
                const ftmBCMHr = ftmHrs > 0 ? ftmQty / ftmHrs : 0;

                const dom = row.DayOfMonth || dayOfMonth || 1;
                const mtdAvgBCMDay = ftmQty / dom;

                return {
                    ...row,
                    metrics: { ftdTripsHr, ftdBCMHr, ftmTripsHr, ftmBCMHr, mtdAvgBCMDay }
                };
            });

            const grand = reportData.reduce((acc, r) => ({
                ftdHrs: acc.ftdHrs + (r.FTD_WorkingHr || 0),
                ftdTrips: acc.ftdTrips + (r.FTD_Trips || 0),
                ftdQty: acc.ftdQty + (r.FTD_Qty || 0),
                ftmHrs: acc.ftmHrs + (r.FTM_WorkingHr || 0),
                ftmTrips: acc.ftmTrips + (r.FTM_Trips || 0),
                ftmQty: acc.ftmQty + (r.FTM_Qty || 0),
            }), { ftdHrs: 0, ftdTrips: 0, ftdQty: 0, ftmHrs: 0, ftmTrips: 0, ftmQty: 0 });

            const grandFtdTripsHr = grand.ftdHrs > 0 ? grand.ftdTrips / grand.ftdHrs : 0;
            const grandFtdBCMHr = grand.ftdHrs > 0 ? grand.ftdQty / grand.ftdHrs : 0;
            const grandFtmTripsHr = grand.ftmHrs > 0 ? grand.ftmTrips / grand.ftmHrs : 0;
            const grandFtmBCMHr = grand.ftmHrs > 0 ? grand.ftmQty / grand.ftmHrs : 0;
            const grandMtdAvg = grand.ftmQty / (dayOfMonth || 1);

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Electrical Equipments');

            // 1. Columns Setup
            ws.columns = [
                { width: 3 },  // A: Padding
                { width: 8 },  // B: Sl No
                { width: 22 }, // C: Equipment
                { width: 15 }, // D: Sector
                { width: 14 }, // E: Target Trip/Hr
                { width: 14 }, // F: Achieved Trip/Hr (FTD)
                { width: 14 }, // G: Achieved Trip/Hr (MTD)
                { width: 14 }, // H: Target BCM/Hr
                { width: 14 }, // I: Achieved BCM/Hr (FTD)
                { width: 14 }, // J: Achieved BCM/Hr (MTD)
                { width: 14 }, // K: Target Unit/Hr
                { width: 14 }, // L: Achieved Unit/Hr (FTD)
                { width: 14 }, // M: Achieved Unit/Hr (MTD)
                { width: 15 }, // N: Target Unit/BCM
                { width: 15 }, // O: Achieved Unit/BCM (FTD)
                { width: 15 }, // P: Achieved Unit/BCM (MTD)
                { width: 15 }, // Q: Total BCM (FTD)
                { width: 15 }, // R: Total BCM (MTD)
                { width: 15 }, // S: Total BCM (FTY)
                { width: 18 }, // T: MTD Average BCM/Day
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
            ws.getRow(1).height = 15;

            ws.mergeCells(`B2:T2`);
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:T3`);
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:T4`);
            setCell(ws.getCell('B4'), "ELECTRICAL EQUIPMENTS MONITORING REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 160, height: 60 }
                });
            }

            ws.mergeCells('B5:D5');
            setCell(ws.getCell('B5'), `Date: ${displayDate}`, { bold: true, align: 'left', border: false });

            // Space
            ws.getRow(6).height = 10;

            // 3. Table Headers (Multi-row complexity)
            ws.getRow(7).height = 25;
            ws.getRow(8).height = 25;

            // Group 1: Basics (Row span 2)
            ws.mergeCells('B7:B8'); setCell(ws.getCell('B7'), "Sl. No.", { bold: true, bg: 'FFDBEAFE' });
            ws.mergeCells('C7:C8'); setCell(ws.getCell('C7'), "Equipment", { bold: true, bg: 'FFDBEAFE', align: 'left' });
            ws.mergeCells('D7:D8'); setCell(ws.getCell('D7'), "Sector", { bold: true, bg: 'FFDBEAFE' });

            // Group 2: Trip/Hr
            ws.mergeCells('E7:E8'); setCell(ws.getCell('E7'), "Target Trip/Hr", { bold: true, bg: 'FFF1F5F9', color: 'FF4338CA' });
            ws.mergeCells('F7:G7'); setCell(ws.getCell('F7'), "Achieved Trip/Hr", { bold: true, bg: 'FFFFFBEB' });
            setCell(ws.getCell('F8'), "FTD", { bold: true, bg: 'FFFFFFFF' });
            setCell(ws.getCell('G8'), "MTD", { bold: true, bg: 'FFFFFFFF' });

            // Group 3: BCM/Hr
            ws.mergeCells('H7:H8'); setCell(ws.getCell('H7'), "Target BCM/Hr", { bold: true, bg: 'FFF1F5F9', color: 'FF4338CA' });
            ws.mergeCells('I7:J7'); setCell(ws.getCell('I7'), "Achieved BCM/Hr", { bold: true, bg: 'FFFFFBEB' });
            setCell(ws.getCell('I8'), "FTD", { bold: true, bg: 'FFFFFFFF' });
            setCell(ws.getCell('J8'), "MTD", { bold: true, bg: 'FFFFFFFF' });

            // Group 4: Unit/Hr
            ws.mergeCells('K7:K8'); setCell(ws.getCell('K7'), "Target Unit/Hr", { bold: true, bg: 'FFF1F5F9', color: 'FF4338CA' });
            ws.mergeCells('L7:M7'); setCell(ws.getCell('L7'), "Achieved Unit/Hr", { bold: true, bg: 'FFFFFBEB' });
            setCell(ws.getCell('L8'), "FTD", { bold: true, bg: 'FFFFFFFF' });
            setCell(ws.getCell('M8'), "MTD", { bold: true, bg: 'FFFFFFFF' });

            // Group 5: Unit/BCM
            ws.mergeCells('N7:N8'); setCell(ws.getCell('N7'), "Target Unit/BCM", { bold: true, bg: 'FFF1F5F9', color: 'FF4338CA' });
            ws.mergeCells('O7:P7'); setCell(ws.getCell('O7'), "Achieved Unit/BCM", { bold: true, bg: 'FFFFFBEB' });
            setCell(ws.getCell('O8'), "FTD", { bold: true, bg: 'FFFFFFFF' });
            setCell(ws.getCell('P8'), "MTD", { bold: true, bg: 'FFFFFFFF' });

            // Group 6: Total BCM
            ws.mergeCells('Q7:S7'); setCell(ws.getCell('Q7'), "Total BCM", { bold: true, bg: 'FFFEF3C7' });
            setCell(ws.getCell('Q8'), "FTD", { bold: true, bg: 'FFFFFFFF' });
            setCell(ws.getCell('R8'), "MTD", { bold: true, bg: 'FFFFFFFF' });
            setCell(ws.getCell('S8'), "FTY", { bold: true, bg: 'FFFFFFFF' });

            // Group 7: MTD Avg
            ws.mergeCells('T7:T8'); setCell(ws.getCell('T7'), "MTD Average BCM/Day", { bold: true, bg: 'FFFFFFFF' });

            // Freeze panes
            ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 8 }];

            let currentRow = 9;
            const fmtDec2 = '#,##0.00';
            const fmt0 = '#,##0';

            // Data Mapping
            processedData.forEach((r, idx) => {
                let startCol = 2;
                setCell(ws.getCell(currentRow, startCol++), idx + 1, { align: 'center' });
                setCell(ws.getCell(currentRow, startCol++), r.EquipmentName, { align: 'left', bold: true });
                setCell(ws.getCell(currentRow, startCol++), r.SectorName, { align: 'center', color: 'FF475569' });

                // Trip/Hr
                setCell(ws.getCell(currentRow, startCol++), "-", { align: 'center', bg: 'FFF8FAFC', color: 'FF4338CA', bold: true });
                setCell(ws.getCell(currentRow, startCol++), r.metrics.ftdTripsHr, { numFmt: fmtDec2, align: 'right', color: 'FF1D4ED8', bold: true });
                setCell(ws.getCell(currentRow, startCol++), r.metrics.ftmTripsHr, { numFmt: fmtDec2, align: 'right', bold: true, color: 'FF1E293B' });

                // BCM/Hr
                setCell(ws.getCell(currentRow, startCol++), "-", { align: 'center', bg: 'FFF8FAFC', color: 'FF4338CA', bold: true });
                setCell(ws.getCell(currentRow, startCol++), r.metrics.ftdBCMHr, { numFmt: fmtDec2, align: 'right', color: 'FF1D4ED8', bold: true });
                setCell(ws.getCell(currentRow, startCol++), r.metrics.ftmBCMHr, { numFmt: fmtDec2, align: 'right', bold: true, color: 'FF1E293B' });

                // Unit/Hr
                setCell(ws.getCell(currentRow, startCol++), "-", { align: 'center', bg: 'FFF8FAFC', color: 'FF4338CA', bold: true });
                setCell(ws.getCell(currentRow, startCol++), "-", { align: 'center' });
                setCell(ws.getCell(currentRow, startCol++), "-", { align: 'center' });

                // Unit/BCM
                setCell(ws.getCell(currentRow, startCol++), "-", { align: 'center', bg: 'FFF8FAFC', color: 'FF4338CA', bold: true });
                setCell(ws.getCell(currentRow, startCol++), "-", { align: 'center' });
                setCell(ws.getCell(currentRow, startCol++), "-", { align: 'center' });

                // Total BCM
                setCell(ws.getCell(currentRow, startCol++), r.FTD_Qty, { numFmt: fmt0, align: 'right', bold: true });
                setCell(ws.getCell(currentRow, startCol++), r.FTM_Qty, { numFmt: fmt0, align: 'right', bold: true });
                setCell(ws.getCell(currentRow, startCol++), "-", { align: 'center', bold: true, color: 'FF94A3B8' });

                // MTD Avg
                setCell(ws.getCell(currentRow, startCol++), r.metrics.mtdAvgBCMDay, { numFmt: fmtDec2, align: 'right', bold: true });

                currentRow++;
            });

            // Grand Total
            ws.mergeCells(`B${currentRow}:D${currentRow}`);
            setCell(ws.getCell(currentRow, 2), "Total", { align: 'center', bold: true, bg: 'FFFDE047' }); // Yellow tone
            // The merged cells need borders and bg manually since they are grouped
            setCell(ws.getCell(currentRow, 3), "", { border: true, bg: 'FFFDE047' });
            setCell(ws.getCell(currentRow, 4), "", { border: true, bg: 'FFFDE047' });

            let tCol = 5;
            // Trip/Hr Total
            setCell(ws.getCell(currentRow, tCol++), "-", { align: 'center', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), grandFtdTripsHr, { numFmt: fmtDec2, align: 'right', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), grandFtmTripsHr, { numFmt: fmtDec2, align: 'right', bg: 'FFFDE047', bold: true });

            // BCM/Hr Total
            setCell(ws.getCell(currentRow, tCol++), "-", { align: 'center', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), grandFtdBCMHr, { numFmt: fmtDec2, align: 'right', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), grandFtmBCMHr, { numFmt: fmtDec2, align: 'right', bg: 'FFFDE047', bold: true });

            // Unit/Hr
            setCell(ws.getCell(currentRow, tCol++), "-", { align: 'center', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), "-", { align: 'center', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), "-", { align: 'center', bg: 'FFFDE047', bold: true });

            // Unit/BCM
            setCell(ws.getCell(currentRow, tCol++), "-", { align: 'center', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), "-", { align: 'center', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), "-", { align: 'center', bg: 'FFFDE047', bold: true });

            // Total BCM
            setCell(ws.getCell(currentRow, tCol++), grand.ftdQty, { numFmt: fmt0, align: 'right', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), grand.ftmQty, { numFmt: fmt0, align: 'right', bg: 'FFFDE047', bold: true });
            setCell(ws.getCell(currentRow, tCol++), "-", { align: 'center', bg: 'FFFDE047', bold: true });

            // MTD Avg
            setCell(ws.getCell(currentRow, tCol++), grandMtdAvg, { numFmt: fmtDec2, align: 'right', bg: 'FFFDE047', bold: true });

            const buf = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `ProMS_Electrical_Equipments_Monitoring_${date}.xlsx`);
            toast.success("Excel Downloaded Successfully");

        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("Failed to export Excel");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Electrical Equipments Monitoring</h1>
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
                    <ElectricalMonitoringTable data={reportData} date={date} />
                </div>
            )}
        </div>
    );
}
