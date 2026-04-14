
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SearchableSelect from '@/components/SearchableSelect';
import ReportTable from '@/components/reports/ReportTable';
import styles from './OperatorPerformance.module.css';

export default function OperatorPerformanceReport() {
    const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);
    
    const [fromDate, setFromDate] = useState(firstDayStr);
    const [toDate, setToDate] = useState(todayStr);

    // Filters
    const [allOperators, setAllOperators] = useState([]);
    const [selectedOperators, setSelectedOperators] = useState([]); // Multi-select ID array

    const [allActivities, setAllActivities] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]); // Multi-select ID array

    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        fetchHelpers();
    }, []);

    const fetchHelpers = async () => {
        try {
            const res = await fetch('/api/reports/operator-performance-loading/helpers');
            const data = await res.json();
            if (data.operators) setAllOperators(data.operators);
            if (data.activities) setAllActivities(data.activities);
        } catch (error) {
            console.error("Error fetching helpers:", error);
            toast.error("Failed to load filters");
        }
    };

    const handleGenerate = async () => {
        if (!fromDate || !toDate) {
            toast.error("Please select both dates");
            return;
        }

        setIsLoading(true);
        setIsGenerated(true);
        try {
            const payload = {
                fromDate,
                toDate,
                operatorIds: selectedOperators, // Array of IDs
                activityIds: selectedActivities
            };

            const res = await fetch('/api/reports/operator-performance-loading', {
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

    const operatorOptions = useMemo(() => allOperators.map(op => ({
        id: op.id,
        name: op.name
    })), [allOperators]);

    const activityOptions = useMemo(() => allActivities.map(act => ({
        id: act.id,
        name: act.name
    })), [allActivities]);

    // Define table columns
    const columns = useMemo(() => [
        { header: 'SlNo', accessor: 'SlNo', width: '60px' },
        { header: 'Date', accessor: 'Date', width: '100px', type: 'date' },
        { header: "Operator's Name", accessor: "OPERATOR'S NAME", width: '200px' },
        { header: 'Shift', accessor: 'SHIFT', width: '80px' },
        { header: 'Vehicle No', accessor: 'LOADING EQUIPMENT', width: '150px' },
        { header: 'Vehicle Model', accessor: 'MODEL', width: '150px' },
        { header: 'Sector', accessor: 'SECTOR', width: '120px' },
        { header: 'Relay', accessor: 'RELAY', width: '120px' },
        { header: 'E.H Start', accessor: 'Open HMR', width: '100px' },
        { header: 'E.H Close', accessor: 'Close HMR', width: '100px' },
        { header: 'W.Hr', accessor: 'Net HMR', width: '100px' },
        { header: 'OB Trips', accessor: 'OB TRIPS', width: '100px' },
        { header: 'Quantity (BCM)', accessor: 'QUANTITY (BCM)', width: '120px' },
        { header: 'Coal Trips', accessor: 'COAL TRIPS', width: '100px' },
        { header: 'Quantity(MT)', accessor: 'QUANTITY (MT)', width: '120px' },
        { header: 'Trip/Hrs', accessor: 'TOTAL TRIPS PER HR', width: '120px' },
        { header: 'BCM/Hrs', accessor: 'TOTAL BCM/HR', width: '120px' },
        { header: 'Mid Scale - Shift Incharge', accessor: 'Shift Incharge - Mid Scale', width: '200px' },
        { header: 'Large Scale - Shift Incharge', accessor: 'Shift Incharge(Large Scale)', width: '200px' }
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
                if (col.accessor === "OPERATOR'S NAME" || col.accessor === 'LOADING EQUIPMENT' || col.accessor === 'Shift Incharge(Large Scale)' || col.accessor === 'Shift Incharge - Mid Scale') {
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

            // 3. Freeze panes (freeze up to Vehicle No, and freeze headers)
            let freezeCol = 5; // Default to E if not found
            const eqIdx = visibleCols.findIndex(c => c.accessor === 'LOADING EQUIPMENT');
            if (eqIdx !== -1) freezeCol = eqIdx + 2;

            ws.views = [
                { state: 'frozen', xSplit: freezeCol, ySplit: 6 } // Freeze up to Vehicle No, and freeze row 6 (headers)
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
            setCell(ws.getCell('B4'), "Operator Performance Report - Loading", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(`B5:${endColLetter}5`);
            let fDate = fromDate, tDate = toDate;
            if (fDate && fDate.includes('-') && fDate.split('-')[0].length === 4) fDate = fDate ? new Date(fDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';
            if (tDate && tDate.includes('-') && tDate.split('-')[0].length === 4) tDate = tDate ? new Date(tDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';

            const dateStr = `From: ${fDate}        To: ${tDate}`;
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

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, {
                        numFmt: nFmt,
                        align: (col.accessor === "OPERATOR'S NAME" || col.accessor === 'LOADING EQUIPMENT' || col.accessor === 'Shift Incharge(Large Scale)' || col.accessor === 'Shift Incharge - Mid Scale') ? 'left' : 'center'
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Operator_Performance_Loading_${fDate.replace(/\//g, '-')}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Operator Performance Report - Loading</h1>
                <p className={styles.subtitle}>
                    Detailed performance metrics per operator (Loading Machines)
                </p>
            </div>

            <div className={styles.filterContainer}>
                {/* Date Filter */}
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

                {/* Activity Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>
                        Activity
                    </label>
                    <SearchableSelect
                        options={activityOptions}
                        value={selectedActivities}
                        onChange={(e) => setSelectedActivities(e.target.value)}
                        multiple
                        placeholder="All Activities"
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
                reportName="Operator Performance - Loading"
                fromDate={fromDate ? new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}
                toDate={toDate ? new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}
                stickyLeft={5}
                stickyBgColor="#e0f2fe"
                onExportExcel={handleExportExcel}
            />
        </div>
    );
}
