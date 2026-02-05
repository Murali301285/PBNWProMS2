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
        window.print();
    };

    const handleExportExcel = () => {
        if (!data) return;
        // Trigger export inside Table component via Ref or move logic here. 
        // For simplicity, we can pass a trigger prop or just keep the logic in Table for now 
        // BUT the pattern says buttons are here. 
        // If logic is complex, usually we lift it. 
        // Let's call a function on the child via ID or similar since refactoring export logic might be error prone without testing.
        // Actually, simplest is to use document.getElementById('export-btn').click() if we render a hidden button in Table, 
        // OR move the logic here.
        // Moving logic is better.
        // I will import XLSX here.
        import('xlsx-js-style').then(XLSX => {
            const wb = XLSX.utils.book_new();
            const wsData = [];

            // Report Title
            wsData.push(["THRIVENI SAINIK MINING PRIVATE LIMITED"]);
            wsData.push(["PAKRI BARWADIH COAL MINING PROJECT"]);
            wsData.push(["Cb. Daily Shift Report"]);
            wsData.push(["Date:", new Date(date).toLocaleDateString('en-GB')]);
            wsData.push([]);

            data.forEach(shift => {
                // Reuse logic from Table...
                // It's cleaner to keep Excel logic in a util or here.
                // I'll copy the logic from Table to here.
                const plants = shift.plants;
                // Row 1: Incharges
                wsData.push([
                    `Large Scale Incharge :- ${shift.largeIncharge || '-'}`,
                    "",
                    `Mid Scale Incharge :- ${shift.midIncharge || '-'}`
                ]);

                // Row 2: Columns
                wsData.push([
                    `SHIFT - ${shift.name}`,
                    "Description",
                    ...plants.map(p => p.name)
                ]);

                let slNo = 1;
                const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0.00';
                const fmtDec0 = (val) => val != null ? Number(val).toFixed(0) : '0';
                const fmtQty = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0.000';

                const addRow = (desc, getValue, format = fmtDec2) => {
                    const row = [slNo++, desc, ...plants.map(p => format(getValue(p.id)))];
                    wsData.push(row);
                };

                // Logic replication...
                let timeFrom = "", timeTo = "";
                const sn = shift.name.toUpperCase();
                if (sn.includes('A')) { timeFrom = '6:00 am'; timeTo = '2:00 pm'; }
                else if (sn.includes('B')) { timeFrom = '2:00 pm'; timeTo = '10:00 pm'; }
                else if (sn.includes('C')) { timeFrom = '10:00 pm'; timeTo = '6:00 am'; }
                else { timeFrom = '8:30 am'; timeTo = '5:00 pm'; }

                wsData.push([slNo++, "Time From", ...plants.map(() => timeFrom)]);
                wsData.push([slNo++, "Time To", ...plants.map(() => timeTo)]);

                addRow("S.B.S. Reading", (id) => shift.plantMetrics[id]?.SBS_Reading, fmtDec0);
                addRow("C.B.S. Reading", (id) => shift.plantMetrics[id]?.CBS_Reading, fmtDec0);

                wsData.push([slNo++, "Total Production In MT", ...plants.map(p => fmtQty(shift.plantMetrics[p.id]?.TotalProductionMT))]);

                addRow("No of Trip Unloaded", (id) => shift.plantMetrics[id]?.NoofTripUnloaded, fmtDec0);
                addRow("Apron Starting. Hour", (id) => shift.plantMetrics[id]?.ApronStartingHour, fmtDec2);
                addRow("Apron Closing Hour", (id) => shift.plantMetrics[id]?.ApronClosingHour, fmtDec2);

                wsData.push([slNo++, "Total Running Hour", ...plants.map(p => fmtDec2(shift.plantMetrics[p.id]?.RunningHr))]);

                addRow("TPH", (id) => {
                    const m = shift.plantMetrics[id];
                    return (m && m.RunningHr > 0) ? m.TotalProductionMT / m.RunningHr : 0;
                }, fmtDec2);

                shift.stoppages.forEach(reason => {
                    wsData.push([slNo++, reason, ...plants.map(p => fmtDec2(shift.stoppageValues[reason]?.[p.id] || 0))]);
                });

                wsData.push([
                    slNo++, "Total stoppage Hour",
                    ...plants.map(p => fmtDec2(shift.stoppages.reduce((sum, r) => sum + (shift.stoppageValues[r]?.[p.id] || 0), 0)))
                ]);

                wsData.push([slNo++, "Total Shift Hour", ...plants.map(() => "8.00")]);

                const shiftTotalProd = plants.reduce((sum, p) => sum + (shift.plantMetrics[p.id]?.TotalProductionMT || 0), 0);
                wsData.push(["Total Production", "", ...plants.map(() => ""), fmtQty(shiftTotalProd)]);

                wsData.push(["", "REMARKS:-", ...plants.map(p => shift.remarks[p.id] || "")]);
                wsData.push([]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.sheet_add_aoa(ws, [["Downloaded on: " + new Date().toLocaleString('en-IN')]], { origin: -1 });
            XLSX.utils.book_append_sheet(wb, ws, "Daily Shift Report");
            XLSX.writeFile(wb, `ProMS_Cr_Daily_Shift_${date}.xlsx`);
        });
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
