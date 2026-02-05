"use client";
import { useState, useEffect } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';
import { RotateCcw, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import MISDrillingTable from './MISDrillingTable';
import styles from './MisDrilling.module.css';

export default function MISDrillingPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/mis-drilling?date=${date}`);
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            setData(result);
            toast.success("Report loaded successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to load report");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleShow = () => fetchData();
    const handleReset = () => {
        setDate(today);
    };

    const handlePrint = () => window.print();

    const handleExportExcel = async () => {
        if (!data) return;
        const XLSX = await import('xlsx-js-style');

        const { coal, ob } = data;
        const calcTotals = (rows) => rows.reduce((acc, row) => ({
            NoofHoles: acc.NoofHoles + (row.NoofHoles || 0),
            TotalMeters: acc.TotalMeters + (row.TotalMeters || 0)
        }), { NoofHoles: 0, TotalMeters: 0 });

        const coalTotals = calcTotals(coal || []);
        const obTotals = calcTotals(ob || []);
        const grandTotals = {
            NoofHoles: coalTotals.NoofHoles + obTotals.NoofHoles,
            TotalMeters: coalTotals.TotalMeters + obTotals.TotalMeters
        };

        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title
        wsData.push(["MIS Drilling"]);
        wsData.push(["Drilling Date", new Date(date).toLocaleDateString('en-GB')]);
        wsData.push([]);

        const headers = ["Material", "Drilling Patch Id", "Location", "Agency", "Remark", "No of Holes", "Total Meters", "Spacing (m)", "Burden (m)", "Avg Depth (m)"];
        wsData.push(headers);

        const pushRow = (row, materialName = '') => {
            wsData.push([
                materialName || row.Material,
                row.DrillingPatchId,
                row.Location,
                row.Agency,
                row.Remarks,
                row.NoofHoles,
                row.TotalMeters,
                row.Spacing,
                row.Burden,
                row.AverageDepth
            ]);
        };

        // COAL
        if (coal && coal.length > 0) {
            coal.forEach((row, i) => pushRow(row, i === 0 ? 'Coal' : ''));
        }
        wsData.push(["Coal Total", "", "", "", "", coalTotals.NoofHoles, coalTotals.TotalMeters, "", "", ""]);

        // OB
        if (ob && ob.length > 0) {
            ob.forEach((row, i) => pushRow(row, i === 0 ? 'OB' : ''));
        }
        wsData.push(["OB Total", "", "", "", "", obTotals.NoofHoles, obTotals.TotalMeters, "", "", ""]);

        // Grand Total
        wsData.push(["Grand Total", "", "", "", "", grandTotals.NoofHoles, grandTotals.TotalMeters, "", "", ""]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];

        XLSX.utils.book_append_sheet(wb, ws, "MIS Drilling");
        XLSX.writeFile(wb, `ProMS_MIS_Drilling_${date}.xlsx`);
    };

    return (
        <div className={styles.container}>
            {loading && <LoadingOverlay message="Generating Report..." />}

            <div className={styles.filterContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input type="date" className={styles.input} value={date} max={today} onChange={e => setDate(e.target.value)} />
                </div>
                <button onClick={handleShow} className={styles.generateBtn}>Show Report</button>
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
                    <div className={styles.headingWrapper}>
                        <h1 className="text-xl font-bold text-center">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                        <h2 className="text-lg font-bold text-center">PAKRI BARWADIH COAL MINING PROJECT</h2>
                        <h3 className={styles.title}>MIS Drilling Report</h3>
                        <h4 className="text-md font-bold text-center">Date: {new Date(date).toLocaleDateString('en-GB')}</h4>
                    </div>
                    <MISDrillingTable data={data} date={date} />
                </div>
            )}
        </div>
    );
}

