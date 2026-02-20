'use client';

import { useState, useEffect } from 'react';
import styles from './TentativeProduction.module.css'; // Updated CSS Import
import TentativeReportTable from './TentativeReportTable';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

export default function TentativeProductionPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [shiftId, setShiftId] = useState('');
    const [shifts, setShifts] = useState([]);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch Shifts on Load
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const res = await fetch('/api/reports/tentative-production?type=shifts');
                const result = await res.json();
                if (result.success) {
                    setShifts(result.data);
                }
            } catch (error) {
                console.error("Failed to load shifts", error);
            }
        };
        fetchShifts();
    }, []);

    const handleShowReport = async () => {
        if (!date) return toast.error('Please select a date');
        // Shift is optional in Sector Wise, assume optional here too? 
        // Or keep mandatory as per previous logic. Keeping mandatory for now if old logic required it. 
        // Actually old logic: if (!filter.shiftId) return toast.error('Please select a shift');
        // Sector Wise made it optional. Let's make it optional to match pattern if backend supports it.
        // But backend for Tentative might require it. Let's check ProMS2_SPReportTentativeProduction.sql
        // It uses @ShiftId in WHERE clause: T0.ShiftId=@ShiftId. So it is MANDATORY in current SP.
        // User asked to match DESIGN, not necessarily logic, but better to keep working logic.
        if (!shiftId) return toast.error('Please select a shift');

        setLoading(true);
        setData(null);

        try {
            const res = await fetch('/api/reports/tentative-production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, shiftId })
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                toast.success('Report Generated');
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Totals Calculation Helpers (Moved from Table) ---
    const calculateWasteTotal = (arr) => arr.reduce((acc, row) => ({
        OverBurden: acc.OverBurden + (row.OverBurden || 0),
        TopSoil: acc.TopSoil + (row.TopSoil || 0),
        TotalTrip: acc.TotalTrip + (row.TotalTrip || 0),
        QtyBcm: acc.QtyBcm + (row.QtyBcm || 0),
        Diff: acc.Diff + (row.Diff || 0)
    }), { OverBurden: 0, TopSoil: 0, TotalTrip: 0, QtyBcm: 0, Diff: 0 });

    const calculateCoalTotal = (arr) => arr.reduce((acc, row) => ({
        RomCoal: acc.RomCoal + (row.RomCoal || 0),
        Qty: acc.Qty + (row.Qty || 0),
        Diff: acc.Diff + (row.Diff || 0)
    }), { RomCoal: 0, Qty: 0, Diff: 0 });

    const calculateRehandlingTotal = (arr) => arr.reduce((acc, row) => ({
        Trip: acc.Trip + (row.Trip || 0),
        Qty: acc.Qty + (row.Qty || 0)
    }), { Trip: 0, Qty: 0 });

    const handleExportExcel = () => {
        if (!data) return;

        const { wasteHandling, coalProduction, wp3, obRehandling, coalRehandling, headerInfo } = data;

        const wasteTotal = calculateWasteTotal(wasteHandling);
        const wp3Total = calculateWasteTotal(wp3);
        const coalTotal = calculateCoalTotal(coalProduction);
        const obRehandlingTotal = calculateRehandlingTotal(obRehandling);
        const coalRehandlingTotal = calculateRehandlingTotal(coalRehandling);

        const fmt = (val) => (val !== undefined && val !== null) ? Number(val).toLocaleString('en-IN') : '0';

        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title Matching Sector Wise Format
        wsData.push(["THRIVENI SAINIK MINING PRIVATE LIMITED"]);
        wsData.push(["PAKRI BARWADIH COAL MINING PROJECT"]);
        wsData.push([`TENTATIVE PRODUCTION QTY`, "", "", `Date: ${headerInfo?.Date || '-'}`, `Shift: ${headerInfo?.ShiftName || '-'}`]);
        wsData.push([`Relay: ${headerInfo?.Relay || '-'}`, "", "", `Shift Incharge: ${headerInfo?.ShiftIncharge || '-'}`]);
        wsData.push([]); // Spacer

        // --- Waste Handling ---
        wsData.push(["Waste Handling", "", "", "", "", "", "Mapio"]);
        wsData.push(["Model", "OB/IB", "Factor", "Top Soil", "Factor", "Total Trip", "Qty (BCM)", "Trip", "Qty (BCM)", "Diff"]);

        wasteHandling.forEach(row => {
            wsData.push([
                row.EquipmentGroup,
                fmt(row.OverBurden),
                row.OverBurdenFactor,
                fmt(row.TopSoil),
                row.TopSoilFactor,
                fmt(row.TotalTrip),
                fmt(row.QtyBcm),
                fmt(row.MapioTrip),
                fmt(row.MapioQty),
                fmt(row.Diff)
            ]);
        });
        // Total Waste
        wsData.push(["Total", fmt(wasteTotal.OverBurden), "", fmt(wasteTotal.TopSoil), "", fmt(wasteTotal.TotalTrip), fmt(wasteTotal.QtyBcm), 0, 0, fmt(wasteTotal.Diff)]);
        wsData.push([]);

        // --- Coal Production ---
        wsData.push(["Coal Production", "", "", "", "", "Mapio"]);
        wsData.push(["Model", "ROM Coal", "Factor", "Qty (MT)", "", "Trip", "Qty (MT)", "Diff"]);
        coalProduction.forEach(row => {
            wsData.push([
                row.EquipmentGroup,
                fmt(row.RomCoal),
                row.Factor,
                fmt(row.Qty),
                "",
                fmt(row.MapioTrip),
                fmt(row.MapioQty),
                fmt(row.Diff)
            ]);
        });
        wsData.push(["Total", fmt(coalTotal.RomCoal), "", fmt(coalTotal.Qty), "", 0, 0, fmt(coalTotal.Diff)]);
        wsData.push([]);

        // --- WP-3 ---
        wsData.push(["WP-3 Quantity"]);
        wsData.push(["Model", "OB/IB", "Factor", "Top Soil", "Factor", "Total Trip", "Qty (BCM)"]);
        wp3.forEach(row => {
            wsData.push([
                row.EquipmentGroup,
                fmt(row.OverBurden),
                row.OverBurdenFactor,
                fmt(row.TopSoil),
                row.TopSoilFactor,
                fmt(row.TotalTrip),
                fmt(row.QtyBcm)
            ]);
        });
        wsData.push(["Total", fmt(wp3Total.OverBurden), "", fmt(wp3Total.TopSoil), "", fmt(wp3Total.TotalTrip), fmt(wp3Total.QtyBcm)]);
        wsData.push([]);

        // --- Rehandling ---
        wsData.push(["OB Rehandling/Carpeting Quantity"]);
        wsData.push(["Model", "Trip", "Factor", "Qty (BCM)"]);
        obRehandling.forEach(row => {
            wsData.push([row.EquipmentGroup, fmt(row.Trip), row.Factor, fmt(row.Qty)]);
        });
        wsData.push(["Total", fmt(obRehandlingTotal.Trip), "", fmt(obRehandlingTotal.Qty)]);
        wsData.push([]);

        wsData.push(["Coal Rehandling Quantity"]);
        wsData.push(["Model", "Trip", "Factor", "Qty (MT)"]);
        coalRehandling.forEach(row => {
            wsData.push([row.EquipmentGroup, fmt(row.Trip), row.Factor, fmt(row.Qty)]);
        });
        wsData.push(["Total", fmt(coalRehandlingTotal.Trip), "", fmt(coalRehandlingTotal.Qty)]);


        // Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Styling (Re-using logic)
        const range = XLSX.utils.decode_range(ws['!ref']);

        // Merge Title Rows
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }); // Company
        ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }); // Project

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) continue;

                // Default Style: Border + Font
                const cellStyle = {
                    font: { name: "Calibri", sz: 10 },
                    border: {
                        top: { style: "thin" },
                        bottom: { style: "thin" },
                        left: { style: "thin" },
                        right: { style: "thin" }
                    },
                    alignment: { vertical: "center", horizontal: "center" }
                };

                if (C === 0) cellStyle.alignment.horizontal = "left";

                const rowVal = wsData[R];
                if (!rowVal) continue;

                const firstColVal = rowVal[0];

                // Header Styling
                if (R < 4) {
                    cellStyle.border = {};
                    cellStyle.font.bold = true;
                    if (R === 0 || R === 1) cellStyle.font.sz = 14;
                    if (R === 2) cellStyle.font.underline = true;
                }

                if (typeof firstColVal === 'string' && (
                    firstColVal.includes("Waste Handling") ||
                    firstColVal.includes("Coal Production") ||
                    firstColVal.includes("WP-3") ||
                    firstColVal.includes("Rehandling") ||
                    firstColVal.includes("Top Soil") ||
                    firstColVal === "Model" ||
                    firstColVal === "Total"
                )) {
                    cellStyle.font.bold = true;
                    if (firstColVal === "Model") cellStyle.fill = { fgColor: { rgb: "BFDBFE" } }; // Blue-200
                    if (firstColVal === "Total") cellStyle.fill = { fgColor: { rgb: "E0F2FE" } }; // Sky-100
                }

                ws[cellRef].s = cellStyle;
            }
        }

        ws['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `TentativeProduction_${headerInfo?.Date || 'Report'}.xlsx`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Tentative Production</h1>
            </div>

            <div className={styles.filterContainer}> {/* Replaced Header Controls */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Shift</label>
                    <select
                        className={styles.select}
                        value={shiftId}
                        onChange={(e) => setShiftId(e.target.value)}
                    >
                        <option value="">Select Shift</option>
                        {shifts.map((s) => (
                            <option key={s.SlNo} value={s.SlNo}>
                                {s.ShiftName}
                            </option>
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

                {data && (
                    <>
                        <button onClick={handlePrint} className={styles.actionBtn}>
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExportExcel} className={`${styles.actionBtn} ${styles.excel}`}>
                            <Download size={16} /> Export Excel
                        </button>
                    </>
                )}
            </div>

            <div className={styles.tableContainer}>
                <TentativeReportTable data={data} loading={loading} />
            </div>
        </div>
    );
}
