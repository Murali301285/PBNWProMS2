'use client';

import { useState, useEffect } from 'react';
import styles from './ProductionNtpc.module.css';
import ProductionNtpcTable from './ProductionNtpcTable';
import { toast } from 'sonner';
import { Download, Printer, FileText } from 'lucide-react';


export default function ProductionNtpcPage() {
    const today = new Date().toISOString().split('T')[0];
    const [filter, setFilter] = useState({
        date: today,
        shiftId: ''
    });

    const [shifts, setShifts] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch Shifts on Load
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const res = await fetch('/api/reports/production-ntpc?type=shifts');
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

    const handleGenerate = async () => {
        if (!filter.date) return toast.error('Please select a date');
        if (!filter.shiftId) return toast.error('Please select a shift');

        setLoading(true);
        setData(null);

        try {
            const res = await fetch('/api/reports/production-ntpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: filter.date, shiftId: filter.shiftId })
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
        const originalTitle = document.title;
        document.title = `ProductionNTPC_${filter.date}`;
        setTimeout(() => {
            window.print();
            setTimeout(() => { document.title = originalTitle; }, 500);
        }, 500);
    };

    const handleExportExcel = async () => {
        if (!data) return;
        const { summary, crusher, headerInfo } = data;

        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Production NTPC');

            ws.columns = [
                { width: 3 },  // A (padding)
                { width: 30 }, // B
                { width: 25 }, // C
                { width: 25 }, // D
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

            ws.mergeCells('B2:D2');
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells('B3:D3');
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells('B4:D4');
            setCell(ws.getCell('B4'), "PRODUCTION NTPC REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells('B5:D5');
            const shiftName = headerInfo?.ShiftName?.replace('SHIFT', 'Shift') || '-';
            setCell(ws.getCell('B5'), `Shift: ${shiftName}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.mergeCells('B6:D6');
            let formattedDate = filter.date;
            if (formattedDate) {
                const [y, m, d] = formattedDate.split('-');
                formattedDate = `${d}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m, 10) - 1]}-${y}`;
            } else {
                formattedDate = headerInfo?.Date || '-';
            }
            setCell(ws.getCell('B6'), `Date: ${formattedDate}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.getRow(2).height = 30;
            ws.getRow(3).height = 22;
            ws.getRow(4).height = 20;
            ws.getRow(5).height = 18;
            ws.getRow(6).height = 18;

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 100, height: 90 }
                });
            }

            ws.getRow(7).height = 10;

            let currentRowIdx = 8;

            const addDataRow = (values, opts = {}) => {
                const row = ws.getRow(currentRowIdx);
                values.forEach((val, i) => {
                    if (val === null) return;
                    const cOpts = { ...opts };
                    if (i === 0 && !opts.bold) cOpts.align = 'left';
                    if (val && typeof val === 'number') {
                        cOpts.numFmt = '#,##0';
                        if (val === 0) cOpts.numFmt = '0';
                    }
                    setCell(row.getCell(i + 2), val, cOpts);
                });
                row.height = opts.height || 18;
                currentRowIdx++;
            };

            const fmt = (val) => {
                if (val === null || val === undefined) return '-';
                return Number(val).toLocaleString('en-IN');
            };

            // 1. Production Quantity
            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Production Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["COAL", null, `${fmt(summary.ProdCoal)} MT`], { align: 'right' });
            ws.mergeCells(`B${currentRowIdx - 1}:C${currentRowIdx - 1}`);
            setCell(ws.getCell(`B${currentRowIdx - 1}`), "COAL", { bold: true, align: 'left' });

            addDataRow(["OB", null, `${fmt(summary.ProdOB)} BCM`], { align: 'right' });
            ws.mergeCells(`B${currentRowIdx - 1}:C${currentRowIdx - 1}`);
            setCell(ws.getCell(`B${currentRowIdx - 1}`), "OB", { bold: true, align: 'left' });

            currentRowIdx++;

            // 2. WP-3 Quantity
            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "WP-3 Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["COAL", null, `${fmt(summary.WPCoalQty)} MT`], { align: 'right' });
            ws.mergeCells(`B${currentRowIdx - 1}:C${currentRowIdx - 1}`);
            setCell(ws.getCell(`B${currentRowIdx - 1}`), "COAL", { bold: true, align: 'left' });

            addDataRow(["OB", null, `${fmt(summary.WPObQty)} BCM`], { align: 'right' });
            ws.mergeCells(`B${currentRowIdx - 1}:C${currentRowIdx - 1}`);
            setCell(ws.getCell(`B${currentRowIdx - 1}`), "OB", { bold: true, align: 'left' });

            currentRowIdx++;

            // 3. Crusher Details
            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Crusher Details", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["PLANT", "HRS", "QTY (MT)"], { bold: true, bg: 'FFBFDBFE' });

            let totalHrs = 0;
            let totalQty = 0;

            crusher.forEach(row => {
                addDataRow([row.Plant, row.RunningHr === null ? '-' : Number(row.RunningHr).toFixed(2), fmt(row.TotalQty)], { align: 'right' });
                ws.getCell(`B${currentRowIdx - 1}`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                totalHrs += (row.RunningHr || 0);
                totalQty += (row.TotalQty || 0);
            });

            addDataRow(["Total", totalHrs.toFixed(2), fmt(totalQty)], { bold: true, bg: 'FFE5E7EB', align: 'right' });
            ws.getCell(`B${currentRowIdx - 1}`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `ProductionNTPC_${headerInfo?.Date || 'Report'}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Production NTPC</h1>
            </div>

            <div className={styles.filterContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={filter.date}
                        onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.label}>Shift</label>
                    <select
                        className={styles.select}
                        value={filter.shiftId}
                        onChange={(e) => setFilter({ ...filter, shiftId: e.target.value })}
                    >
                        <option value="">Select Shift</option>
                        {shifts.map(s => (
                            <option key={s.SlNo} value={s.SlNo}>{s.ShiftName}</option>
                        ))}
                    </select>
                </div>

                <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
                    {loading ? 'Loading...' : 'Show Report'}
                </button>

                <div style={{ flex: 1 }}></div>

                {data && (
                    <>
                        {/* Reverting to Print specifically per the global standard */}
                        <button onClick={handlePrint} className={styles.actionBtn}>
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExportExcel} className={`${styles.actionBtn} ${styles.excel}`}>
                            <Download size={16} /> Excel
                        </button>
                    </>
                )}
            </div>

            {/* Report Content */}
            {data && (
                <div className={styles.reportSheet} id="print-area">
                    <ProductionNtpcTable data={data} loading={loading} date={filter.date} />
                </div>
            )}
        </div>
    );
}
