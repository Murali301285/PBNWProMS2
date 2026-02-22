
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SearchableSelect from '@/components/SearchableSelect';
import ReportTable from '@/components/reports/ReportTable';
import styles from './OperatorHauling.module.css';

export default function OperatorPerformanceHaulingReport() {
    const today = new Date().toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);

    // Filters
    const [allOperators, setAllOperators] = useState([]);
    const [allEquipment, setAllEquipment] = useState([]);
    const [allRelays, setAllRelays] = useState([]);
    const [shifts, setShifts] = useState([]);

    const [selectedOperators, setSelectedOperators] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState([]);
    const [selectedRelay, setSelectedRelay] = useState([]);
    const [selectedShift, setSelectedShift] = useState([]);

    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchHelpers = async () => {
            try {
                // Fetch Helpers
                const resHelpers = await fetch('/api/reports/operator-performance-hauling/helpers');
                const dataHelpers = await resHelpers.json();
                if (dataHelpers.operators) setAllOperators(dataHelpers.operators);
                if (dataHelpers.equipment) setAllEquipment(dataHelpers.equipment);
                if (dataHelpers.relays) setAllRelays(dataHelpers.relays);

                // Fetch Shifts
                const resShifts = await fetch('/api/master/shift');
                const dataShifts = await resShifts.json();
                if (Array.isArray(dataShifts)) setShifts(dataShifts);
                else if (dataShifts.success && dataShifts.data) setShifts(dataShifts.data);

            } catch (error) {
                console.error("Error fetching helpers:", error);
                toast.error("Failed to load filters");
            }
        };
        fetchHelpers();
    }, []);

    const handleGenerate = async () => {
        if (!fromDate || !toDate) {
            toast.error("Please select both dates");
            return;
        }

        setIsLoading(true);
        setIsGenerated(true);
        setReportData([]);

        try {
            const payload = {
                fromDate,
                toDate,
                operatorIds: selectedOperators,
                haulingMachineIds: selectedEquipment,
                relayIds: selectedRelay,
                shiftIds: selectedShift
            };

            const res = await fetch('/api/reports/operator-performance-hauling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to fetch report");

            const data = await res.json();
            setReportData(data);
            if (data.length === 0) toast.info("No records found for selected criteria");

        } catch (error) {
            console.error("Error generating report:", error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Format options for SearchableSelect
    const operatorOptions = useMemo(() => allOperators.map(op => ({ id: op.id, name: op.name })), [allOperators]);
    const equipmentOptions = useMemo(() => allEquipment.map(eq => ({ id: eq.id, name: eq.name })), [allEquipment]);
    const relayOptions = useMemo(() => allRelays.map(r => ({ id: r.id, name: r.name })), [allRelays]);
    const shiftOptions = useMemo(() => shifts.map(s => ({ id: s.SlNo, name: s.ShiftName })), [shifts]);

    // Define table columns
    const columns = useMemo(() => [
        { header: 'Sl No', accessor: 'SlNo', width: '60px' },
        { header: 'Date', accessor: 'Date', width: '100px', render: r => new Date(r.Date).toLocaleDateString('en-GB') },
        { header: "Operator's Name", accessor: "OPERATOR'S NAME", width: '200px' },
        { header: 'Shift', accessor: 'SHIFT', width: '80px' },

        // Fixed Accessors
        { header: 'Hauling Equipment', accessor: 'EQUIPMENT NO.', width: '150px' },
        { header: 'Model', accessor: 'MODEL', width: '150px' },

        { header: 'Relay', accessor: 'RELAY', width: '120px' },
        { header: 'Open HMR', accessor: 'Open HMR', width: '100px' },
        { header: 'Close HMR', accessor: 'Close HMR', width: '100px' }, // Matched Case
        { header: 'Net HMR', accessor: 'Net HMR', width: '100px' },

        { header: 'OB Trips', accessor: 'OB TRIPS', width: '100px' },
        { header: 'Quantity (BCM)', accessor: 'OB QTY', width: '120px' }, // Matched SP
        { header: 'Coal Trips', accessor: 'COAL TRIPS', width: '100px' },
        { header: 'Quantity (MT)', accessor: 'COAL QTY', width: '120px' }, // Matched SP

        { header: 'OKMR', accessor: 'Open KMR', width: '100px' }, // Matched SP
        { header: 'CKMR', accessor: 'Close KMR', width: '100px' }, // Matched SP
        { header: 'Net KMR', accessor: 'Net KMR', width: '100px' },

        // Metrics (Calculated in SP or UI? SP doesn't return these yet, leaving as is or placeholders)
        // { header: 'Trip/Hrs', accessor: 'TRIP/HRS', width: '100px' },
        // { header: 'BCM/Hrs', accessor: 'BCM/HRS', width: '100px' },
        // { header: 'Total Trip', accessor: 'Total Trip', width: '100px' },

        // { header: 'Mapio Name', accessor: 'Mapio Name', width: '150px' },
        // { header: 'Model (Dup)', accessor: 'Model', width: '150px' }, 
        // { header: 'Speed', accessor: 'Speed', width: '100px' },
        // { header: 'Lead', accessor: 'Lead', width: '100px' },

        // { header: 'Shift Incharge (Large Scale)', accessor: 'Shift Incharge(Large Scale)', width: '200px' },
        // { header: 'Shift Incharge - Mid Scale', accessor: 'Shift Incharge - Mid Scale', width: '200px' },
    ], []);


    const handleExportExcel = async (sortedData, visibleCols) => {
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Operator Performance');

            const maxColSpan = visibleCols.length > 0 ? visibleCols.length : 15;

            // 1. Calculate max widths for dynamic columns
            const maxColWidths = {};
            visibleCols.forEach(col => {
                // Determine which columns dynamically scale
                if (col.accessor === "OPERATOR'S NAME" || col.accessor === 'EQUIPMENT NO.' || col.accessor === 'MODEL' || col.accessor === 'Shift Incharge(Large Scale)' || col.accessor === 'Shift Incharge - Mid Scale') {
                    let maxLen = col.header.length;
                    sortedData.forEach((row, rIdx) => {
                        let val = row[col.accessor];
                        if (col.render) {
                            const res = col.render(row, rIdx);
                            if (res !== null && typeof res !== 'object') val = res;
                        }
                        if (val !== null && val !== undefined) {
                            const len = String(val).length;
                            if (len > maxLen) maxLen = len;
                        }
                    });
                    maxColWidths[col.accessor] = Math.min(Math.max((maxLen * 1.2) + 2, 20), 80);
                }
            });

            // 2. Custom width assignment
            ws.columns = Array(maxColSpan + 1).fill(0).map((_, i) => {
                if (i === 0) return { width: 3 }; // Padding

                const colDef = visibleCols[i - 1];
                let w = 15;
                if (colDef) {
                    if (colDef.accessor === 'SlNo') w = 8;
                    else if (maxColWidths[colDef.accessor]) {
                        w = maxColWidths[colDef.accessor];
                    }
                }
                return { width: w };
            });

            // 3. Freeze panes (freeze up to OPERATOR'S NAME, and freeze headers)
            let freezeCol = 4; // Default to D if not found
            const eqIdx = visibleCols.findIndex(c => c.accessor === "OPERATOR'S NAME");
            if (eqIdx !== -1) freezeCol = eqIdx + 2;

            ws.views = [
                { state: 'frozen', xSplit: freezeCol, ySplit: 6 } // Freeze up to Operator, and freeze row 6 (headers)
            ];

            // 4. Logo
            let logoId;
            try {
                const logoRes = await fetch('/Asset/Logo.png');
                const arrayBuffer = await logoRes.arrayBuffer();
                logoId = wb.addImage({
                    buffer: arrayBuffer,
                    extension: 'png',
                });
            } catch (e) {
                console.error('Logo add failed', e);
            }

            const setCell = (cell, value, opts = {}) => {
                if (value !== undefined) cell.value = value;
                cell.font = {
                    name: 'Calibri',
                    size: opts.fontSize || 10,
                    bold: opts.bold || false,
                    underline: opts.underline || false,
                    color: { argb: opts.color || 'FF000000' }
                };
                cell.alignment = {
                    horizontal: opts.align || 'center',
                    vertical: 'middle',
                    wrapText: true
                };
                if (opts.bg) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg } };
                }
                if (opts.border !== false) {
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                }
                if (opts.numFmt) {
                    cell.numFmt = opts.numFmt;
                }
            };

            ws.getRow(1).height = 15;

            const endColLetter = ws.getColumn(maxColSpan + 1).letter;

            ws.mergeCells(`B2:${endColLetter}2`);
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:${endColLetter}3`);
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:${endColLetter}4`);
            setCell(ws.getCell('B4'), "Operator Performance Report - Hauling", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(`B5:${endColLetter}5`);
            let fDate = fromDate, tDate = toDate;
            if (fDate && fDate.includes('-')) fDate = fDate.split('-').reverse().join('/');
            if (tDate && tDate.includes('-')) tDate = tDate.split('-').reverse().join('/');

            const dateStr = `From Date: ${fDate}        To Date: ${tDate}`;
            setCell(ws.getCell('B5'), dateStr, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.getRow(2).height = 30;
            ws.getRow(3).height = 22;
            ws.getRow(4).height = 20;
            ws.getRow(5).height = 18;

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 100, height: 90 }
                });
            }

            let currentRowIdx = 6;

            // Headers
            const rowHeader = ws.getRow(currentRowIdx);
            visibleCols.forEach((col, i) => {
                setCell(rowHeader.getCell(i + 2), col.header, { bold: true, bg: 'FFBFDBFE' });
            });
            rowHeader.height = 25;
            currentRowIdx++;

            // Data Rows
            sortedData.forEach((row, rIdx) => {
                const dataRow = ws.getRow(currentRowIdx);
                visibleCols.forEach((col, cIdx) => {
                    let val = row[col.accessor];

                    if (col.accessor === 'SlNo') val = rIdx + 1;
                    if (col.render) {
                        const res = col.render(row, rIdx);
                        if (res !== null && typeof res !== 'object') val = res;
                    }

                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null && col.accessor !== 'Date') {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';
                    }

                    // Remove comma parsing for HMR and KMR readings if they are numeric
                    // These are just meter reading codes, probably shouldn't have commas
                    if (val !== null && val !== undefined) {
                        if (['Open HMR', 'Close HMR', 'Net HMR', 'Open KMR', 'Close KMR', 'Net KMR'].includes(col.accessor)) {
                            nFmt = '0.00'; // Actually keep decimals for HMR, but no comma
                            if (val % 1 === 0) nFmt = '0';
                        }
                    }

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, {
                        numFmt: nFmt,
                        align: (col.accessor === "OPERATOR'S NAME" || col.accessor === 'EQUIPMENT NO.' || col.accessor === 'MODEL' || col.accessor === 'Shift Incharge(Large Scale)' || col.accessor === 'Shift Incharge - Mid Scale') ? 'left' : 'center'
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Operator_Performance_Hauling_${fDate.replace(/\//g, '-')}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Operator Performance Report - Hauling</h1>
                <p className={styles.subtitle}>
                    Detailed performance metrics per operator (Hauling Machines)
                </p>
            </div>

            <div className={styles.filterContainer}>
                {/* Date Filter */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>
                        From Date
                    </label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>
                        To Date
                    </label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className={styles.input}
                    />
                </div>

                {/* Shift Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '150px' }}>
                    <label className={styles.label}>
                        Shift
                    </label>
                    <SearchableSelect
                        options={shiftOptions}
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value)}
                        multiple
                        placeholder="All Shifts"
                    />
                </div>

                {/* Operator Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>
                        Operator
                    </label>
                    <SearchableSelect
                        options={operatorOptions}
                        value={selectedOperators}
                        onChange={(e) => setSelectedOperators(e.target.value)}
                        multiple
                        placeholder="All Operators"
                    />
                </div>

                {/* Equipment Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>
                        Hauler
                    </label>
                    <SearchableSelect
                        options={equipmentOptions}
                        value={selectedEquipment}
                        onChange={(e) => setSelectedEquipment(e.target.value)}
                        multiple
                        placeholder="All Haulers"
                    />
                </div>

                {/* Relay Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '150px' }}>
                    <label className={styles.label}>
                        Relay
                    </label>
                    <SearchableSelect
                        options={relayOptions}
                        value={selectedRelay}
                        onChange={(e) => setSelectedRelay(e.target.value)}
                        multiple
                        placeholder="All Relays"
                    />
                </div>


                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className={styles.generateBtn}
                    style={{ marginTop: 'auto', marginBottom: '2px' }}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Search size={16} />
                            Generate View
                        </>
                    )}
                </button>
            </div>

            <ReportTable
                columns={columns}
                data={reportData}
                loading={isLoading}
                generated={isGenerated}
                reportName="Operator Performance - Hauling"
                fromDate={fromDate}
                toDate={toDate}
                stickyLeft={4}
                stickyBgColor="#e0f2fe"
                onExportExcel={handleExportExcel}
            />
        </div >
    );
}
