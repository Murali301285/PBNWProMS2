'use client';

import React, { useMemo, useState, useEffect } from 'react';
import styles from './DailyProduction.module.css';

export default function DailyProductionTable({ data, date }) {
    // State variables for data received from the SP
    const [shiftProdCoal, setShiftProdCoal] = useState([]);
    const [shiftProdWaste, setShiftProdWaste] = useState([]);
    const [coalDetails, setCoalDetails] = useState([]);
    const [wasteDetails, setWasteDetails] = useState([]);
    const [crushedCoal, setCrushedCoal] = useState([]);
    const [coalCrushing, setCoalCrushing] = useState([]);
    const [coalCrushingSummary, setCoalCrushingSummary] = useState([]); // New state
    const [blasting, setBlasting] = useState([]);
    const [itizRehandling, setItizRehandling] = useState([]); // New state, replaces dumpRehandling
    const [dumperLoaderDetails, setDumperLoaderDetails] = useState([]); // New state for Section H
    const [remarks, setRemarks] = useState([]);

    // New State Variables
    const [crusherCoalQty, setCrusherCoalQty] = useState([]); // Section 5
    const [wp1Excavation, setWp1Excavation] = useState([]); // Section 7
    const [smaslQuantity, setSmaslQuantity] = useState([]); // Section 8
    const [inpitDumping, setInpitDumping] = useState([]); // Section 9
    const [wp3Excavation, setWp3Excavation] = useState([]); // Section 10

    useEffect(() => {
        if (data && Array.isArray(data)) { // Ensure data is an array as expected by the new structure
            setShiftProdCoal(data[0] || []);
            setShiftProdWaste(data[1] || []);
            setCoalDetails(data[2] || []);
            setWasteDetails(data[3] || []);
            setCrushedCoal(data[4] || []);
            setCoalCrushing(data[5] || []);
            setCoalCrushingSummary(data[6] || []);
            setBlasting(data[7] || []);
            setItizRehandling(data[8] || []);
            setDumperLoaderDetails(data[9] || []); // Section H (Old, maybe reused?)

            // New mappings based on requirements
            setCrusherCoalQty(data[6] || []);
            // data[7] is Blasting
            // data[8] is Itiz Rehandling (Placeholder)
            // data[10] is SMASL Quantity
            setSmaslQuantity(data[10] || []);
            // data[11] is Inpit Dumping
            setInpitDumping(data[11] || []);
            // data[12] is WP-3 Excavation
            setWp3Excavation(data[12] || []);
            // data[13] is Dumper Loader Details
            setDumperLoaderDetails(data[13] || []);
            // data[14] is Remarks
            setRemarks(data[14] || []);
        }
    }, [data]);

    if (!data) return null;

    // Process Dumper-Loader Pivot (Section H)
    const dumperPivot = useMemo(() => {
        if (!dumperLoaderDetails || dumperLoaderDetails.length === 0) return { headers: [], rows: [], grandTotals: {} };

        // 1. Get Unique Shifts and Loaders per Shift
        // structure: { "SHIFTA": ["Loader1", "Loader2"], "SHIFTB": ... }
        const shiftLoaders = { "SHIFTA": new Set(), "SHIFTB": new Set(), "SHIFTC": new Set() };
        const allLoaders = new Set();

        dumperLoaderDetails.forEach(r => {
            const s = r.ShiftName?.toUpperCase().replace('-', '').trim();
            if (shiftLoaders[s]) {
                shiftLoaders[s].add(r.Loader || 'Unknown');
            }
            if (r.Loader) allLoaders.add(r.Loader);
        });

        // Convert Sets to Arrays and Logic to Align columns
        // Option A: Distinct headers per shift (as per image likely)
        // Option B: Consistent columns (all loaders in all shifts)
        // User image shows distinct columns but let's stick to active loaders per shift for compactness usually, 
        // BUT user asked for cross tab. Let's start with unique loaders per shift sorted.

        const shifts = ["SHIFTA", "SHIFTB", "SHIFTC"];
        const headers = []; // [{ name: "SHIFTA", loaders: ["L1", "L2"] }, ...]

        shifts.forEach(s => {
            const loaders = Array.from(shiftLoaders[s]).sort();
            // If no loaders, maybe keep empty or skip? Layout implies fixed 3 shifts usually.
            // Let's keep 3 shifts fixed. If empty, just show empty or 1 placeholder?
            // User image has data in all.
            headers.push({ name: s, loaders });
        });

        // 2. Build Rows (Group by Dumper)
        const dumperMap = {};
        dumperLoaderDetails.forEach(r => {
            const dumperName = r.Dumper || 'Unknown';
            if (!dumperMap[dumperName]) {
                dumperMap[dumperName] = {
                    Dumper: dumperName,
                    Factor: r.FACTOR || 100,
                    Total: 0,
                    ...shifts.reduce((acc, s) => ({ ...acc, [s]: {} }), {})
                };
            }
            const s = r.ShiftName?.toUpperCase().replace('-', '').trim();
            const loader = r.Loader || 'Unknown';
            const tripVal = Number(r.Trip) || 0;

            if (dumperMap[dumperName][s]) {
                dumperMap[dumperName][s][loader] = (dumperMap[dumperName][s][loader] || 0) + tripVal;
            }
            dumperMap[dumperName].Total += tripVal;
        });

        const rows = Object.values(dumperMap).sort((a, b) => a.Dumper.localeCompare(b.Dumper));

        // 3. Calculate Column Totals (Grand Totals)
        const grandTotals = { Total: 0 }; // { "SHIFTA": { "L1": 10, "L2": 5 }, "Total": 100 }

        headers.forEach(h => {
            grandTotals[h.name] = {};
            h.loaders.forEach(l => {
                grandTotals[h.name][l] = 0;
            });
        });

        rows.forEach(r => {
            grandTotals.Total += r.Total;
            headers.forEach(h => {
                h.loaders.forEach(l => {
                    const val = r[h.name][l] || 0;
                    grandTotals[h.name][l] += val;
                });
            });
        });

        return { headers, rows, grandTotals };

    }, [dumperLoaderDetails]);

    // --- Data Processing for Pivot Layout (Section A) ---
    // Goal: Rows by Scale/EquipmentGroup. Cols: Shift A (Trip, Qty), Shift B, Shift C.
    // Since SP returns: { Scale, ShiftName, Material, Trip... }

    // Process Coal Shift Data
    const coalShiftPivot = useMemo(() => {
        const rows = {}; // Key: "ScaleName" -> { Scale, ShiftA: {}, ShiftB: {}, ShiftC: {} }
        shiftProdCoal.forEach(r => {
            const key = r.Scale;
            if (!rows[key]) rows[key] = { Scale: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };

            const shift = r.ShiftName?.toUpperCase().replace('-', '').trim(); // "SHIFT A" -> "SHIFTA"
            let target = null;
            if (shift === 'SHIFTA') target = rows[key].ShiftA;
            else if (shift === 'SHIFTB') target = rows[key].ShiftB;
            else if (shift === 'SHIFTC') target = rows[key].ShiftC;

            if (target) {
                target.Trip = (target.Trip || 0) + r.Trip;
                target.Qty = (target.Qty || 0) + r.mngQty; // Using mngQty as Qty
            }
        });
        // Calculate Totals per row
        Object.values(rows).forEach(row => {
            row.Total.Trip = (row.ShiftA.Trip || 0) + (row.ShiftB.Trip || 0) + (row.ShiftC.Trip || 0);
            row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);
        });
        return Object.values(rows);
    }, [shiftProdCoal]);

    // Process Coal Crushing Shift Data (Section D)
    const coalCrushingPivot = useMemo(() => {
        const rows = {};
        coalCrushing.forEach(r => {
            const key = r.PlantName;
            if (!rows[key]) rows[key] = { PlantName: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };

            const shift = r.ShiftName?.toUpperCase().replace('-', '').trim();
            let target = null;
            if (shift === 'SHIFTA') target = rows[key].ShiftA;
            else if (shift === 'SHIFTB') target = rows[key].ShiftB;
            else if (shift === 'SHIFTC') target = rows[key].ShiftC;

            if (target) {
                target.Hr = (target.Hr || 0) + r.Hr;
                target.Qty = (target.Qty || 0) + r.EstQty;
            }
        });

        // Calculate Totals per row and Column Totals
        const grandTotal = { ShiftA: { Hr: 0, Qty: 0 }, ShiftB: { Hr: 0, Qty: 0 }, ShiftC: { Hr: 0, Qty: 0 }, Total: { Hr: 0, Qty: 0 } };

        Object.values(rows).forEach(row => {
            row.Total.Hr = (row.ShiftA.Hr || 0) + (row.ShiftB.Hr || 0) + (row.ShiftC.Hr || 0);
            row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);

            grandTotal.ShiftA.Hr += (row.ShiftA.Hr || 0);
            grandTotal.ShiftA.Qty += (row.ShiftA.Qty || 0);

            grandTotal.ShiftB.Hr += (row.ShiftB.Hr || 0);
            grandTotal.ShiftB.Qty += (row.ShiftB.Qty || 0);

            grandTotal.ShiftC.Hr += (row.ShiftC.Hr || 0);
            grandTotal.ShiftC.Qty += (row.ShiftC.Qty || 0);

            grandTotal.Total.Hr += row.Total.Hr;
            grandTotal.Total.Qty += row.Total.Qty;
        });

        return { rows: Object.values(rows), grandTotal };
    }, [coalCrushing]);


    // Process Waste Shift Data (Similar logic)
    const wasteShiftPivot = useMemo(() => {
        const rows = {};
        shiftProdWaste.forEach(r => {
            const key = r.Scale;
            if (!rows[key]) rows[key] = { Scale: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };

            const shift = r.ShiftName?.toUpperCase().replace('-', '').trim();
            let target = null;
            if (shift === 'SHIFTA') target = rows[key].ShiftA;
            else if (shift === 'SHIFTB') target = rows[key].ShiftB;
            else if (shift === 'SHIFTC') target = rows[key].ShiftC;

            if (target) {
                target.Trip = (target.Trip || 0) + r.Trip;
                target.Qty = (target.Qty || 0) + r.mngQty;
            }
        });
        Object.values(rows).forEach(row => {
            row.Total.Trip = (row.ShiftA.Trip || 0) + (row.ShiftB.Trip || 0) + (row.ShiftC.Trip || 0);
            row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);
        });
        return Object.values(rows);
    }, [shiftProdWaste]);


    // --- Aggregation logic for New Sections ---
    const wp1Aggregated = useMemo(() => {
        const agg = { Waste: { FTD: 0, MTD: 0, YTD: 0 }, Coal: { FTD: 0, MTD: 0, YTD: 0 } };
        if (!wp1Excavation || wp1Excavation.length === 0) return agg;
        wp1Excavation.forEach(r => {
            agg.Waste.FTD += Number(r.Waste_FTD || 0);
            agg.Waste.MTD += Number(r.Waste_MTD || 0);
            agg.Waste.YTD += Number(r.Waste_YTD || 0);
            agg.Coal.FTD += Number(r.Coal_FTD || 0);
            agg.Coal.MTD += Number(r.Coal_MTD || 0);
            agg.Coal.YTD += Number(r.Coal_YTD || 0);
        });
        return agg;
    }, [wp1Excavation]);

    const smaslAggregated = useMemo(() => {
        // Assuming single row output or summation if multiple
        const agg = { WasteQty: 0, CoalQty: 0 };
        if (!smaslQuantity || smaslQuantity.length === 0) return agg;
        smaslQuantity.forEach(r => {
            agg.WasteQty += Number(r.WasteQty || 0);
            agg.CoalQty += Number(r.CoalQty || 0);
        });
        return agg;
    }, [smaslQuantity]);

    const inpitAggregated = useMemo(() => {
        // Pivot by Type
        const rows = {}; // "Type" -> { Qty_FTD, ... }
        if (!inpitDumping || inpitDumping.length === 0) return [];
        inpitDumping.forEach(r => {
            const key = r.Type || 'Unknown';
            if (!rows[key]) rows[key] = { Type: key, FTD: 0, MTD: 0, YTD: 0 };
            rows[key].FTD += Number(r.Qty_FTD || 0);
            rows[key].MTD += Number(r.Qty_MTD || 0);
            rows[key].YTD += Number(r.Qty_YTD || 0);
        });

        const rowValues = Object.values(rows);
        const totalRow = { Type: 'Total', FTD: 0, MTD: 0, YTD: 0 };
        rowValues.forEach(r => {
            totalRow.FTD += r.FTD;
            totalRow.MTD += r.MTD;
            totalRow.YTD += r.YTD;
        });
        if (rowValues.length > 0) rowValues.push(totalRow);
        return rowValues;
    }, [inpitDumping]);

    const wp3Aggregated = useMemo(() => {
        const agg = { OB: { FTD: 0, MTD: 0, YTD: 0 }, Coal: { FTD: 0, MTD: 0, YTD: 0 } };
        if (!wp3Excavation || wp3Excavation.length === 0) return agg;
        wp3Excavation.forEach(r => {
            if (r.Type === 'COAL') {
                agg.Coal.FTD += Number(r.Qty_FTD || 0);
                agg.Coal.MTD += Number(r.Qty_MTD || 0);
                agg.Coal.YTD += Number(r.Qty_YTD || 0);
            } else if (r.Type === 'OB' || r.Type === 'OVER BURDEN') {
                agg.OB.FTD += Number(r.Qty_FTD || 0);
                agg.OB.MTD += Number(r.Qty_MTD || 0);
                agg.OB.YTD += Number(r.Qty_YTD || 0);
            }
        });
        return agg;
    }, [wp3Excavation]);


    // Helper for formatting
    const fmt = (val, decimals = 2) => {
        if (val === null || val === undefined || val === '' || val === 0 || val === '0') return '-';
        // Check if value is integer-like for Trips, else decimals
        if (val % 1 === 0 && val < 1000) return val;
        return Number(val).toLocaleString('en-IN', { maximumFractionDigits: decimals });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    // Calculate STRIPIING RATIO dynamically
    const coalTotal_FTD = coalDetails.reduce((s, r) => s + (r.Qty_FTD || 0), 0);
    const wasteTotal_FTD = wasteDetails.reduce((s, r) => s + (r.Qty_FTD || 0), 0);
    const sr_FTD = coalTotal_FTD > 0 ? (wasteTotal_FTD / coalTotal_FTD).toFixed(2) : "0.00";

    const coalTotal_MTD = coalDetails.reduce((s, r) => s + (r.Qty_MTD || 0), 0);
    const wasteTotal_MTD = wasteDetails.reduce((s, r) => s + (r.Qty_MTD || 0), 0);
    const sr_MTD = coalTotal_MTD > 0 ? (wasteTotal_MTD / coalTotal_MTD).toFixed(2) : "0.00";

    const coalTotal_YTD = coalDetails.reduce((s, r) => s + (r.Qty_YTD || 0), 0);
    const wasteTotal_YTD = wasteDetails.reduce((s, r) => s + (r.Qty_YTD || 0), 0);
    const sr_YTD = coalTotal_YTD > 0 ? (wasteTotal_YTD / coalTotal_YTD).toFixed(2) : "0.00";

    return (
        <div className="w-full print:overflow-visible print:block">
            {/* Headers are mostly handled by page layout now, but the internal report sheet headers remain */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', width: '100%' }}>
                {/* Logo - Left */}
                <div style={{ flex: '0 0 100px', display: 'flex', justifyContent: 'flex-start' }}>
                    <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '70px', objectFit: 'contain' }} />
                </div>

                {/* Text Block - Centered */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 0.5rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '4px' }}>THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '6px' }}>PAKRI BARWADIH COAL MINING PROJECT</h2>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1d4ed8', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '8px', textDecoration: 'underline', textUnderlineOffset: '4px' }}>DAILY PRODUCTION REPORT</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: 'bold' }}>
                        <div>Date: {formatDate(date)}</div>
                    </div>
                </div>

                {/* Empty Spacer - Right (for symmetry to center the text exactly) */}
                <div style={{ flex: '0 0 100px' }}></div>
            </div>

            {/* SECTION 1 */}
            <div className="mb-6">
                <h3 className={styles.sectionHeader}>1. SHIFT PRODUCTION DETAILS</h3>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th rowSpan="3">SI No.</th>
                            <th rowSpan="3" className="text-left pl-2">Scale / Model</th>
                            <th colSpan="4">SHIFT-A</th>
                            <th colSpan="4">SHIFT-B</th>
                            <th colSpan="4">SHIFT-C</th>
                            <th colSpan="4">TOTAL</th>
                        </tr>
                        <tr className={styles.blueHeader}>
                            <th colSpan="2">COAL</th>
                            <th colSpan="2">OB</th>
                            <th colSpan="2">COAL</th>
                            <th colSpan="2">OB</th>
                            <th colSpan="2">COAL</th>
                            <th colSpan="2">OB</th>
                            <th colSpan="2">COAL</th>
                            <th colSpan="2">OB</th>
                        </tr>
                        <tr className={styles.blueHeader}>
                            <th>TRIPS</th><th>QTY.</th>
                            <th>TRIP</th><th>QTY.</th>
                            <th>TRIP</th><th>QTY.</th>
                            <th>TRIP</th><th>QTY.</th>
                            <th>TRIP</th><th>QTY.</th>
                            <th>TRIP</th><th>QTY.</th>
                            <th>TRIPS</th><th>QTY.</th>
                            <th>TRIP</th><th>QTY.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Merge Scale Names from Coal/Waste Pivots */}
                        {Array.from(new Set([...coalShiftPivot.map(r => r.Scale), ...wasteShiftPivot.map(r => r.Scale)])).map((scale, i) => {
                            const c = coalShiftPivot.find(r => r.Scale === scale) || { ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };
                            const w = wasteShiftPivot.find(r => r.Scale === scale) || { ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };
                            return (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td className="text-left font-bold">{scale}</td>

                                    {/* Shift A */}
                                    <td>{fmt(c.ShiftA.Trip)}</td><td>{fmt(c.ShiftA.Qty)}</td>
                                    <td>{fmt(w.ShiftA.Trip)}</td><td>{fmt(w.ShiftA.Qty)}</td>

                                    {/* Shift B */}
                                    <td>{fmt(c.ShiftB.Trip)}</td><td>{fmt(c.ShiftB.Qty)}</td>
                                    <td>{fmt(w.ShiftB.Trip)}</td><td>{fmt(w.ShiftB.Qty)}</td>

                                    {/* Shift C */}
                                    <td>{fmt(c.ShiftC.Trip)}</td><td>{fmt(c.ShiftC.Qty)}</td>
                                    <td>{fmt(w.ShiftC.Trip)}</td><td>{fmt(w.ShiftC.Qty)}</td>

                                    {/* Total */}
                                    <td className="font-bold bg-yellow-50">{fmt(c.Total.Trip)}</td><td className="font-bold bg-yellow-50">{fmt(c.Total.Qty)}</td>
                                    <td className="font-bold bg-yellow-50">{fmt(w.Total.Trip)}</td><td className="font-bold bg-yellow-50">{fmt(w.Total.Qty)}</td>
                                </tr>
                            );
                        })}
                        {/* Total Row */}
                        <tr className="bg-yellow-200 font-bold border-t-2 border-slate-900 text-md">
                            <td colSpan="2" className="text-right pr-2 font-bold" style={{ fontWeight: 600 }}>Total</td>

                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(coalShiftPivot.reduce((s, r) => s + (r.ShiftA.Trip || 0), 0))}</td>
                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(coalShiftPivot.reduce((s, r) => s + (r.ShiftA.Qty || 0), 0))}</td>
                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(wasteShiftPivot.reduce((s, r) => s + (r.ShiftA.Trip || 0), 0))}</td>
                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(wasteShiftPivot.reduce((s, r) => s + (r.ShiftA.Qty || 0), 0))}</td>

                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(coalShiftPivot.reduce((s, r) => s + (r.ShiftB.Trip || 0), 0))}</td>
                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(coalShiftPivot.reduce((s, r) => s + (r.ShiftB.Qty || 0), 0))}</td>
                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(wasteShiftPivot.reduce((s, r) => s + (r.ShiftB.Trip || 0), 0))}</td>
                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(wasteShiftPivot.reduce((s, r) => s + (r.ShiftB.Qty || 0), 0))}</td>

                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(coalShiftPivot.reduce((s, r) => s + (r.ShiftC.Trip || 0), 0))}</td>
                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(coalShiftPivot.reduce((s, r) => s + (r.ShiftC.Qty || 0), 0))}</td>
                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(wasteShiftPivot.reduce((s, r) => s + (r.ShiftC.Trip || 0), 0))}</td>
                            <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(wasteShiftPivot.reduce((s, r) => s + (r.ShiftC.Qty || 0), 0))}</td>

                            <td className="font-bold bg-yellow-50" style={{ fontWeight: 600 }}>{fmt(coalShiftPivot.reduce((s, r) => s + (r.Total.Trip || 0), 0))}</td>
                            <td className="font-bold bg-yellow-50" style={{ fontWeight: 600 }}>{fmt(coalShiftPivot.reduce((s, r) => s + (r.Total.Qty || 0), 0))}</td>
                            <td className="font-bold bg-yellow-50" style={{ fontWeight: 600 }}>{fmt(wasteShiftPivot.reduce((s, r) => s + (r.Total.Trip || 0), 0))}</td>
                            <td className="font-bold bg-yellow-50" style={{ fontWeight: 600 }}>{fmt(wasteShiftPivot.reduce((s, r) => s + (r.Total.Qty || 0), 0))}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* SECTION 2 */}
            <div className="mb-8">
                <h3 className={styles.sectionHeader}>2. TRIP-QUANTITY DETAILS</h3>

                <div className="flex flex-col gap-4">
                    {/* COAL TABLE */}
                    <div className="w-full">
                        <div className="font-bold text-left uppercase text-md mb-1 uppercase">COAL</div>
                        <table className={`${styles.table} w-full`}>
                            <thead>
                                <tr className={styles.blueHeader}>
                                    <th rowSpan="2" className="min-w-[120px]">Scale / Model</th>
                                    <th colSpan="2" className="text-red-600 bg-blue-50">FTD</th>
                                    <th colSpan="2" className="text-red-600 bg-blue-50">MTD</th>
                                    <th colSpan="2" className="text-red-600 bg-blue-50">YTD</th>
                                </tr>
                                <tr className={styles.blueHeader}>
                                    <th>TRIP</th><th>QTY.</th>
                                    <th>TRIPS</th><th>QTY.</th>
                                    <th>TRIPS</th><th>QTY.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coalDetails.map((row, i) => (
                                    <tr key={i}>
                                        <td className="font-bold text-left pl-2">{row.Scale}</td>
                                        <td>{fmt(row.Trip_FTD)}</td><td>{fmt(row.Qty_FTD)}</td>
                                        <td>{fmt(row.Trip_MTD)}</td><td>{fmt(row.Qty_MTD)}</td>
                                        <td>{fmt(row.Trip_YTD)}</td><td>{fmt(row.Qty_YTD)}</td>
                                    </tr>
                                ))}
                                {/* Total Row for Coal */}
                                <tr className="bg-yellow-200 font-extrabold border-t border-slate-400">
                                    <td className="text-right pr-2">Total</td>
                                    <td>{fmt(coalDetails.reduce((s, r) => s + r.Trip_FTD, 0))}</td>
                                    <td>{fmt(coalDetails.reduce((s, r) => s + r.Qty_FTD, 0))}</td>
                                    <td>{fmt(coalDetails.reduce((s, r) => s + r.Trip_MTD, 0))}</td>
                                    <td>{fmt(coalDetails.reduce((s, r) => s + r.Qty_MTD, 0))}</td>
                                    <td>{fmt(coalDetails.reduce((s, r) => s + r.Trip_YTD, 0))}</td>
                                    <td>{fmt(coalDetails.reduce((s, r) => s + r.Qty_YTD, 0))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* OB TABLE */}
                    <div className="w-full mt-4">
                        <div className="font-bold text-left uppercase text-md mb-1 uppercase">OB</div>
                        <table className={`${styles.table} w-full`}>
                            <thead>
                                <tr className={styles.blueHeader}>
                                    <th rowSpan="2" className="min-w-[120px]">Scale / Model</th>
                                    <th colSpan="2" className="text-red-600 bg-blue-50">FTD</th>
                                    <th colSpan="2" className="text-red-600 bg-blue-50">MTD</th>
                                    <th colSpan="2" className="text-red-600 bg-blue-50">YTD</th>
                                </tr>
                                <tr className={styles.blueHeader}>
                                    <th>TRIP</th><th>QTY (BCM)</th>
                                    <th>TRIPS</th><th>QTY (BCM)</th>
                                    <th>TRIPS</th><th>QTY (BCM)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wasteDetails.map((row, i) => (
                                    <tr key={i}>
                                        <td className="font-bold text-left pl-2">{row.Scale}</td>
                                        <td>{fmt(row.Trip_FTD)}</td><td>{fmt(row.Qty_FTD)}</td>
                                        <td>{fmt(row.Trip_MTD)}</td><td>{fmt(row.Qty_MTD)}</td>
                                        <td>{fmt(row.Trip_YTD)}</td><td>{fmt(row.Qty_YTD)}</td>
                                    </tr>
                                ))}
                                {/* Total Row for Waste */}
                                <tr className="bg-yellow-200 font-extrabold border-t border-slate-400">
                                    <td className="text-right pr-2">Total</td>
                                    <td>{fmt(wasteDetails.reduce((s, r) => s + r.Trip_FTD, 0))}</td>
                                    <td>{fmt(wasteDetails.reduce((s, r) => s + r.Qty_FTD, 0))}</td>
                                    <td>{fmt(wasteDetails.reduce((s, r) => s + r.Trip_MTD, 0))}</td>
                                    <td>{fmt(wasteDetails.reduce((s, r) => s + r.Qty_MTD, 0))}</td>
                                    <td>{fmt(wasteDetails.reduce((s, r) => s + r.Trip_YTD, 0))}</td>
                                    <td>{fmt(wasteDetails.reduce((s, r) => s + r.Qty_YTD, 0))}</td>
                                </tr>
                                {/* STRIPING RATIO ROW */}
                                <tr className="font-bold border-t border-slate-400">
                                    <td className="text-left pl-2">STRIPING RATIO</td>
                                    <td colSpan={2} className="text-center">1 : {sr_FTD}</td>
                                    <td colSpan={2} className="text-center">1 : {sr_MTD}</td>
                                    <td colSpan={2} className="text-center">1 : {sr_YTD}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>



            {/* Spacer */}
            <div className="h-8"></div>

            {/* SECTION 3 */}
            <div className="col-span-2 mt-4">
                <h3 className={styles.sectionHeader}>3. COAL CRUSHING DETAILS</h3>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th rowSpan="2">Plant / Crusher</th>
                            <th colSpan="2" className="text-red-600 border-l border-slate-600">SHIFT-A</th>
                            <th colSpan="2" className="text-red-600 border-l border-slate-600">SHIFT-B</th>
                            <th colSpan="2" className="text-red-600 border-l border-slate-600">SHIFT-C</th>
                            <th colSpan="2" className="bg-slate-200 border-l border-slate-800">TOTAL</th>
                        </tr>
                        <tr className={styles.blueHeader}>
                            <th className="border-l border-slate-600">Hr.</th><th>Est.Qty</th>
                            <th className="border-l border-slate-600">Hr.</th><th>Est.Qty</th>
                            <th className="border-l border-slate-600">Hr.</th><th>Est.Qty</th>
                            <th className="bg-slate-200 border-l border-slate-800">Hr.</th><th className="bg-slate-200">Est.Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coalCrushingPivot.rows.map((r, i) => (
                            <tr key={i}>
                                <td className="font-bold text-left pl-2">{r.PlantName}</td>
                                <td className="border-l border-slate-600">{fmt(r.ShiftA.Hr)}</td><td>{fmt(r.ShiftA.Qty)}</td>
                                <td className="border-l border-slate-600">{fmt(r.ShiftB.Hr)}</td><td>{fmt(r.ShiftB.Qty)}</td>
                                <td className="border-l border-slate-600">{fmt(r.ShiftC.Hr)}</td><td>{fmt(r.ShiftC.Qty)}</td>
                                <td className="border-l border-slate-800 font-bold bg-slate-50">{fmt(r.Total.Hr)}</td><td className="font-bold bg-slate-50">{fmt(r.Total.Qty)}</td>
                            </tr>
                        ))}
                        <tr className="bg-slate-300 font-extrabold border-t-2 border-slate-800">
                            <td className="text-right pr-2">Total</td>
                            <td className="border-l border-slate-600">{fmt(coalCrushingPivot.grandTotal.ShiftA.Hr)}</td><td>{fmt(coalCrushingPivot.grandTotal.ShiftA.Qty)}</td>
                            <td className="border-l border-slate-600">{fmt(coalCrushingPivot.grandTotal.ShiftB.Hr)}</td><td>{fmt(coalCrushingPivot.grandTotal.ShiftB.Qty)}</td>
                            <td className="border-l border-slate-600">{fmt(coalCrushingPivot.grandTotal.ShiftC.Hr)}</td><td>{fmt(coalCrushingPivot.grandTotal.ShiftC.Qty)}</td>
                            <td className="border-l border-slate-800">{fmt(coalCrushingPivot.grandTotal.Total.Hr)}</td><td>{fmt(coalCrushingPivot.grandTotal.Total.Qty)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* F & G */}
            <div className="grid grid-cols-2 gap-4 mt-4 print:block print:space-y-4">
                {/* SECTION 4. BLASTING */}
                <div className="print:break-inside-avoid print:mb-4">
                    <h3 className={styles.sectionHeader}>4. BLASTING DETAILS</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th>Parameters</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blasting.map((r, i) => (
                                <React.Fragment key={i}>
                                    <tr><td>No. of Holes</td><td>{r.Noofholesblasted}</td></tr>
                                    <tr><td>Explosive (kg)</td><td>{fmt(r.ExplosiveCosumed)}</td></tr>
                                    <tr><td>Drilling (Mtr)</td><td>{fmt(r.TotalMetersDrilled)}</td></tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* G. REHANDLING */}
                <div className="print:break-inside-avoid print:mb-4">
                    {/* 5. CRUSHER COAL QTY. */}
                    <div className="mb-8 print:mb-4">
                        <h3 className={styles.sectionHeader}>5. CRUSHER COAL QTY.</h3>

                        <table className={`${styles.table} w-full text-center border-collapse mt-2`}>
                            <thead>
                                <tr className={styles.blueHeader}>
                                    <th className="border border-slate-400"></th>
                                    <th className="border border-slate-400 text-red-600">FTD</th>
                                    <th className="border border-slate-400 text-red-600">MTD</th>
                                    <th className="border border-slate-400 text-red-600">YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {crusherCoalQty && crusherCoalQty.length > 0 ? crusherCoalQty.map((row, i) => (
                                    <tr key={i} className="font-bold">
                                        <td className="text-left pl-2 border border-slate-400">QTY.</td>
                                        <td className="border border-slate-400">{fmt(row.Qty_FTD)}</td>
                                        <td className="border border-slate-400">{fmt(row.Qty_MTD)}</td>
                                        <td className="border border-slate-400">{fmt(row.Qty_YTD)}</td>
                                    </tr>
                                )) : <tr><td colSpan="4">No Data</td></tr>}
                            </tbody>
                        </table>
                    </div>


                </div>
            </div>



            {/* GRID FOR SECTIONS 7, 8, 9, 10 (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-8 mt-8 print:block print:space-y-4 print:mt-4">



                {/* 6. SMASL QUANTITY (FTD) */}
                <div className="print:break-inside-avoid print:mb-4">
                    <h3 className={styles.sectionHeader}>6. SMASL Quantity (FTD)</h3>
                    <table className={`${styles.table} w-full text-center`}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="border border-slate-400"></th>
                                <th className="border border-slate-400 text-red-600">Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="font-bold"><td className="text-left pl-2">OB (BCM)</td><td>{fmt(smaslAggregated.WasteQty)}</td></tr>
                            <tr className="font-bold"><td className="text-left pl-2">Coal(MT)</td><td>{fmt(smaslAggregated.CoalQty)}</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* 7. INPIT DUMPING */}
                <div className="print:break-inside-avoid print:mb-4">
                    <h3 className={styles.sectionHeader}>7. INPIT DUMPING</h3>
                    <table className={`${styles.table} w-full text-center`}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="border border-slate-400"></th>
                                <th className="border border-slate-400 text-red-600">FTD</th>
                                <th className="border border-slate-400 text-red-600">MTD</th>
                                <th className="border border-slate-400 text-red-600">YTD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inpitAggregated.length > 0 ? inpitAggregated.map((row, i) => (
                                <tr key={i} className={row.Type === 'Total' ? 'font-bold bg-yellow-50' : ''}>
                                    <td className="text-left pl-2 font-bold">{row.Type}</td>
                                    <td>{fmt(row.FTD)}</td>
                                    <td>{fmt(row.MTD)}</td>
                                    <td>{fmt(row.YTD)}</td>
                                </tr>
                            )) : <tr><td colSpan="4">No Data</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* 8. WP-3 EXCAVATION DETAIL */}
                <div className="print:break-inside-avoid print:mb-4">
                    <h3 className={styles.sectionHeader}>8. WP-3 EXCAVATION DETAIL</h3>
                    <table className={`${styles.table} w-full text-center`}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="border border-slate-400"></th>
                                <th className="border border-slate-400 text-red-600">FTD</th>
                                <th className="border border-slate-400 text-red-600">MTD</th>
                                <th className="border border-slate-400 text-red-600">YTD</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="font-bold"><td className="text-left pl-2">OB</td><td>{fmt(wp3Aggregated.OB.FTD)}</td><td>{fmt(wp3Aggregated.OB.MTD)}</td><td>{fmt(wp3Aggregated.OB.YTD)}</td></tr>
                            <tr className="font-bold"><td className="text-left pl-2">COAL</td><td>{fmt(wp3Aggregated.Coal.FTD)}</td><td>{fmt(wp3Aggregated.Coal.MTD)}</td><td>{fmt(wp3Aggregated.Coal.YTD)}</td></tr>
                        </tbody>
                    </table>
                </div>

            </div>

            {/* H. DUMPER-LOADER TRIP DETAILS */}
            <div className="mt-8">
                {remarks.length > 0 && (
                    <div className="mb-2 p-2 border border-slate-300 bg-yellow-50 text-sm font-bold text-slate-800">
                        Remarks :- {remarks.map(r => r.Remarks).join(' | ')}
                    </div>
                )}

                <table className={`${styles.table} w-full text-xs`}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th rowSpan="2" className="w-8 relative p-0 border border-slate-400" style={{ backgroundColor: '#bfdbfe' }}>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold tracking-widest whitespace-nowrap" style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}>Dumper</div>
                            </th>
                            <th rowSpan="2" className="border border-slate-400" style={{ backgroundColor: '#bfdbfe' }}>FACTOR</th>
                            {dumperPivot.headers.map(h => (
                                <th key={h.name} colSpan={h.loaders.length > 0 ? h.loaders.length : 1} className="border border-slate-400 text-red-600 font-bold" style={{ backgroundColor: '#bfdbfe' }}>
                                    {h.name === 'SHIFTA' ? 'SHIFT-A' : h.name === 'SHIFTB' ? 'SHIFT-B' : 'SHIFT-C'}
                                </th>
                            ))}
                            <th rowSpan="2" className="border border-slate-400 w-12 text-red-600 font-bold" style={{ backgroundColor: '#fef08a' }}>
                                TOTAL
                            </th>
                        </tr>
                        <tr className={styles.blueHeader}>
                            {dumperPivot.headers.map(h => (
                                h.loaders.length > 0 ?
                                    h.loaders.map(l => (
                                        <th key={l} className="border border-slate-400 min-w-[30px] align-bottom h-24" style={{ backgroundColor: '#bfdbfe' }}>
                                            <div className="mx-auto whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                {l}
                                            </div>
                                        </th>
                                    ))
                                    : <th key={h.name + '-empty'} className="border border-slate-400" style={{ backgroundColor: '#bfdbfe' }}></th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {dumperPivot.rows.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="font-bold text-left pl-1 border border-slate-300 bg-slate-50">{row.Dumper}</td>
                                <td className="border border-slate-300">{row.Factor}</td>

                                {dumperPivot.headers.map(h => (
                                    h.loaders.length > 0 ?
                                        h.loaders.map(l => {
                                            const val = row[h.name][l];
                                            return <td key={l} className="border border-slate-300 text-center">{fmt(val)}</td>
                                        })
                                        : <td key={h.name} className="border border-slate-300"></td>
                                ))}

                                <td className="font-bold border border-slate-300" style={{ backgroundColor: '#fef08a' }}>{row.Total}</td>
                            </tr>
                        ))}

                        {/* SUB TOTAL ROW */}
                        <tr className="font-extrabold border-t-2 border-slate-900" style={{ backgroundColor: '#fef08a' }}>
                            <td colSpan="2" className="text-right pr-2 border border-slate-400">SUB TOTAL</td>

                            {dumperPivot.headers.map(h => (
                                h.loaders.length > 0 ?
                                    h.loaders.map(l => (
                                        <td key={l} className="border border-slate-400 text-center">
                                            {fmt(dumperPivot.grandTotals[h.name][l] || 0)}
                                        </td>
                                    ))
                                    : <td key={h.name} className="border border-slate-400"></td>
                            ))}

                            <td className="border border-slate-400 text-red-600" style={{ backgroundColor: '#fef08a' }}>{dumperPivot.grandTotals.Total}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
