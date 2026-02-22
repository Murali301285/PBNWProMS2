'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './ProductionTsmpl.module.css';
import ProductionTsmplTable from './ProductionTsmplTable';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';


export default function ProductionTsmplPage() {
    const today = new Date().toISOString().split('T')[0];
    const [filter, setFilter] = useState({
        date: today,
        shiftId: ''
    });

    // Time Breakdown Inputs
    const [breakdown, setBreakdown] = useState({
        shiftChange: 0,
        breakTime: 0,
        blasting: 0,
        others: 0
    });

    const [shifts, setShifts] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch Shifts
    useEffect(() => {
        const fetchShifts = async () => {
            const res = await fetch('/api/reports/production-tsmpl?type=shifts');
            const result = await res.json();
            if (result.success) setShifts(result.data);
        };
        fetchShifts();
    }, []);

    // Helper: Handle Input Change (Mins)
    const handleBreakdownChange = (field, val) => {
        setBreakdown(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
    };

    // Fetch breakdown data when Date/Shift changes
    useEffect(() => {
        const fetchBreakdown = async () => {
            if (!filter.date || !filter.shiftId) {
                setBreakdown({ shiftChange: 0, breakTime: 0, blasting: 0, others: 0 }); // Reset if invalid selection
                return;
            }

            try {
                const res = await fetch(`/api/reports/production-tsmpl?type=breakdown&date=${filter.date}&shiftId=${filter.shiftId}`);
                const result = await res.json();

                if (result.success && result.data) {
                    setBreakdown({
                        shiftChange: result.data.ShiftChangeTime || 0,
                        breakTime: result.data.Break_TeaTime || 0,
                        blasting: result.data.BlastingTime || 0,
                        others: result.data.Others || 0
                    });
                    toast.success('Breakdown data loaded');
                } else {
                    setBreakdown({ shiftChange: 0, breakTime: 0, blasting: 0, others: 0 }); // Reset if not found
                }
            } catch (error) {
                console.error("Error fetching breakdown:", error);
            }
        };

        fetchBreakdown();
    }, [filter.date, filter.shiftId]);

    // Calculate Totals for Preview
    const calculatedStats = useMemo(() => {
        const totalMins = breakdown.shiftChange + breakdown.breakTime + breakdown.blasting + breakdown.others;
        const totalHrs = totalMins / 60;
        const workingHrs = 8 - totalHrs; // Assumption: 8hr shift
        return { totalMins, totalHrs: totalHrs.toFixed(1), workingHrs: workingHrs.toFixed(1) };
    }, [breakdown]);


    const handleGenerate = async () => {
        if (!filter.date) return toast.error('Please select a date');
        if (!filter.shiftId) return toast.error('Please select a shift');

        setLoading(true);
        setData(null);

        try {
            const payload = {
                date: filter.date,
                shiftId: filter.shiftId,
                ...breakdown // pass breakdown values
            };

            const res = await fetch('/api/reports/production-tsmpl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                toast.success('Report Generated');
            } else {
                toast.error(result.message || 'Failed to fetch');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    // Helper for Indian Number Format
    const formatNumber = (num, digits = 2) => {
        if (num === null || num === undefined) return '';
        const val = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(val)) return num;

        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: digits
        }).format(val);
    };

    const handlePrint = () => window.print();

    const handleExportExcel = async () => {
        if (!data) return;
        const { summary, crusher, headerInfo } = data;

        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Production TSMPL');

            // EXACT MATCH TO NTPC: 3 core columns
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
            setCell(ws.getCell('B4'), "PRODUCTION TSMPL REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 12 });

            ws.mergeCells('B5:D5');
            const shiftName = headerInfo?.ShiftName?.replace('SHIFT', 'Shift') || '-';
            setCell(ws.getCell('B5'), `Shift: ${shiftName}`, { bold: true, align: 'center', border: false, fontSize: 11 });

            ws.mergeCells('B6:D6');
            let formattedDate = filter.date;
            if (formattedDate) {
                const [y, m, d] = formattedDate.split('-');
                formattedDate = `${d}/${m}/${y}`;
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

            addDataRow(["Material", "Shift Qty.", "Per Hour"], { bold: true, bg: 'FFBFDBFE' });

            addDataRow(["COAL", `${fmt(summary.ProdCoal)} MT`, `${fmt(summary.ProdCoalPerHrs)} MT`], { align: 'right' });
            ws.getCell(`B${currentRowIdx - 1}`).alignment = { horizontal: 'left', vertical: 'middle' };
            ws.getCell(`B${currentRowIdx - 1}`).font = { bold: true };

            addDataRow(["OB", `${fmt(summary.ProdOB)} BCM`, `${fmt(summary.ProdOBPerHrs)} BCM`], { align: 'right' });
            ws.getCell(`B${currentRowIdx - 1}`).alignment = { horizontal: 'left', vertical: 'middle' };
            ws.getCell(`B${currentRowIdx - 1}`).font = { bold: true };

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

            // 3. Carpeting Quantity
            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Carpeting Quantity", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Material", null, "Shift Qty."], { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`B${currentRowIdx - 1}:C${currentRowIdx - 1}`);
            setCell(ws.getCell(`B${currentRowIdx - 1}`), "Material", { bold: true, align: 'center', bg: 'FFBFDBFE' });
            setCell(ws.getCell(`D${currentRowIdx - 1}`), "Shift Qty.", { bold: true, align: 'right', bg: 'FFBFDBFE' });

            addDataRow(["OB", null, `${fmt(summary.CarpettingObQty)} BCM`], { align: 'right' });
            ws.mergeCells(`B${currentRowIdx - 1}:C${currentRowIdx - 1}`);
            setCell(ws.getCell(`B${currentRowIdx - 1}`), "OB", { bold: true, align: 'left' });

            currentRowIdx++;
            
            // 4. Coal Rehandling
            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Coal Rehandling", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Material", null, "Shift Qty."], { bold: true, bg: 'FFBFDBFE' });
            ws.mergeCells(`B${currentRowIdx - 1}:C${currentRowIdx - 1}`);
            setCell(ws.getCell(`B${currentRowIdx - 1}`), "Material", { bold: true, align: 'center', bg: 'FFBFDBFE' });
            setCell(ws.getCell(`D${currentRowIdx - 1}`), "Shift Qty.", { bold: true, align: 'right', bg: 'FFBFDBFE' });

            addDataRow(["COAL", null, `${fmt(summary.RehandlingCoalQty)} MT`], { align: 'right' });
            ws.mergeCells(`B${currentRowIdx - 1}:C${currentRowIdx - 1}`);
            setCell(ws.getCell(`B${currentRowIdx - 1}`), "COAL", { bold: true, align: 'left' });

            currentRowIdx++;

            // 5. Crusher Details
            ws.mergeCells(`B${currentRowIdx}:D${currentRowIdx}`);
            setCell(ws.getCell(`B${currentRowIdx}`), "Crusher Details", { bold: true, align: 'left', bg: 'FFE5E7EB' });
            currentRowIdx++;

            addDataRow(["Plant", "W. Hours", "Quantity (MT)"], { bold: true, bg: 'FFBFDBFE' });

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
            saveAs(new Blob([buffer]), `ProductionTSMPL_${headerInfo?.Date || 'Report'}.xlsx`);
            toast.success("Excel exported successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Export failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Production TSMPL</h1>
            </div>

            {/* Filter & Controls */}
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
                        <button onClick={handlePrint} className={styles.actionBtn}>
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExportExcel} className={`${styles.actionBtn} ${styles.excel}`}>
                            <Download size={16} /> Excel
                        </button>
                    </>
                )}
            </div>

            {/* Time Breakdown Inputs (Always Visible) */}
            <div className={`${styles.breakdownSection} no-print`}>
                <div className={styles.bdHeader}>
                    <div className={styles.bdHeaderTitle}>Time Breakdown Analysis <span className="text-sm font-normal text-slate-300 ml-2">(Minutes)</span></div>
                    <div className={styles.autoTag}>Auto-Calculated</div>
                </div>
                <table className={styles.bdTable}>
                    <thead>
                        <tr>
                            <th className={`${styles.textLeft} ${styles.pl4}`}>Metric</th>
                            <th>Shift Change</th>
                            <th>Break/Tea</th>
                            <th>Blasting</th>
                            <th>Others</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className={`${styles.textLeft} ${styles.pl4} ${styles.textBold} text-slate-700`}>Mins Input</td>
                            <td><input type="number" className={styles.bdInput} placeholder="0" value={breakdown.shiftChange} onChange={e => handleBreakdownChange('shiftChange', e.target.value)} /></td>
                            <td><input type="number" className={styles.bdInput} placeholder="0" value={breakdown.breakTime} onChange={e => handleBreakdownChange('breakTime', e.target.value)} /></td>
                            <td><input type="number" className={styles.bdInput} placeholder="0" value={breakdown.blasting} onChange={e => handleBreakdownChange('blasting', e.target.value)} /></td>
                            <td><input type="number" className={styles.bdInput} placeholder="0" value={breakdown.others} onChange={e => handleBreakdownChange('others', e.target.value)} /></td>
                            <td className={`${styles.textCenter} ${styles.textBold} text-lg text-slate-800`}>{calculatedStats.totalMins} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>min</span></td>
                        </tr>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                            <td className={`${styles.textLeft} ${styles.pl4} ${styles.textBold}`} style={{ color: '#64748b' }}>Hrs (Converted)</td>
                            <td className={`${styles.textCenter}`} style={{ color: '#64748b' }}>{(breakdown.shiftChange / 60).toFixed(1)} hr</td>
                            <td className={`${styles.textCenter}`} style={{ color: '#64748b' }}>{(breakdown.breakTime / 60).toFixed(1)} hr</td>
                            <td className={`${styles.textCenter}`} style={{ color: '#64748b' }}>{(breakdown.blasting / 60).toFixed(1)} hr</td>
                            <td className={`${styles.textCenter}`} style={{ color: '#64748b' }}>{(breakdown.others / 60).toFixed(1)} hr</td>
                            <td className={`${styles.textCenter} ${styles.textBold}`} style={{ color: '#1e293b' }}>{calculatedStats.totalHrs} <span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>hr</span></td>
                        </tr>
                    </tbody>
                </table>
                <div className={styles.bdFooter}>
                    <div className={styles.bdNote}>
                        * Total Lost Hours are subtracted from standard 8-hour shift.
                    </div>
                    <div className={styles.bdNetHours}>
                        <span className={styles.bdNetLabel}>Net Working Hours:</span>
                        <span className={`${styles.bdNetValue} ${parseFloat(calculatedStats.workingHrs) < 6 ? styles.textRed : styles.textGreen}`}>
                            {calculatedStats.workingHrs} Hrs
                        </span>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {data && (
                <div className={styles.reportSheet} id="print-area">
                    <ProductionTsmplTable data={data} loading={loading} date={filter.date} />
                </div>
            )}
        </div>
    );
}
