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
    const handleExportExcel = () => {
        if (!reportData) return;
        toast.info("Excel export not yet fully implemented for this report structure.");
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
