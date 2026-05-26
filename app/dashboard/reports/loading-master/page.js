'use client';

import { useState } from 'react';
import ReportFilter from '@/components/reports/ReportFilter';
import ReportTable from '@/components/reports/ReportTable';
import LoadingMasterFilterModal from '@/components/reports/LoadingMasterFilterModal';
import { toast } from 'sonner';
import { formatReportDate } from '@/lib/date-utils';

export default function LoadingMasterReportPage() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // State for Filter
    const getLocalISO = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const sysToday = new Date();
    const firstDayStr = getLocalISO(new Date(sysToday.getFullYear(), sysToday.getMonth(), 1));
    const todayStr = getLocalISO(sysToday);

    const [fromDate, setFromDate] = useState(firstDayStr);
    const [toDate, setToDate] = useState(todayStr);
    const [isModalOpen, setModalOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [filterSummary, setFilterSummary] = useState('');
    const [conversionFactor, setConversionFactor] = useState(1.55);

    const handleApplyFilters = (newFilters, summary) => {
        setFilters(newFilters);
        setFilterSummary(summary);
    };

    // Columns based on User Request
    // Channels columns to match SQL Aliases exactly
    // Note: The SQL returns column names with spaces like "Operator's Name". 
    // The DataTable/ReportTable usually expects accessors to match data keys.
    const columns = [
        { header: 'Sl.No', accessor: 'SlNo' },
        { header: 'Cost Center', accessor: 'CostCenter' },
        { header: 'PMS Code', accessor: 'PMSCode' },
        { header: 'Year', accessor: 'Year' },
        { header: 'Month', accessor: 'Month' },
        { header: 'Date', accessor: 'Date', type: 'date' },
        { header: "Operator's Name", accessor: "Operator's Name" },
        { header: 'Shift', accessor: 'Shift' },
        { header: 'Loading Machine', accessor: 'Loading Machine' },
        { header: 'Loading Model', accessor: 'Loading Model' },
        { header: 'Relay', accessor: 'Relay' },
        { header: 'OHMR', accessor: 'OHMR' },
        { header: 'CHMR', accessor: 'CHMR' },
        { header: 'Net HMR', accessor: 'Net HMR' },
        { header: 'Total Working Hr', accessor: 'Total Working Hr' },
        { header: 'Coal Hrs', accessor: 'Coal Hrs' },
        { header: 'OB Hrs', accessor: 'OB Hrs' },
        { header: 'Coal Rehandling Hrs', accessor: 'Coal Rehandling Hrs' },
        { header: 'OB Rehandling Hrs', accessor: 'OB Rehandling Hrs' },
        { header: 'OB Trips', accessor: 'OB Trips' },
        { header: 'Quantity (BCM)', accessor: 'Quantity (BCM)' },
        { header: 'Coal Trips', accessor: 'Coal Trips' },
        { header: 'Quantity (MT)', accessor: 'Quantity (MT)' },
        { header: 'Trip/Hrs', accessor: 'Trip/Hrs' },
        { header: 'BCM/Hrs', accessor: 'BCM/Hrs' },
        { header: 'Development Hr (Mining)', accessor: 'Development Hr (Mining)' },
        { header: 'Face Marching Hr', accessor: 'Face Marching Hr' },
        { header: 'Development Hr (Non-Mining)', accessor: 'Development Hr (Non-Mining)' },
        { header: 'Blasting Marching Hr', accessor: 'Blasting Marching Hr' },
        { header: 'Running BD/Maintenance Hr', accessor: 'Running BD/Maintenance Hr' },
        { header: 'BD Hr.', accessor: 'BD Hr.' },
        { header: 'Maintenance Hr.', accessor: 'Maintenance Hr.' },
        { header: 'Coal Rehandling Trips', accessor: 'Coal Rehandling Trips' },
        { header: 'OB Rehandling Trips', accessor: 'OB Rehandling Trips' },
        { header: 'Other Rehandling Trips', accessor: 'Other Rehandling Trips' },
        { header: 'Sector', accessor: 'Sector' },
        { header: 'Patch', accessor: 'Patch' },
        { header: 'Method', accessor: 'Method' },
        { header: 'Remarks', accessor: 'Remarks' }
    ];

    const generateReport = async () => {
        setLoading(true);
        setReportData([]);

        const payload = { fromDate, toDate, ...filters };

        try {
            const res = await fetch('/api/reports/loading-master', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.message) {
                    toast.success(data.message);
                } else {
                    const formattedData = data.map(row => {
                        const newRow = { ...row };
                        Object.keys(newRow).forEach(key => {
                            if (key.toLowerCase() === 'date') {
                                newRow[key] = formatReportDate(newRow[key]);
                            }
                        });
                        return newRow;
                    });
                    setReportData(formattedData);
                    // Extract Conversion Factor from the first record if available
                    if (data.length > 0 && data[0].ConversionFactor) {
                        setConversionFactor(data[0].ConversionFactor);
                    } else {
                        // Reset or keep default if no data or not present
                        setConversionFactor(1.55);
                    }

                    if (data.length === 0) toast.info("No data found for selected range");
                }
            } else {
                toast.error(data.message || "Failed to generate report");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    
    const handleExportExcel = async (sortedData, visibleCols) => {
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Loading Master');

            const maxColSpan = visibleCols.length > 0 ? visibleCols.length : 39;

            // 1. Calculate max widths for dynamic columns
            const maxColWidths = {};
            visibleCols.forEach(col => {
                const textCols = ['CostCenter', 'PMSCode', "Operator's Name", 'Loading Machine', 'Loading Model', 'Sector', 'Patch', 'Method', 'Remarks'];
                if (textCols.includes(col.accessor) || col.accessor.includes('Hrs') || col.accessor.includes('Trips')) {
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
            setCell(ws.getCell('B2'), (process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"), { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:${endColLetter}3`);
            setCell(ws.getCell('B3'), (process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"), { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:${endColLetter}4`);
            setCell(ws.getCell('B4'), "Loading Master Report", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells(`B5:${endColLetter}5`);
            let fDate = fromDate, tDate = toDate;
            if (fDate && fDate.includes('-')) fDate = fDate ? new Date(fDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';
            if (tDate && tDate.includes('-')) tDate = tDate ? new Date(tDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-';
            
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
                             const day = d.getDate().toString().padStart(2, '0');
                             const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                             const month = monthNames[d.getMonth()];
                             const year = d.getFullYear();
                             val = `${day} - ${month} - ${year}`;
                         }
                    }

                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null && col.accessor !== 'Date' && col.accessor !== 'Year' && col.accessor !== 'Month') {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';
                        
                        // Treat HMRs with 2 decimals
                        if (['OHMR', 'CHMR', 'Net HMR'].includes(col.accessor)) {
                             nFmt = '0.00';
                             if (val % 1 === 0) nFmt = '0';
                        }
                    }

                    // Remove comma parsing for Cost Centers and PMS Codes
                    if (val !== null && val !== undefined) {
                        if (['CostCenter', 'PMSCode', 'Year', 'Month'].includes(col.accessor)) {
                            nFmt = '0';
                        }
                    }

                    const isLeftAlign = ['CostCenter', 'PMSCode', "Operator's Name", 'Loading Machine', 'Loading Model', 'Sector', 'Patch', 'Method', 'Remarks'].includes(col.accessor);

                    setCell(dataRow.getCell(cIdx + 2), val === null || val === undefined ? '-' : val, { 
                        numFmt: nFmt, 
                        align: isLeftAlign ? 'left' : 'center' 
                    });
                });
                dataRow.height = 18;
                currentRowIdx++;
            });

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Loading_Master_${(fDate || '').replace(/\//g, '-')}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Loading Master Report</h1>

            <ReportFilter
                onGenerate={generateReport}
                loading={loading}
                showReportType={false}
                reportType="LoadingMaster"
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
                showDetails={true}
                onFilterClick={() => setModalOpen(true)}
                filterSummary={filterSummary}
                filterCount={Object.values(filters).filter(f => Array.isArray(f) && f.length > 0).length}
                extraContent={
                    <div className="text-sm font-semibold text-blue-600">
                        BCM Conversion Factor : {conversionFactor}
                    </div>
                }
            />

            <div className="mt-8">
                <ReportTable
                    columns={columns}
                    data={reportData}
                    generated={true}
                    reportName="Loading Master"
                    fromDate={fromDate ? new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}
                    toDate={toDate ? new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}
                    onExportExcel={handleExportExcel}
                />
            </div>

            <LoadingMasterFilterModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />
        </div>
    );
}

