'use client';

import { useState } from 'react';
import ReportFilter from '@/components/reports/ReportFilter';
import ReportTable from '@/components/reports/ReportTable';
import MaterialLoadingFilterModal from '@/components/reports/MaterialLoadingFilterModal';
import { toast } from 'sonner';
import { Filter } from 'lucide-react';
import styles from '@/components/reports/ReportFilter.module.css';

/**
 * Material Loading Detailed Report
 */
export default function MaterialLoadingReport() {
    const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [filter, setFilter] = useState({
        reportType: 'MaterialLoading',
        fromDate: firstDayStr,
        toDate: todayStr
    });
    const [advancedFilters, setAdvancedFilters] = useState({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [filterSummary, setFilterSummary] = useState('');

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    // Columns Configuration (Matched with SQL Aliases)
    const columns = [
        { header: 'Sl.No', accessor: 'SlNo' },
        { header: 'Cost Center Loading', accessor: 'CostCenterLoading' },
        { header: 'Cost Center Hauling', accessor: 'CostCenterHauler' },
        { header: 'Year', accessor: 'Year' },
        { header: 'Month', accessor: 'Month' },
        { header: 'Date', accessor: 'Date' },
        { header: 'Shift', accessor: 'ShiftName' },
        { header: 'Source', accessor: 'SourceName' },
        { header: 'Destination', accessor: 'Destination' },
        { header: 'Hauler', accessor: 'HaulerEquipment' },
        { header: 'Loading Machine', accessor: 'LoadingMachine' },
        { header: 'Material', accessor: 'MaterialName' },
        { header: 'NTPC Qty/Trip', accessor: 'NtpcQtyTrip' },
        { header: 'Manag. Qty/Trip', accessor: 'ManagQtyTrip' },
        { header: 'Trip (NTPC)', accessor: 'TripNtpc' },
        { header: 'Trip (Management)', accessor: 'TripManagement' },
        { header: 'TotalQty', accessor: 'ManagTotalQty' },
        { header: 'Loading Model', accessor: 'LoadingModel' },
        { header: 'Hauling Model', accessor: 'HaulingModel' },
        { header: 'Sector', accessor: 'Sector' },
        { header: 'Patch', accessor: 'Patch' },
        { header: 'Scale', accessor: 'ScaleName' },
        { header: 'Relay', accessor: 'Relay' },
        { header: 'Shift Incharge(Large Scale)', accessor: 'ShiftInchargeLarge' },
        { header: 'Shift Incharge(Mid Scale)', accessor: 'ShiftInchargeMid' }
    ];

    const handleGenerate = async () => {
        if (!filter.fromDate || !filter.toDate) return toast.error('Please select date range');

        setLoading(true);
        setData([]);

        try {
            const payload = {
                fromDate: filter.fromDate,
                toDate: filter.toDate,
                ...advancedFilters // Include selected filters
            };

            const res = await fetch('/api/reports/material-loading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

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

    // Check if any filter is active for visual indicator
    const activeFilterCount = Object.values(advancedFilters).filter(v => Array.isArray(v) && v.length > 0).length;


    const handleExportExcel = async (sortedData, visibleCols) => {
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Material Loading');

            const maxColSpan = visibleCols.length > 0 ? visibleCols.length : 25;

            // 1. Calculate max widths for dynamic columns
            const maxColWidths = {};
            visibleCols.forEach(col => {
                if (['CostCenterLoading', 'CostCenterHauler', 'SourceName', 'Destination', 'HaulerEquipment', 'LoadingMachine', 'MaterialName', 'LoadingModel', 'HaulingModel', 'ShiftInchargeLarge', 'ShiftInchargeMid', 'Sector', 'Patch'].includes(col.accessor)) {
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
            setCell(ws.getCell('B4'), "Material Loading Report", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(`B5:${endColLetter}5`);
            let fDate = filter.fromDate, tDate = filter.toDate;
            if (fDate && fDate.includes('-') && fDate.split('-')[0].length === 4) fDate = fDate ? new Date(fDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';
            if (tDate && tDate.includes('-') && tDate.split('-')[0].length === 4) tDate = tDate ? new Date(tDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';
            
            const dateStr = `From: ${fDate || '-'}        To: ${tDate || '-'}`;
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

                    // Do not parse Date, keep raw DB format (dd/MMM/yyyy)
                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null && col.accessor !== 'Date' && col.accessor !== 'Year' && col.accessor !== 'Month') {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';
                    }

                    // Remove comma parsing for Cost Centers / Year / Month
                    if (val !== null && val !== undefined) {
                        if (['CostCenterLoading', 'CostCenterHauler', 'Year', 'Month'].includes(col.accessor)) {
                            nFmt = '0';
                        }
                    }

                    const isLeftAlign = ['CostCenterLoading', 'CostCenterHauler', 'SourceName', 'Destination', 'HaulerEquipment', 'LoadingMachine', 'MaterialName', 'LoadingModel', 'HaulingModel', 'ShiftInchargeLarge', 'ShiftInchargeMid'].includes(col.accessor);

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, {
                        numFmt: nFmt,
                        align: isLeftAlign ? 'left' : 'center'
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Material_Loading_${(fDate || '').replace(/\//g, '-')}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };

    return (
        <div className="p-6 h-screen flex flex-col bg-slate-50">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Material Loading Report</h1>
                <p className="text-slate-500 text-sm">Detailed transaction logs for material movement</p>
            </div>

            <ReportFilter
                reportType={filter.reportType}
                setReportType={(val) => setFilter({ ...filter, reportType: val })}
                fromDate={filter.fromDate}
                setFromDate={(val) => setFilter({ ...filter, fromDate: val })}
                toDate={filter.toDate}
                setToDate={(val) => setFilter({ ...filter, toDate: val })}
                onGenerate={handleGenerate}
                onReset={() => { setData([]); setAdvancedFilters({}); setFilterSummary(''); }}
                loading={loading}
                showReportType={false}
            >
                {/* Custom Filter Button */}
                <div className="flex items-center gap-2">
                    <button
                        className={`${styles.generateBtn} !bg-white !text-slate-700 !border !border-slate-300 hover:!bg-slate-50 relative`}
                        onClick={() => setIsFilterOpen(true)}
                        title="Advanced Filters"
                    >
                        <Filter size={16} /> Filter
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    {filterSummary && (
                        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'blue' }}>
                            {filterSummary}
                        </span>
                    )}
                </div>
            </ReportFilter>

            <MaterialLoadingFilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={(filters, summary) => {
                    setAdvancedFilters(filters);
                    setFilterSummary(summary);
                    // Optionally auto-generate?
                    // handleGenerate(); // Better let user click Generate explicitly
                }}
                initialFilters={advancedFilters}
            />

            <ReportTable
                columns={columns}
                data={data}
                loading={loading}
                reportName="Material Loading"
                fromDate={filter.fromDate ? new Date(filter.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}
                toDate={filter.toDate ? new Date(filter.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}
                generated={generated}
                onExportExcel={handleExportExcel}
            />
        </div>
    );
}
