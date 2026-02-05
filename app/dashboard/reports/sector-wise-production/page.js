'use client';
import { useState } from 'react';
import styles from './SectorWiseProduction.module.css';
import SectorWiseProductionTable from './SectorWiseProductionTable';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

export default function SectorWiseProductionPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);

    // State
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleShowReport = async () => {
        if (!date) {
            toast.error("Please select Date");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/sector-wise-production', {
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
        try {
            const wb = XLSX.utils.book_new();
            const wsData = [
                ["THRIVENI SAINIK MINING PRIVATE LIMITED"],
                ["PAKRI BARWADIH COAL MINING PROJECT"],
                [`SECTOR WISE PRODUCTION REPORT`, "", "", `Date: ${date}`],
                [],
                ["Si No", "Equipment Name", "Patch", "Trip", "Qty(BCM)", "OB Hrs", "Target BCM/Hr", "BCM/Hr", "Method"]
            ];

            // Group Data
            const groups = {};
            reportData.forEach(row => {
                const sector = row.SectorName || 'Unknown';
                if (!groups[sector]) groups[sector] = [];
                groups[sector].push(row);
            });
            const sectors = Object.keys(groups).sort();

            let grandTrips = 0, grandQty = 0, grandHrs = 0;

            sectors.forEach((sector, sIdx) => {
                const rows = groups[sector];
                // Sector Header
                wsData.push([String.fromCharCode(65 + sIdx) + ". " + sector, "", "", "", "", "", "", "", ""]);

                let secTrips = 0, secQty = 0, secHrs = 0;

                rows.forEach((r, rIdx) => {
                    wsData.push([
                        rIdx + 1,
                        r.EquipmentName,
                        r.PatchName,
                        r.Trips,
                        r.QtyBCM,
                        r.OBHrs,
                        r.TargetBCMHr,
                        Number(r.BCMHr).toFixed(2),
                        r.MethodName
                    ]);
                    secTrips += (r.Trips || 0);
                    secQty += (r.QtyBCM || 0);
                    secHrs += (r.OBHrs || 0);
                });

                // Sector Total
                wsData.push([
                    "Total", "", "",
                    secTrips,
                    secQty,
                    secHrs.toFixed(1),
                    "-",
                    secHrs > 0 ? (secQty / secHrs).toFixed(2) : "0.00",
                    ""
                ]);

                grandTrips += secTrips;
                grandQty += secQty;
                grandHrs += secHrs;
            });

            // Grand Total
            wsData.push([
                "Grand Total", "", "",
                grandTrips,
                grandQty,
                grandHrs.toFixed(1),
                "-",
                grandHrs > 0 ? (grandQty / grandHrs).toFixed(2) : "0.00",
                ""
            ]);

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Merges for Header
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
            ];

            XLSX.utils.book_append_sheet(wb, ws, "SectorWise");
            XLSX.writeFile(wb, `SectorWiseProduction_${date}.xlsx`);
            toast.success("Excel exported successfully!");
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Sector Wise Production Report</h1>
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

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {reportData && (
                <div className={styles.reportSheet} id="print-area">
                    <SectorWiseProductionTable data={reportData} date={date} />
                </div>
            )}
        </div>
    );
}
