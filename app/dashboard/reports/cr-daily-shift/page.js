"use client"
import React, { useState } from 'react';
import styles from './CrDailyShift.module.css';
import CrDailyShiftTable from './CrDailyShiftTable';
import { toast } from 'sonner';
import { Printer, Download } from 'lucide-react';

export default function CrDailyShiftReport() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleShowReport = async () => {
        if (!date) {
            toast.error("Please select a date");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/reports/cr-daily-shift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            const json = await res.json();

            if (json.success) {
                setData(json.data);
                toast.success("Report loaded successfully");
            } else {
                toast.error(json.message || "Failed to load report");
                setData(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Crusher_Daily_Shift_Report_${date}`;
        setTimeout(() => {
            window.print();
            document.title = originalTitle;
        }, 500);
    };

    const handleExportExcel = async () => {
        if (!data || data.length === 0) return;
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Daily Shift Report');

            // Find max plants across shifts to set columns
            let maxPlants = [];
            data.forEach(s => {
                if (s.plants && s.plants.length > maxPlants.length) {
                    maxPlants = s.plants;
                }
            });

            const cols = [
                { width: 3 },   // A: Padding
                { width: 14 },  // B: Sl No / Shift Name
                { width: 35 },  // C: Description
            ];
            maxPlants.forEach(() => cols.push({ width: 14 })); // D, E... (Plants)
            cols.push({ width: 18 }); // Extra column for shift total
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
                if (opts.numFmt) {
                    cell.numFmt = opts.numFmt;
                }
            };

            const lastColIdx = 3 + maxPlants.length + 1; // B + C + Plants + Total
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

            // Headers
            ws.getRow(1).height = 15;

            ws.mergeCells(`B2:${lastDataColLetter}2`);
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:${lastDataColLetter}3`);
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:${lastDataColLetter}4`);
            setCell(ws.getCell('B4'), "CRUSHER DAILY SHIFT REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 160, height: 60 }
                });
            }

            ws.mergeCells('B5:D5');
            const fmtDate = date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';
            setCell(ws.getCell('B5'), `Date: ${fmtDate}`, { bold: true, align: 'left', border: false });

            let currentRow = 7;

            const fmtDec2 = '#,##0.00';
            const fmtDec0 = '#,##0';
            const fmtQty = '#,##0.000';

            data.forEach(shift => {
                const plants = shift.plants;

                // Incharges Header
                ws.mergeCells(`B${currentRow}:${lastDataColLetter}${currentRow}`);
                const inchargeText = `Large Scale Incharge :- ${shift.largeIncharge || '-'}    |    Mid Scale Incharge :- ${shift.midIncharge || '-'}`;
                setCell(ws.getCell(currentRow, 2), inchargeText, { bold: true, align: 'left', bg: 'FFF0F0F0' });
                currentRow++;

                // Table Headers
                const hRow = ws.getRow(currentRow);
                hRow.height = 25;
                setCell(ws.getCell(currentRow, 2), `SHIFT - ${shift.name}`, { bold: true, bg: 'FFEAEAEA' });
                setCell(ws.getCell(currentRow, 3), "Description", { bold: true, bg: 'FFEAEAEA' });

                let pCol = 4;
                plants.forEach(p => {
                    setCell(ws.getCell(currentRow, pCol++), p.name, { bold: true, bg: 'FFEAEAEA' });
                });
                setCell(ws.getCell(currentRow, pCol), "Total", { bold: true, bg: 'FFEAEAEA' });
                currentRow++;

                let slNo = 1;

                const addRow = (desc, getValue, format, isBold = false, bg = null) => {
                    setCell(ws.getCell(currentRow, 2), slNo++, { align: 'center', bold: isBold, bg: bg });
                    setCell(ws.getCell(currentRow, 3), desc, { align: 'left', bold: isBold, bg: bg });
                    let col = 4;
                    plants.forEach(p => {
                        setCell(ws.getCell(currentRow, col++), getValue(p.id), { numFmt: format, align: 'right', bold: isBold, bg: bg });
                    });
                    // Empty col for total usually
                    setCell(ws.getCell(currentRow, col), "", { bg: bg });
                    currentRow++;
                };

                let timeFrom = "", timeTo = "";
                const sn = shift.name.toUpperCase();
                if (sn.includes('A')) { timeFrom = '6:00 am'; timeTo = '2:00 pm'; }
                else if (sn.includes('B')) { timeFrom = '2:00 pm'; timeTo = '10:00 pm'; }
                else if (sn.includes('C')) { timeFrom = '10:00 pm'; timeTo = '6:00 am'; }
                else { timeFrom = '8:30 am'; timeTo = '5:00 pm'; }

                setCell(ws.getCell(currentRow, 2), slNo++, { align: 'center' });
                setCell(ws.getCell(currentRow, 3), "Time From", { align: 'left' });
                let tCol = 4;
                plants.forEach(() => setCell(ws.getCell(currentRow, tCol++), timeFrom, { align: 'center' }));
                setCell(ws.getCell(currentRow, tCol), "");
                currentRow++;

                setCell(ws.getCell(currentRow, 2), slNo++, { align: 'center' });
                setCell(ws.getCell(currentRow, 3), "Time To", { align: 'left' });
                tCol = 4;
                plants.forEach(() => setCell(ws.getCell(currentRow, tCol++), timeTo, { align: 'center' }));
                setCell(ws.getCell(currentRow, tCol), "");
                currentRow++;

                addRow("S.B.S. Reading", (id) => shift.plantMetrics[id]?.SBS_Reading, fmtDec0);
                addRow("C.B.S. Reading", (id) => shift.plantMetrics[id]?.CBS_Reading, fmtDec0);

                addRow("Total Production In MT", (id) => shift.plantMetrics[id]?.TotalProductionMT, fmtQty, true, 'FFF5F5F5');

                addRow("No of Trip Unloaded", (id) => shift.plantMetrics[id]?.NoofTripUnloaded, fmtDec0);
                addRow("Apron Starting. Hour", (id) => shift.plantMetrics[id]?.ApronStartingHour, fmtDec2);
                addRow("Apron Closing Hour", (id) => shift.plantMetrics[id]?.ApronClosingHour, fmtDec2);

                addRow("Total Running Hour", (id) => shift.plantMetrics[id]?.RunningHr, fmtDec2, true, 'FFF5F5F5');

                addRow("TPH", (id) => {
                    const m = shift.plantMetrics[id];
                    return (m && m.RunningHr > 0) ? m.TotalProductionMT / m.RunningHr : 0;
                }, fmtDec2);

                shift.stoppages.forEach(reason => {
                    addRow(reason, (id) => shift.stoppageValues[reason]?.[id] || 0, fmtDec2);
                });

                addRow("Total stoppage Hour", (id) => shift.stoppages.reduce((sum, r) => sum + (shift.stoppageValues[r]?.[id] || 0), 0), fmtDec2, true, 'FFFFFCCC');

                setCell(ws.getCell(currentRow, 2), slNo++, { align: 'center', bold: true, bg: 'FFF5F5F5' });
                setCell(ws.getCell(currentRow, 3), "Total Shift Hour", { align: 'left', bold: true, bg: 'FFF5F5F5' });
                let hCol = 4;
                plants.forEach(() => setCell(ws.getCell(currentRow, hCol++), 8.00, { numFmt: fmtDec2, align: 'right', bold: true, bg: 'FFF5F5F5' }));
                setCell(ws.getCell(currentRow, hCol), "", { bg: 'FFF5F5F5' });
                currentRow++;

                const shiftTotalProd = plants.reduce((sum, p) => sum + (shift.plantMetrics[p.id]?.TotalProductionMT || 0), 0);

                // Merge B and C for "Total Production"
                ws.mergeCells(`B${currentRow}:C${currentRow}`);
                setCell(ws.getCell(currentRow, 2), "Total Production", { align: 'right', bold: true, bg: 'FFEAEAEA' });

                let eCol = 4;
                plants.forEach(() => setCell(ws.getCell(currentRow, eCol++), "", { bg: 'FFEAEAEA' }));
                setCell(ws.getCell(currentRow, eCol), shiftTotalProd, { numFmt: fmtQty, align: 'right', bold: true, bg: 'FFEAEAEA' });
                currentRow++;

                // Remarks
                ws.mergeCells(`B${currentRow}:C${currentRow}`);
                setCell(ws.getCell(currentRow, 2), "REMARKS:-", { align: 'right', bold: true });
                let rCol = 4;
                plants.forEach(p => setCell(ws.getCell(currentRow, rCol++), shift.remarks[p.id] || "", { align: 'left' }));
                setCell(ws.getCell(currentRow, rCol), "");
                currentRow++;

                currentRow += 2; // Spacer between shifts
            });

            const buf = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `Crusher_Daily_Shift_Report_${date}.xlsx`);
            toast.success("Excel Downloaded Successfully");

        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("Failed to export Excel");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Crusher Daily Shift Report</h1>
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
                    className={styles.generateBtn}
                    disabled={loading}
                >
                    {loading ? "Generating..." : "Show Report"}
                </button>
                <div style={{ flex: 1 }}></div>
                {data && (
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

            {data && (
                <div className={styles.reportSheet} id="print-area">
                    <CrDailyShiftTable shifts={data} date={date} />
                </div>
            )}
        </div>
    );
}
