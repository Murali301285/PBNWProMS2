'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './ProductionTsmpl.module.css';
import ProductionTsmplTable from './ProductionTsmplTable';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

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

    const handleExportExcel = () => {
        if (!data) return;
        const { summary, crusher, headerInfo } = data;

        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title & Header Info
        wsData.push(["THRIVENI SAINIK MINING PRIVATE LIMITED"]);
        wsData.push(["PAKRI BARWADIH COAL MINING PROJECT"]);
        wsData.push(["PRODUCTION TSMPL REPORT"]);
        wsData.push([`Date: ${headerInfo?.Date || '-'} | Shift: ${headerInfo?.ShiftName || '-'}`]);
        wsData.push([]);

        // 1. Time Breakdown Table
        wsData.push(["Participle", "Shift Change", "Break fast/Tea Time", "Blasting", "Others", "Total"]);
        wsData.push(["Mins", formatNumber(summary.ShiftChange, 0), formatNumber(summary.BreakTime, 0), formatNumber(summary.Blasting, 0), formatNumber(summary.Others, 0), formatNumber(summary.Totalmin, 0)]);
        wsData.push(["Hrs", formatNumber(summary.TotalShiftChangeHrs, 1), formatNumber(summary.TotalBreakTimeHrs, 1), formatNumber(summary.TotalBlastingHrs, 1), formatNumber(summary.TotalOthersHrs, 1), formatNumber(summary.TotalHrs, 1)]);
        wsData.push(["Total working hrs", "", "", "", "", formatNumber(summary.TotalWorkingHrs, 1)]);
        wsData.push([]);

        // 2. Production Quantity
        wsData.push(["Production Quantity"]);
        wsData.push(["Material", "Shift Qty.", "Per Hour"]);
        wsData.push(["COAL", `${formatNumber(summary.ProdCoal)} MT`, `${formatNumber(summary.ProdCoalPerHrs, 0)} MT`]);
        wsData.push(["OB", `${formatNumber(summary.ProdOB)} BCM`, `${formatNumber(summary.ProdOBPerHrs, 0)} BCM`]);
        wsData.push([]);

        // 3. WP-3 Quantity
        wsData.push(["WP-3 Quantity"]);
        wsData.push(["COAL", `${formatNumber(summary.WPCoalQty)} MT`]);
        wsData.push(["OB", `${formatNumber(summary.WPObQty)} BCM`]);
        wsData.push([]);

        // 4. Carpeting Quantity
        wsData.push(["Carpeting Quantity"]);
        wsData.push(["Material", "Shift Qty."]);
        wsData.push(["OB", `${formatNumber(summary.CarpettingObQty)} BCM`]);
        wsData.push([]);

        // 5. Coal Rehandling
        wsData.push(["Coal Rehandling"]);
        wsData.push(["Material", "Shift Qty."]);
        wsData.push(["COAL", `${formatNumber(summary.RehandlingCoalQty)} MT`]);
        wsData.push([]);

        // 6. Crusher Details
        wsData.push(["Crusher Details"]);
        wsData.push(["Plant", "W. Hours", "Quantity (MT)"]);

        let totalHrs = 0;
        let totalQty = 0;

        crusher.forEach(row => {
            wsData.push([row.Plant, formatNumber(row.RunningHr), formatNumber(row.TotalQty)]);
            totalHrs += (row.RunningHr || 0);
            totalQty += (row.TotalQty || 0);
        });

        wsData.push(["Total", formatNumber(totalHrs), formatNumber(totalQty)]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Styling Loop
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) continue;

                const cellStyle = {
                    font: { name: "Calibri", sz: 11 },
                    border: {
                        top: { style: "thin" },
                        bottom: { style: "thin" },
                        left: { style: "thin" },
                        right: { style: "thin" }
                    },
                    alignment: { vertical: "center", horizontal: "center" }
                };

                const rowVal = wsData[R];
                const firstColVal = rowVal[0];

                if (firstColVal === "Production Quantity" || firstColVal === "WP-3 Quantity" || firstColVal === "Carpeting Quantity" || firstColVal === "Coal Rehandling" || firstColVal === "Crusher Details") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };
                }
                if (firstColVal === "Material" || firstColVal === "Plant" || firstColVal === "Participle") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "D9D9D9" } };
                }
                if ((firstColVal === "COAL" || firstColVal === "OB" || firstColVal === "Mins" || firstColVal === "Hrs" || firstColVal === "Total working hrs") && C === 0) {
                    cellStyle.font.bold = true;
                }
                if (R > range.s.r && C === 0 && rowVal.length === 3 && firstColVal !== "Total" && firstColVal !== "Plant") {
                    cellStyle.alignment.horizontal = "left";
                }
                if (firstColVal === "Total" || firstColVal === "Total working hrs") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };
                }

                ws[cellRef].s = cellStyle;
            }
        }

        ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `ProductionTSMPL_${headerInfo?.Date || 'Report'}.xlsx`);
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
