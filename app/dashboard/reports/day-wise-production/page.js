
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

    const handleExportExcel = () => {
        if (!reportData) return;

        const wb = XLSX.utils.book_new();
        const reportDate = new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' });
        const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

        // Calculate Grand Total for Excel (replicated from Table)
        const grand = reportData.reduce((acc, r) => ({
            coal: acc.coal + (r.Coal_MT || 0),
            ob: acc.ob + (r.OB_BCM || 0),
            dispatch: acc.dispatch + (r.Dispatch_MT || 0),
            total: acc.total + (r.TotalProduction_BCM || 0)
        }), { coal: 0, ob: 0, dispatch: 0, total: 0 });

        const wsData = [
            ["THRIVENI SAINIK MINING PRIVATE LIMITED"],
            ["DAY WISE PRODUCTION REPORT"],
            [`Month: ${reportDate}`, "", "", "", "", `Date: ${date}`],
            [],
            ["Date", "Coal (MT)", "OB (BCM)", "Total Production", "Dispatch", "HSD (Ltr)", "Ltr/BCM", "HEMM Lead", "Mid Scale Lead", "OB Lead KM", "Coal Lead KM"]
        ];

        reportData.forEach(r => {
            wsData.push([
                fmtDate(r.Date),
                r.Coal_MT,
                r.OB_BCM,
                r.TotalProduction_BCM,
                r.Dispatch_MT,
                "-", "-", "-", "-", "-", "-"
            ]);
        });

        wsData.push([
            "Grand Total",
            grand.coal,
            grand.ob,
            grand.total,
            grand.dispatch,
            "-", "-", "-", "-", "-", "-"
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // ... simple styling ...
        XLSX.utils.book_append_sheet(wb, ws, "DayWiseProd");
        XLSX.writeFile(wb, `DayWiseProduction_${date}.xlsx`);
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

