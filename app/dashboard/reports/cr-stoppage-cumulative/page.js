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
        window.print();
    };

    const handleExportExcel = () => {
        if (!reportData) return;
        try {
            const { plants, metricsMap, stoppageRows, calculatedTotalStop } = reportData;

            const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0';
            const fmtDec0 = (val) => val != null ? Number(val).toFixed(0) : '0';
            const getMetric = (pId, key) => metricsMap[pId]?.[key] || 0;

            const wb = XLSX.utils.book_new();
            const wsData = [];

            // Header
            const headerRow = ["SHIFT COAL CRUSHING REPORT", new Date(date).toLocaleDateString('en-GB')];
            wsData.push(headerRow);

            // Columns
            const cols = ["Sl.No.", "Description", ...plants.map(p => p.name)];
            wsData.push(cols);

            let slNo = 1;

            // Metric Rows
            const addMetricRow = (label, key, isInt = false) => {
                const row = [
                    slNo++,
                    label,
                    ...plants.map(p => isInt ? fmtDec0(getMetric(p.id, key)) : fmtDec2(getMetric(p.id, key)))
                ];
                wsData.push(row);
            }

            addMetricRow("Apron Starting. Hour", "startingHour", false);
            addMetricRow("Apron Closing Hour", "closingHour", false);

            // Total Running Hour (Blue)
            const totalRunRow = [
                slNo++,
                "Total Running Hour",
                ...plants.map(p => fmtDec2(getMetric(p.id, "runningHr")))
            ];
            wsData.push(totalRunRow);

            // Stoppages
            stoppageRows.forEach(r => {
                const row = [
                    slNo++,
                    r.reason,
                    ...plants.map(p => fmtDec2(r.values[p.id] || 0))
                ];
                wsData.push(row);
            });

            // Total Stoppage (Yellow)
            const totalStopRow = [
                slNo++,
                "Total stoppage Hour",
                ...plants.map(p => fmtDec2(calculatedTotalStop[p.id] || 0))
            ];
            wsData.push(totalStopRow);

            // Total Shift Hour
            const shiftRow = [
                "",
                "Total Shift Hour",
                ...plants.map(p => fmtDec2(getMetric(p.id, "totalShiftHour")))
            ];
            wsData.push(shiftRow);

            // Remarks Row (Per Plant)
            const remarksRow = [
                "",
                "REMARKS:-",
                ...plants.map(p => getMetric(p.id, "remarks") || "")
            ];
            wsData.push(remarksRow);

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Styling (Basic Widths)
            ws['!cols'] = [{ wch: 5 }, { wch: 30 }, ...plants.map(() => ({ wch: 12 }))];

            // Downloaded On
            const downloadTime = new Date().toLocaleString('en-IN');
            XLSX.utils.sheet_add_aoa(ws, [["Downloaded on: " + downloadTime]], { origin: -1 });

            XLSX.utils.book_append_sheet(wb, ws, "Stoppage Cumulative");
            const fname = `ProMS_Crusher_Stoppage_Cum_Dated_${date}.xlsx`;
            XLSX.writeFile(wb, fname);
            toast.success("Excel exported successfully!");
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
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
