
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
// import SearchableSelect from '@/components/SearchableSelect'; // Not using for single select shift for now, keeping simple select
import ReportTable from '@/components/reports/ReportTable';
import styles from './WaterTankerReport.module.css';

export default function WaterTankerReport() {
    const today = new Date().toISOString().split('T')[0];
    const [filter, setFilter] = useState({
        fromDate: today,
        toDate: today,
        shiftId: ''
    });

    // Data States
    const [data, setData] = useState([]);
    const [shifts, setShifts] = useState([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Load Shifts on Mount
    useEffect(() => {
        const loadShifts = async () => {
            try {
                const res = await fetch('/api/master/shift');
                const json = await res.json();
                if (Array.isArray(json)) setShifts(json);
                else if (json.success && json.data) setShifts(json.data);
            } catch (err) {
                console.error("Failed to load shifts", err);
                toast.error("Failed to load shift options");
            } finally {
                setInitializing(false);
            }
        };
        loadShifts();
    }, []);

    const fetchData = async () => {
        if (!filter.fromDate || !filter.toDate) {
            toast.error('Please select both dates');
            return;
        }

        setLoading(true);
        setGenerated(true);
        setData([]);

        try {
            const res = await fetch('/api/reports/water-tanker-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromDate: filter.fromDate, toDate: filter.toDate, shiftId: filter.shiftId })
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                if (result.data.length === 0) toast.info("No records found");
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

    // Formatters
    const fmt0 = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';
    const fmt3 = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0.000';

    // Columns Configuration for ReportTable
    const columns = useMemo(() => [
        { header: 'S.N.', accessor: 'SlNo', width: '60px' },
        { header: 'Date', accessor: 'Date', width: '100px' }, // Added Date Column
        { header: 'Water Tanker Equipment', accessor: 'Water Tanker Equipment', width: '200px' },
        { header: 'Trip', accessor: 'Trip', width: '80px', render: r => fmt0(r.Trip) },
        { header: 'Tanker Capacity (Cub mtr)', accessor: 'Tanker Capacity', width: '150px', render: r => fmt0(r['Tanker Capacity']) }, // Updated accessor
        { header: 'Qty.', accessor: 'Qty', width: '100px', render: r => fmt3(r.Qty) },
        { header: 'Filling Point', accessor: 'Filling Point', width: '150px' }, // Updated accessor
        { header: 'Filling Pump', accessor: 'Filling Pump', width: '150px' }, // Updated accessor
        { header: 'Destination', accessor: 'Destination', width: '150px' },
        { header: 'Remarks', accessor: 'Remarks', width: '200px' },
    ], []);

    
    const handleExportExcel = async (sortedData, visibleCols) => {
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Water Tanker Performance');

            const maxColSpan = visibleCols.length > 0 ? visibleCols.length : 10;

            // 1. Calculate max widths for dynamic columns
            const maxColWidths = {};
            visibleCols.forEach(col => {
                const textCols = ['Water Tanker Equipment', 'Filling Point', 'Filling Pump', 'Destination', 'Remarks'];
                if (textCols.includes(col.accessor)) {
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
                    maxColWidths[col.accessor] = Math.min(Math.max((maxLen * 1.2) + 2, 12), 80);
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

            // 3. Freeze panes (freeze headers only, no horizontal column freeze)
            ws.views = [
                { state: 'frozen', xSplit: 0, ySplit: 6 } // Freeze row 6 (headers), no columns
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
            setCell(ws.getCell('B4'), "Water Tanker Performance Report", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(`B5:${endColLetter}5`);
            let fDate = filter.fromDate, tDate = filter.toDate;
            if (fDate && fDate.includes('-')) fDate = fDate.split('-').reverse().join('/');
            if (tDate && tDate.includes('-')) tDate = tDate.split('-').reverse().join('/');
            
            const dateStr = `From Date: ${fDate || '-'}        To Date: ${tDate || '-'}`;
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
            rowHeader.height = 35;
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

                    // Format Date if applicable
                    if (col.accessor === 'Date' && val) {
                         const d = new Date(val);
                         if (!isNaN(d.getTime())) {
                             val = d.toLocaleDateString('en-GB');
                         }
                    }

                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null && col.accessor !== 'Date') {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';
                        
                        if (['Qty'].includes(col.accessor)) {
                             nFmt = '0.000';
                        }
                    }

                    const isLeftAlign = ['Water Tanker Equipment', 'Filling Point', 'Filling Pump', 'Destination', 'Remarks'].includes(col.accessor);

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, { 
                        numFmt: nFmt, 
                        align: isLeftAlign ? 'left' : 'center' 
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Water_Tanker_Performance_${(fDate || '').replace(/\//g, '-')}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };

    if (initializing) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Water Tanker Performance Report</h1>
                <p className={styles.subtitle}>Daily water tanker operations and entries</p>
            </div>

            {/* Filter Container */}
            <div className={styles.filterContainer}>

                {/* Date Inputs */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>From Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={filter.fromDate}
                        onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>To Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={filter.toDate}
                        onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
                    />
                </div>

                {/* Shift Filter (Single Select) */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Shift</label>
                    <select
                        className={styles.input}
                        value={filter.shiftId}
                        onChange={(e) => setFilter({ ...filter, shiftId: e.target.value })}
                        style={{ minWidth: '200px' }}
                    >
                        <option value="">All Shifts</option>
                        {shifts.map(s => (
                            <option key={s.SlNo} value={s.SlNo}>{s.ShiftName}</option>
                        ))}
                    </select>
                </div>

                {/* Generate Button */}
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className={styles.generateBtn}
                    style={{ marginTop: 'auto', marginBottom: '2px' }}
                >
                    {loading ? (
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

            {/* Data Table */}
            <ReportTable
                columns={columns}
                data={data}
                loading={loading}
                generated={generated}
                reportName="Water Tanker Performance"
                fromDate={filter.fromDate}
                toDate={filter.toDate}
                onExportExcel={handleExportExcel}
            />
        </div>
    );
}
