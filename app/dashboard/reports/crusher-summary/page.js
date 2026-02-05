'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Download, Printer } from 'lucide-react';
import styles from './CrusherSummary.module.css';
import CrusherSummaryTable from './CrusherSummaryTable';
import * as XLSX from 'xlsx-js-style';

export default function CrusherSummaryPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const handleFetchReport = async () => {
        if (!date) {
            toast.error("Please select a date");
            return;
        }

        setLoading(true);
        setReportData(null);
        try {
            const res = await fetch('/api/reports/crusher-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            const result = await res.json();
            if (result.success) {
                setReportData(result);
                toast.success("Report generated");
            } else {
                toast.error(result.message || "Failed to fetch report");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (!reportData) return;
        try {
            const { data, meta } = reportData;
            const { shiftNames } = meta;

            const wb = XLSX.utils.book_new();
            const wsData = [];

            // Header Info
            wsData.push(["TSMPL PBCMP Operations"]);
            wsData.push(["Crusher Production Report"]);
            wsData.push(["Date :", date]);
            wsData.push([]);

            // Formatters
            const fmtQty = (val) => val != null ? Number(val).toFixed(3) : '0.000';
            const fmtHr = (val) => val != null ? Number(val).toFixed(2) : '0.00';
            const fmtInt = (val) => val != null ? Number(val).toFixed(0) : '0';

            // Totals Calculation
            const totalProdShift = {};
            shiftNames.forEach(s => totalProdShift[s] = 0);

            const totals = data.reduce((acc, row) => {
                acc.RunningHr += row.RunningHr || 0;
                acc.ProdFTD += row.ProductionQty || 0;
                acc.ProdFTM += row.ProdFTM || 0;
                acc.ProdYTD += row.ProdYTD || 0;

                shiftNames.forEach(s => {
                    totalProdShift[s] += (row.shifts[s] || 0);
                });

                acc.monthlyCumRHR += row.monthlyCumRHR || 0;
                acc.prodFromBSR += row.monthlyCumBSR || 0;

                return acc;
            }, {
                RunningHr: 0, ProdFTD: 0, ProdFTM: 0, ProdYTD: 0,
                monthlyCumRHR: 0, prodFromBSR: 0
            });

            // Table 1 Headers
            const header1 = [
                "Sl.No.", "Details", "Running Hour Actuals for the day",
                ...shiftNames,
                "Cum Production FTD", "Cum TPH FTD", "Cum Production FTM", "Production YTD 25-26"
            ];

            wsData.push(header1);

            // Body Table 1
            data.forEach((row, i) => {
                const cumTphFtd = row.RunningHr > 0 ? (row.ProductionQty / row.RunningHr) : 0;
                const rowData = [
                    i + 1,
                    row.PlantName,
                    fmtHr(row.RunningHr),
                    ...shiftNames.map(s => fmtQty(row.shifts[s] || 0)),
                    fmtQty(row.ProductionQty),
                    fmtInt(cumTphFtd),
                    fmtQty(row.ProdFTM),
                    fmtQty(row.ProdYTD)
                ];
                wsData.push(rowData);
            });

            // Totals Table 1
            const totalTphFtd = totals.RunningHr > 0 ? (totals.ProdFTD / totals.RunningHr) : 0;
            const totalRow1 = [
                "Total",
                "",
                fmtHr(totals.RunningHr),
                ...shiftNames.map(s => fmtQty(totalProdShift[s])),
                fmtQty(totals.ProdFTD),
                fmtInt(totalTphFtd),
                fmtQty(totals.ProdFTM),
                fmtQty(totals.ProdYTD),
                ""
            ];
            wsData.push(totalRow1);
            wsData.push([]);

            // Table 2 Headers
            const header2 = [
                "Sl.No.", "Details", "Month Starting HMR", "As on Date Closing HMR", "Monthly cum RHR",
                "Month Starting BSR", "As on Date Closing BSR", "Monthly cum BSR", "AVG TPH FTM", "Budget FTM"
            ];
            wsData.push(header2);

            // Body Table 2
            data.forEach((row, i) => {
                const rowData = [
                    i + 1,
                    row.PlantName,
                    fmtHr(row.HMR?.MonthStartingHMR || 0),
                    fmtHr(row.HMR?.AsonDateClosingHMR || 0),
                    fmtHr(row.monthlyCumRHR || 0),
                    fmtInt(row.HMR?.MonthStartingBSR || 0),
                    fmtInt(row.HMR?.AsonDateClosingBSR || 0),
                    fmtQty(row.monthlyCumBSR || 0),
                    fmtInt(row.avgTphFtm || 0),
                    fmtInt(row.budgetFtm || 0)
                ];
                wsData.push(rowData);
            });

            // Totals for Table 2
            const totalRow2 = [
                "Total Production", "", "", "", "", "", "",
                fmtQty(totals.prodFromBSR),
                "", "-"
            ];
            wsData.push(totalRow2);

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const downloadTime = new Date().toLocaleString('en-IN');
            XLSX.utils.sheet_add_aoa(ws, [["Downloaded on: " + downloadTime]], { origin: -1 });
            XLSX.utils.book_append_sheet(wb, ws, "Crusher Summary");
            const fname = `ProMS_Crusher_Summary_DatedFrom_${date}_to_${date}.xlsx`;
            XLSX.writeFile(wb, fname);
            toast.success("Excel exported successfully!");
        } catch (e) {
            console.error(e);
            toast.error("Export failed");
        }
    };

    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Crusher Summary Report</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>Daily production and performance summary</p>
            </div>

            <div className={styles.filterContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Select Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleFetchReport}
                    disabled={loading}
                    className={styles.generateBtn}
                >
                    {loading && <Loader2 className="animate-spin h-4 w-4 inline mr-2" />}
                    {loading ? 'Generating...' : 'Show Report'}
                </button>

                <div style={{ flex: 1 }}></div>

                {reportData && (
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

            {reportData && (
                <div className={styles.reportSheet} id="print-area">
                    <CrusherSummaryTable
                        data={reportData.data}
                        meta={reportData.meta}
                        date={date}
                    />
                </div>
            )}

            {!reportData && !loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flex: 1, padding: '50px' }}>
                    Select a date and click Show Report
                </div>
            )}
        </div>
    );
}
