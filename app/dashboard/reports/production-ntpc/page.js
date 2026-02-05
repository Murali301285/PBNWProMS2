'use client';

import { useState, useEffect } from 'react';
import styles from './ProductionNtpc.module.css';
import ProductionNtpcTable from './ProductionNtpcTable';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

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

    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        if (!data) return;
        const { summary, crusher, headerInfo } = data;

        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Title & Header Info
        wsData.push(["Production NTPC"]);
        wsData.push([`Date: ${headerInfo?.Date || '-'}`, "", `Shift: ${headerInfo?.ShiftName || '-'}`]);
        wsData.push([]);

        // 1. Production Quantity
        wsData.push(["Production Quantity"]);
        wsData.push(["COAL", `${summary.ProdCoal} MT`]);
        wsData.push(["OB", `${summary.ProdOB} BCM`]);
        wsData.push([]);

        // 2. WP-3 Quantity
        wsData.push(["WP-3 Quantity"]);
        wsData.push(["COAL", `${summary.WPCoalQty} MT`]);
        wsData.push(["OB", `${summary.WPObQty} BCM`]);
        wsData.push([]);

        // 3. Crusher Details
        wsData.push(["Crusher Details"]);
        wsData.push(["PLANT", "HRS", "QTY (MT)"]);

        let totalHrs = 0;
        let totalQty = 0;

        crusher.forEach(row => {
            wsData.push([row.Plant, row.RunningHr, row.TotalQty]);
            totalHrs += (row.RunningHr || 0);
            totalQty += (row.TotalQty || 0);
        });

        wsData.push(["Total", totalHrs.toFixed(2), totalQty]);

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

                if (firstColVal === "Production Quantity" || firstColVal === "WP-3 Quantity" || firstColVal === "Crusher Details") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };
                }
                if (firstColVal === "PLANT") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "D9D9D9" } };
                }
                if ((firstColVal === "COAL" || firstColVal === "OB") && C === 0) {
                    cellStyle.font.bold = true;
                }
                if (R > range.s.r && C === 0 && rowVal.length === 3 && firstColVal !== "Total" && firstColVal !== "PLANT") {
                    cellStyle.alignment.horizontal = "left";
                }
                if (rowVal.length === 3 && (C === 1 || C === 2)) {
                    cellStyle.alignment.horizontal = "left";
                }
                if (firstColVal === "Total") {
                    cellStyle.font.bold = true;
                    cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };
                }

                ws[cellRef].s = cellStyle;
            }
        }

        ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `ProductionNTPC_${headerInfo?.Date || 'Report'}.xlsx`);
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
                    <ProductionNtpcTable data={data} loading={loading} />
                </div>
            )}
        </div>
    );
}
