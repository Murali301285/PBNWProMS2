'use client';

import { useState, useEffect, useMemo } from 'react';
import ReportTable from '@/components/reports/ReportTable';
import { toast } from 'sonner';
import { Search, Loader2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect'; // Assuming this exists, based on other reports

import styles from './EquipmentPerformance.module.css';

/**
 * Equipment Performance Report
 * Shows Shift-wise, FTD, and MTD performance metrics per equipment
 */
export default function EquipmentPerformanceReport() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);

    // Filters
    const [activityOptions, setActivityOptions] = useState([]);
    const [equipmentOptions, setEquipmentOptions] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]); // Array of IDs
    const [selectedEquipment, setSelectedEquipment] = useState([]); // Array of IDs
    const [operatorOptions, setOperatorOptions] = useState([]);
    const [selectedOperators, setSelectedOperators] = useState([]);

    // Master Data (Full list to filter locally)
    const [allEquipment, setAllEquipment] = useState([]);

    // State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Fetch Helper Data
    useEffect(() => {
        const fetchHelpers = async () => {
            try {
                const res = await fetch('/api/reports/equipment-performance/helpers');
                const data = await res.json();

                if (data.activities) setActivityOptions(data.activities);
                if (data.operators) setOperatorOptions(data.operators);
                if (data.equipment) {
                    setAllEquipment(data.equipment);
                    setEquipmentOptions(data.equipment); // Default show all
                }
            } catch (error) {
                console.error("Error fetching helpers:", error);
                toast.error("Failed to load filter options");
            } finally {
                setInitializing(false);
            }
        };

        fetchHelpers();
    }, []);

    // Filter Equipment based on Activity Selection
    useEffect(() => {
        if (selectedActivities.length === 0) {
            setEquipmentOptions(allEquipment);
        } else {
            // Filter equipment where ActivityId matches selected activities (IDs)
            const filtered = allEquipment.filter(eq => selectedActivities.includes(eq.ActivityId));
            setEquipmentOptions(filtered);
        }
    }, [selectedActivities, allEquipment]);

    // Columns Configuration
    const columns = useMemo(() => [
        // Fixed Columns
        { header: 'Sl.No', accessor: 'SlNo', width: '60px' },
        { header: 'Prodsys Code', accessor: 'PMS Code', width: '100px' },
        { header: 'Cost Center', accessor: 'CostCenter', width: '100px' },
        { header: 'Equ. Name', accessor: 'Equipment', width: '180px' },
        { header: 'Equ Model', accessor: 'EquModel', width: '150px' },
        { header: 'Activity', accessor: 'Activity', width: '150px' },
        { header: 'Operator', accessor: 'Operator', width: '150px' },

        // Shift A
        { header: 'Total Trips', accessor: 'Shift ATotal Trips', width: '110px' },
        { header: 'Total Qty', accessor: 'Shift ATotal Qty', width: '110px' },
        { header: 'Total Hrs', accessor: 'Shift ATotal Hrs', width: '110px' },
        { header: 'Total Kms', accessor: 'Shift ATotal Kms', width: '110px' },
        { header: 'Trips Per Hr', accessor: 'Shift ATrips Per Hr', width: '120px' },
        { header: 'Qty Per Hr', accessor: 'Shift AQty Per Hr', width: '120px' },

        // Shift B
        { header: 'Total Trips', accessor: 'Shift BTotal Trips', width: '110px' },
        { header: 'Total Qty', accessor: 'Shift BTotal Qty', width: '110px' },
        { header: 'Total Hrs', accessor: 'Shift BTotal Hrs', width: '110px' },
        { header: 'Total Kms', accessor: 'Shift BTotal Kms', width: '110px' },
        { header: 'Trips Per Hr', accessor: 'Shift BTrips Per Hr', width: '120px' },
        { header: 'Qty Per Hr', accessor: 'Shift BQty Per Hr', width: '120px' },

        // Shift C
        { header: 'Total Trips', accessor: 'Shift CTotal Trips', width: '110px' },
        { header: 'Total Qty', accessor: 'Shift CTotal Qty', width: '110px' },
        { header: 'Total Hrs', accessor: 'Shift CTotal Hrs', width: '110px' },
        { header: 'Total Kms', accessor: 'Shift CTotal Kms', width: '110px' },
        { header: 'Trips Per Hr', accessor: 'Shift CTrips Per Hr', width: '120px' },
        { header: 'Qty Per Hr', accessor: 'Shift CQty Per Hr', width: '120px' },

        // FTD
        { header: 'Total Trips', accessor: 'FTDTotal Trips', width: '110px' },
        { header: 'Total Qty', accessor: 'FTDTotal Qty', width: '110px' },
        { header: 'Total Hrs', accessor: 'FTDTotal Hrs', width: '110px' },
        { header: 'Total Kms', accessor: 'FTDTotal Kms', width: '110px' },
        { header: 'Total Fuel', accessor: 'FTDTotal Fuel', width: '110px' },
        { header: 'Trips Per Hr', accessor: 'FTDTrips Per Hr', width: '120px' },
        { header: 'Qty Per Hr', accessor: 'FTDQty Per Hr', width: '120px' },
        { header: 'Fuel Per Hr', accessor: 'FTDFuel Per Hr', width: '120px', render: r => Number(r['FTDFuel Per Hr']).toFixed(2) },
        { header: 'KMPL', accessor: 'FTDKMPL', width: '110px', render: r => Number(r['FTDKMPL']).toFixed(2) },

        // MTD
        { header: 'Total Trips', accessor: 'MTDTotal Trips', width: '110px' },
        { header: 'Total Qty', accessor: 'MTDTotal Qty', width: '110px' },
        { header: 'Total Hrs', accessor: 'MTDTotal Hrs', width: '110px' },
        { header: 'Total Kms', accessor: 'MTDTotal Kms', width: '110px' },
        { header: 'Total Fuel', accessor: 'MTDTotal Fuel', width: '110px' },
        { header: 'Trips Per Hr', accessor: 'MTDTrips Per Hr', width: '120px' },
        { header: 'Qty Per Hr', accessor: 'MTDQty Per Hr', width: '120px' },
        { header: 'Fuel Per Hr', accessor: 'MTDFuel Per Hr', width: '120px', render: r => Number(r['MTDFuel Per Hr']).toFixed(2) },
        { header: 'KMPL', accessor: 'MTDKMPL', width: '110px', render: r => Number(r['MTDKMPL']).toFixed(2) },

    ], []);

    const columnGroups = useMemo(() => [
        { title: '', colSpan: 5 }, // SlNo to Equ Model
        { title: '', colSpan: 2 }, // Activity, Operator (Unfrozen)
        { title: 'SHIFT A', colSpan: 6 },
        { title: 'SHIFT B', colSpan: 6 },
        { title: 'SHIFT C', colSpan: 6 },
        { title: 'FTD', colSpan: 9 },
        { title: 'MTD', colSpan: 9 }
    ], []);

    const handleGenerate = async () => {
        if (!date) return toast.error('Please select a date');

        setLoading(true);
        setData([]);

        try {
            const payload = {
                date,
                activityIds: selectedActivities,
                date,
                activityIds: selectedActivities,
                equipmentIds: selectedEquipment,
                operatorIds: selectedOperators
            };

            const response = await fetch('/api/reports/equipment-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                setData(result.data);
                toast.success(`Loaded ${result.data.length} records`);
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
            setGenerated(true);
        }
    };


    const handleExportExcel = async (sortedData, visibleCols) => {
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Equipment Performance');

            // Find the maximum column span needed for the header
            const maxColSpan = visibleCols.length > 0 ? visibleCols.length : 15;

            // 1. Calculate max widths for dynamic columns
            const maxColWidths = {};
            visibleCols.forEach(col => {
                if (col.accessor === 'Equipment' || col.accessor === 'Operator') {
                    // Start with header length
                    let maxLen = col.header.length;

                    // Scan data rows for max length
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

                    // Add padding to max length (approx. 1.2 Excel units per character for Calibri 10)
                    // Cap at 60 so it doesn't get ridiculously wide
                    maxColWidths[col.accessor] = Math.min(Math.max((maxLen * 1.2) + 2, 20), 80);
                }
            });

            // 2. Custom width assignment based on column index and visibleCols
            ws.columns = Array(maxColSpan + 1).fill(0).map((_, i) => {
                if (i === 0) return { width: 3 }; // Padding

                // Map i-1 to visibleCols array index
                const colDef = visibleCols[i - 1];
                let w = 15;
                if (colDef) {
                    if (colDef.accessor === 'SlNo') w = 8;
                    else if (colDef.accessor === 'Activity') w = 20;
                    else if (colDef.accessor === 'PMS Code') w = 15;
                    else if (maxColWidths[colDef.accessor]) {
                        w = maxColWidths[colDef.accessor];
                    }
                }
                return { width: w };
            });

            // Let's find the logical index of 'Equ Model'
            let freezeCol = 5; // Default to E if not found
            const eqIdx = visibleCols.findIndex(c => c.accessor === 'EquModel');
            if (eqIdx !== -1) {
                freezeCol = eqIdx + 2; // +1 for 1-based, +1 for padding column A
            }

            ws.views = [
                { state: 'frozen', xSplit: freezeCol, ySplit: 8 } // Freeze up to Equ Model, and freeze all headers including Sub Headers (row 8)
            ];

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
            setCell(ws.getCell('B4'), "Equipment Performance Report", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(`B5:${endColLetter}5`);

            let formattedDate = date;
            if (formattedDate && formattedDate.includes('-')) {
                const [y, m, d] = formattedDate.split('-');
                formattedDate = `${d}/${m}/${y}`;
            }

            setCell(ws.getCell('B5'), `Date: ${formattedDate}`, { bold: true, align: 'center', border: false, fontSize: 11 });

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

            ws.getRow(6).height = 10;

            let currentRowIdx = 7;

            // Render Dynamic Column Groups (Top Header Logic identical to UI)
            const rowGroup = ws.getRow(currentRowIdx);
            let colIndex = 2; // Start from B

            // Apply grouping headers exactly as defined in local UI columnGroups
            // For export visibility, we trace how many visible cols belong to each group.
            // Simplified: Write raw title across matching visible columns count.

            // To ensure matching, let's just lay down the active visible cols sub headers and top headers linearly.
            let currentGroupTitle = '';
            let currentGroupStartCol = colIndex;
            let currentGroupSpan = 0;

            visibleCols.forEach((col, idx) => {
                // Find matching group for this column logically based on UI groups
                let groupForCol = columnGroups.find(g => {
                    // This is complex to perfectly map without the exact offset logic, 
                    // Let's use a simpler string matching based on the column headers
                    if (col.accessor.startsWith('FTD')) return g.title === 'FTD';
                    if (col.accessor.startsWith('MTD')) return g.title === 'MTD';
                    if (col.accessor.startsWith('Shift A')) return g.title === 'SHIFT A';
                    if (col.accessor.startsWith('Shift B')) return g.title === 'SHIFT B';
                    if (col.accessor.startsWith('Shift C')) return g.title === 'SHIFT C';
                    return g.title === '';
                }) || { title: '' };

                if (groupForCol.title !== currentGroupTitle) {
                    // Close previous group
                    if (currentGroupSpan > 0) {
                        const startL = ws.getColumn(currentGroupStartCol).letter;
                        const endL = ws.getColumn(currentGroupStartCol + currentGroupSpan - 1).letter;
                        if (currentGroupSpan > 1) {
                            ws.mergeCells(`${startL}${currentRowIdx}:${endL}${currentRowIdx}`);
                        }
                        setCell(ws.getCell(`${startL}${currentRowIdx}`), currentGroupTitle, { bold: true, bg: 'FFE5E7EB' });
                    }
                    currentGroupTitle = groupForCol.title;
                    currentGroupStartCol = colIndex + idx;
                    currentGroupSpan = 1;
                } else {
                    currentGroupSpan++;
                }
            });
            // Close final group
            if (currentGroupSpan > 0) {
                const startL = ws.getColumn(currentGroupStartCol).letter;
                const endL = ws.getColumn(currentGroupStartCol + currentGroupSpan - 1).letter;
                if (currentGroupSpan > 1 && startL !== endL) {
                    try { ws.mergeCells(`${startL}${currentRowIdx}:${endL}${currentRowIdx}`); } catch (e) { }
                }
                setCell(ws.getCell(`${startL}${currentRowIdx}`), currentGroupTitle, { bold: true, bg: 'FFE5E7EB' });
            }

            rowGroup.height = 20;
            currentRowIdx++;

            // Sub Headers
            const rowSub = ws.getRow(currentRowIdx);
            visibleCols.forEach((col, i) => {
                const cell = rowSub.getCell(i + 2);
                setCell(cell, col.header, { bold: true, bg: 'FFBFDBFE' });

                // If this column belongs to the empty group (no parent header)
                // We should merge it upwards so it looks like one tall header
                const parentGroup = columnGroups.find(g => {
                    if (col.accessor.startsWith('FTD')) return g.title === 'FTD';
                    if (col.accessor.startsWith('MTD')) return g.title === 'MTD';
                    if (col.accessor.startsWith('Shift A')) return g.title === 'SHIFT A';
                    if (col.accessor.startsWith('Shift B')) return g.title === 'SHIFT B';
                    if (col.accessor.startsWith('Shift C')) return g.title === 'SHIFT C';
                    return g.title === '';
                }) || { title: '' };

                if (parentGroup.title === '') {
                    // It's a top-level standalone column
                    // Let's merge Row (currentRowIdx - 1) and Row (currentRowIdx) for this column
                    const colLetter = ws.getColumn(i + 2).letter;
                    try {
                        ws.mergeCells(`${colLetter}${currentRowIdx - 1}:${colLetter}${currentRowIdx}`);
                        // Set the value in the merged cell
                        setCell(ws.getCell(`${colLetter}${currentRowIdx - 1}`), col.header, { bold: true, bg: 'FFE5E7EB' }); // Use the parent header color for continuity
                    } catch (e) { }
                }
            });
            rowSub.height = 22;
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
                    if (!isNaN(num) && val !== '' && val !== null) {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';

                        // Remove comma formatting for Cost Center and Prodsys Code
                        if (col.accessor === 'CostCenter' || col.accessor === 'PMS Code') {
                            nFmt = '0';
                        }
                    }

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, {
                        numFmt: nFmt,
                        align: (cIdx === 1 || cIdx === 2 || cIdx === 3) ? 'left' : 'center'
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Equipment_Performance_${formattedDate.replace(/\//g, '-')}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };

    if (initializing) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Equipment Performance Report</h1>
                <p className={styles.subtitle}>Detailed performance metrics per equipment</p>
            </div>

            {/* Filter Container */}
            <div className={styles.filterContainer}>

                {/* Date Input */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={styles.input}
                    />
                </div>

                {/* Activity Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>Activity</label>
                    <SearchableSelect
                        options={activityOptions}
                        value={selectedActivities}
                        onChange={(e) => setSelectedActivities(e.target.value)}
                        multiple
                        placeholder="All Activities"
                    />
                </div>

                {/* Equipment Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>Equipment</label>
                    <SearchableSelect
                        options={equipmentOptions}
                        value={selectedEquipment}
                        onChange={(e) => setSelectedEquipment(e.target.value)}
                        multiple
                        placeholder="All Equipment"
                    />
                </div>

                {/* Operator Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>Operator</label>
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
                    disabled={loading}
                    className={styles.generateBtn}
                    style={{ marginTop: 'auto', marginBottom: '2px' }}
                >
                    <Search size={16} />
                    {loading ? 'Processing...' : 'Generate View'}
                </button>
            </div>

            <ReportTable
                columns={columns}
                data={data}
                loading={loading}
                reportName="Equipment Performance"
                fromDate={date}
                toDate={date}
                generated={generated}
                stickyLeft={5} // SlNo, Prodsys Code, Cost Center, Equ Name, Equ Model
                stickyBgColor="#e0f2fe"
                columnGroups={columnGroups}
                onExportExcel={handleExportExcel}
            />
        </div>
    );
}
