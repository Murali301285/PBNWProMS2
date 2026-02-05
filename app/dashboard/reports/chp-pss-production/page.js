'use client';
import { useState, useEffect, useMemo } from 'react';
import styles from './ChpPssProduction.module.css';
import ChpPssProductionTable from './ChpPssProductionTable';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

export default function ChpPssProductionPage() {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [month, setMonth] = useState(currentMonth);
    const [plantId, setPlantId] = useState('');
    const [plantList, setPlantList] = useState([]);

    const [reportData, setReportData] = useState(null); // { production, stoppages, allReasons }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Plants
    useEffect(() => {
        async function fetchPlants() {
            try {
                const res = await fetch('/api/master/plant');
                const data = await res.json();

                if (Array.isArray(data)) {
                    const validPlants = data.filter(p => !p.IsDelete && p.IsActive);
                    setPlantList(validPlants);
                } else {
                    console.error("Invalid Plant data format", data);
                }
            } catch (e) {
                console.error("Failed to load plants", e);
            }
        }
        fetchPlants();
    }, []);

    const handleShowReport = async () => {
        if (!month || !plantId) {
            toast.error("Please select Month and Plant");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const response = await fetch('/api/reports/chp-pss-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, plantId })
            });
            const result = await response.json();
            if (result.success) {
                setReportData({ production: result.production, stoppages: result.stoppages, allReasons: result.allReasons });
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
            const { production, stoppages, allReasons } = reportData;
            const monthObj = new Date(month + "-01");
            const monthName = monthObj.toLocaleString('default', { month: 'long', year: 'numeric' });

            // Determine distinct reasons
            let distinctReasons = [];
            if (allReasons && allReasons.length > 0) {
                distinctReasons = allReasons.map(r => r.BDReasonName);
            } else {
                const reasons = new Set();
                stoppages.forEach(s => {
                    if (s.ReasonName) reasons.add(s.ReasonName);
                });
                distinctReasons = Array.from(reasons).sort();
            }

            // Merge Data by Date
            const daysInMonth = new Date(monthObj.getFullYear(), monthObj.getMonth() + 1, 0).getDate();
            const mergedData = [];

            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(monthObj.getFullYear(), monthObj.getMonth(), i);
                const matchDate = (dataRow) => {
                    const rowDate = new Date(dataRow.WorkDate);
                    return rowDate.getDate() === i && rowDate.getMonth() === monthObj.getMonth();
                };

                const prodRow = production.find(matchDate) || {};
                const stopRows = stoppages.filter(matchDate);

                const stopMap = {};
                let totalStopHrs = 0;

                distinctReasons.forEach(r => {
                    const entry = stopRows.find(s => s.ReasonName === r);
                    const hrs = entry ? entry.StoppageHours : 0;
                    stopMap[r] = hrs;
                    totalStopHrs += hrs;
                });

                const runHr = prodRow.RunningHr || 0;
                const totalDay = 24.00;
                const idleHr = Math.max(0, totalDay - (runHr + totalStopHrs));

                mergedData.push({
                    date: d,
                    prod: prodRow.ProductionQty || 0,
                    tph: prodRow.TPH_Calculated || 0,
                    runHr: runHr,
                    stopMap,
                    totalStopHrs,
                    idleHr,
                    totalDay,
                    units: prodRow.PowerKWH || 0,
                });
            }

            // Calculate Grand Totals
            const grand = mergedData.reduce((acc, r) => {
                acc.prod += r.prod;
                acc.runHr += r.runHr;
                acc.totalStopHrs += r.totalStopHrs;
                acc.idleHr += r.idleHr;
                acc.totalDay += r.totalDay;
                acc.units += r.units;

                distinctReasons.forEach(reason => {
                    acc.stopMap[reason] = (acc.stopMap[reason] || 0) + (r.stopMap[reason] || 0);
                });

                return acc;
            }, { prod: 0, runHr: 0, totalStopHrs: 0, idleHr: 0, totalDay: 0, units: 0, stopMap: {} });

            grand.tph = grand.prod / 18.9;

            // Build Excel Data
            const wb = XLSX.utils.book_new();
            const wsData = [
                ["THRIVENI SAINIK MINING PRIVATE LIMITED"],
                ["CHP PSS PRODUCTION REPORT"],
                [`Month: ${monthName}`],
                [],
                ["Date", "Plant Total Production", "TPH", "Running Hours", ...distinctReasons, "Total Breakdown Hrs", "Total Idle Hour", "Total Stoppage", "Total Day Hour", "Total Unit Consumption", "Remarks"]
            ];

            mergedData.forEach(r => {
                const row = [
                    r.date.toLocaleDateString('en-GB'),
                    r.prod,
                    r.tph.toFixed(0),
                    r.runHr.toFixed(2),
                    ...distinctReasons.map(reason => (r.stopMap[reason] || 0).toFixed(2)),
                    r.totalStopHrs.toFixed(2),
                    r.idleHr.toFixed(2),
                    r.totalStopHrs.toFixed(2),
                    r.totalDay.toFixed(2),
                    r.units,
                    ""
                ];
                wsData.push(row);
            });

            // Grand Total Row
            wsData.push([
                "Total",
                grand.prod,
                grand.tph.toFixed(0),
                grand.runHr.toFixed(2),
                ...distinctReasons.map(reason => (grand.stopMap[reason] || 0).toFixed(2)),
                grand.totalStopHrs.toFixed(2),
                grand.idleHr.toFixed(2),
                grand.totalStopHrs.toFixed(2),
                grand.totalDay.toFixed(2),
                grand.units,
                ""
            ]);

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Merges for Header
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: distinctReasons.length + 10 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: distinctReasons.length + 10 } },
            ];

            XLSX.utils.book_append_sheet(wb, ws, "ChpPssProduction");
            XLSX.writeFile(wb, `ChpPssProduction_${month}.xlsx`);
            toast.success("Excel exported successfully!");
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>CHP PSS Production Report</h1>
            </div>

            <div className={styles.filterContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Month</label>
                    <input
                        type="month"
                        className={styles.input}
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Plant</label>
                    <select
                        className={styles.select}
                        value={plantId}
                        onChange={(e) => setPlantId(e.target.value)}
                    >
                        <option value="">-- Select Plant --</option>
                        {plantList.map(p => (
                            <option key={p.SlNo} value={p.SlNo}>{p.Name}</option>
                        ))}
                    </select>
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
                    <ChpPssProductionTable
                        production={reportData.production}
                        stoppages={reportData.stoppages}
                        allReasons={reportData.allReasons}
                        month={month}
                    />
                </div>
            )}
        </div>
    );
}
