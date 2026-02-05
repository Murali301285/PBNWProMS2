'use client';
import { useState } from 'react';
import styles from './EqGroupPerformance.module.css';
import EqGroupPerformanceTable from './EqGroupPerformanceTable';
import { Download, Printer } from 'lucide-react';

export default function EqGroupPerformancePage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);

    // State
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
            const response = await fetch('/api/reports/eq-group-performance', {
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

    const handleExportExcel = () => {
        alert("Excel Export update needed for new columns - verifying UI first.");
    };

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Equipment Model Performance</h1>
            </div>

            <div className={styles.filterContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <button className={styles.generateBtn} onClick={handleShowReport} disabled={loading}>
                    {loading ? 'Loading...' : 'Show Report'}
                </button>

                {/* Spacer to push actions to the right if needed, or just keep them inline */}
                <div style={{ flex: 1 }}></div>

                <button onClick={handlePrint} className={styles.actionBtn}>
                    <Printer size={16} /> Print
                </button>
                <button onClick={handleExportExcel} className={`${styles.actionBtn} ${styles.excel}`}>
                    <Download size={16} /> Excel
                </button>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {reportData && (
                <div className={styles.reportSheet} id="print-section">
                    <EqGroupPerformanceTable data={reportData} date={date} />
                </div>
            )}
        </div>
    );
}
