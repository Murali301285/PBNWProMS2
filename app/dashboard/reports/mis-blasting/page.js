"use client";
import { useState, useEffect } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';
import { RotateCcw, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import MISBlastingTable from './MISBlastingTable';
import styles from './MisBlasting.module.css';

export default function MISBlastingPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/mis-blasting?date=${date}`);
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
            BlastedMeters: acc.BlastedMeters + (row.BlastedMeters || 0),
            VolumeBCM: acc.VolumeBCM + (row.VolumeBCM || 0),
            SMEQuantityKg: acc.SMEQuantityKg + (row.SMEQuantityKg || 0)
        }), { NoofHoles: 0, BlastedMeters: 0, VolumeBCM: 0, SMEQuantityKg: 0 });

        const coalTotals = calcTotals(coal || []);
        const obTotals = calcTotals(ob || []);
        const grandTotals = {
            NoofHoles: coalTotals.NoofHoles + obTotals.NoofHoles,
            BlastedMeters: coalTotals.BlastedMeters + obTotals.BlastedMeters,
            VolumeBCM: coalTotals.VolumeBCM + obTotals.VolumeBCM,
            SMEQuantityKg: coalTotals.SMEQuantityKg + obTotals.SMEQuantityKg
        };

        const calcGrandAvg = (totals) => {
            const pf = totals.SMEQuantityKg > 0 ? totals.VolumeBCM / totals.SMEQuantityKg : 0;
            const avgQty = totals.NoofHoles > 0 ? totals.SMEQuantityKg / totals.NoofHoles : 0;
            return { pf, avgQty };
        };
        const grandAvgs = calcGrandAvg(grandTotals);

        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title
        wsData.push(["MIS Blasting"]);
        wsData.push(["Blasting Date", new Date(date).toLocaleDateString('en-GB')]);
        wsData.push([]);

        const headers = [
            "Material", "Blasting Patch Id", "Location", "SME Supplier",
            "No of Holes", "Blasted Meters", "Spacing (m)", "Burden (m)", "Avg Depth (Mtr)",
            "Volume (BCM)", "SME Quantity (Kg)", "Powder Factor (BCM/Kg)",
            "Avg Qty per Hole", "Depth Factor", "Avg Depth"
        ];
        wsData.push(headers);

        const pushRow = (row, materialName = '') => {
            wsData.push([
                materialName || row.MaterialName,
                row.BlastingPatchId,
                row.LocationName,
                row.SMESupplier,
                row.NoofHoles,
                row.BlastedMeters,
                row.Spacing,
                row.Burden,
                row.AvgDepthMtr,
                row.VolumeBCM,
                row.SMEQuantityKg,
                row.PowderFactor,
                row.AvgQtyPerHole,
                row.DepthFactor,
                row.AvgDepthFinal
            ]);
        };

        // COAL
        if (coal && coal.length > 0) {
            coal.forEach((row, i) => pushRow(row, i === 0 ? 'Coal' : ''));
        }
        wsData.push(["Coal Total", "", "", "", coalTotals.NoofHoles, coalTotals.BlastedMeters, "", "", "", coalTotals.VolumeBCM, coalTotals.SMEQuantityKg]);

        // OB
        if (ob && ob.length > 0) {
            ob.forEach((row, i) => pushRow(row, i === 0 ? 'OB' : ''));
        }
        wsData.push(["OB Total", "", "", "", obTotals.NoofHoles, obTotals.BlastedMeters, "", "", "", obTotals.VolumeBCM, obTotals.SMEQuantityKg]);

        // Grand Total
        wsData.push([
            "Grand Total", "", "", "",
            grandTotals.NoofHoles, grandTotals.BlastedMeters, "", "", "",
            grandTotals.VolumeBCM, grandTotals.SMEQuantityKg,
            grandAvgs.pf, grandAvgs.avgQty
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];

        XLSX.utils.book_append_sheet(wb, ws, "MIS Blasting");
        XLSX.writeFile(wb, `ProMS_MIS_Blasting_${date}.xlsx`);
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
                        <h3 className={styles.title}>MIS Blasting Report</h3>
                        <h4 className="text-md font-bold text-center">Date: {new Date(date).toLocaleDateString('en-GB')}</h4>
                    </div>
                    <MISBlastingTable data={data} date={date} />
                </div>
            )}
        </div>
    );
}

