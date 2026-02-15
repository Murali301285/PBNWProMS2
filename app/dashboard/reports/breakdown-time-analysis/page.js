"use client";
import { useState } from 'react';
import styles from './BreakdownTime.module.css'; // Will create CSS module
import BreakdownTimeAnalysisTable from './BreakdownTimeAnalysisTable';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function BreakdownTimeAnalysisPage() {
    const today = new Date().toISOString().split('T')[0];
    const [filter, setFilter] = useState({
        fromDate: today,
        toDate: today
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

    const handlePrint = () => window.print();

    // Excel export logic similar to other reports
    const handleExportExcel = () => {
        if (!data) return;

        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Header
        wsData.push(["Breakdown Time Analysis Report"]);
        wsData.push([`From: ${filter.fromDate}`, `To: ${filter.toDate}`]);
        wsData.push([]);

        // Table Header
        wsData.push(["SlNo", "Date", "Shift", "Shift Change (Min)", "Break/Tea (Min)", "Blasting (Min)", "Others (Min)", "Total Break (Min)", "Total Working (Hrs)"]);

        // Data Rows
        data.forEach((row, index) => {
            wsData.push([
                index + 1,
                row.Date,
                row.ShiftName,
                row.ShiftChange,
                row.BreakTeaTime,
                row.Blasting,
                row.Others,
                row.TotalBreakMinutes,
                row.TotalWorkingHours
            ]);
        });

        // ... (Styling logic omitted for brevity in design, but will include in file)

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "BreakdownData");
        XLSX.writeFile(wb, `BreakdownAnalysis_${filter.fromDate}_${filter.toDate}.xlsx`);
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
