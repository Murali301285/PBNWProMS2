"use client";
import React, { useState } from 'react';
import DailyProgressTable from './DailyProgressTable';
import { toast } from 'sonner';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import styles from './DailyProgressPage.module.css';

export default function DailyProgressPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleShowReport = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/reports/daily-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });
            const result = await response.json();
            if (result.success) {
                setReportData(result.data);
                if (result.data.production.length === 0) {
                    toast.info("No data found for the selected date.");
                }
            } else {
                toast.error(result.message || "Failed to fetch report");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("An error occurred while fetching the report.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    // Export Logic
    const handleExportExcel = () => {
        if (!reportData) return;
        const { production, drilling, blasting, crusher, headerInfo } = reportData;
        const displayDate = headerInfo?.Date ? new Date(headerInfo.Date).toLocaleDateString('en-GB') : date;

        const wb = XLSX.utils.book_new();
        const wsData = [];

        // Styles
        const headerStyle = { font: { bold: true, sz: 12 }, alignment: { horizontal: "center" }, fill: { fgColor: { rgb: "E0E0E0" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
        const subHeaderStyle = { font: { bold: true }, alignment: { horizontal: "center" }, fill: { fgColor: { rgb: "F0F0F0" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
        const centerStyle = { alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
        const leftStyle = { alignment: { horizontal: "left" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
        const rightStyle = { alignment: { horizontal: "right" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

        // Title
        wsData.push([{ v: "DAILY PROGRESS REPORT", s: { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } } }]);
        wsData.push([{ v: `Date: ${displayDate}`, s: { alignment: { horizontal: "center" } } }]);
        wsData.push([{ v: `Conversion Factor: ${headerInfo?.ConversionFactor || '1.55'}`, s: { alignment: { horizontal: "center" }, font: { italic: true } } }]);
        wsData.push([""]);

        // --- Production Details ---
        wsData.push([{ v: "PRODUCTION DETAILS", s: { font: { bold: true } } }]);
        const prodHeaders = ["Sl No.", "Material", "Unit", "For The Day", "", "For The Month", "", "For The Year", ""];
        const prodSubHeaders = ["", "", "", "Trips", "Qty", "Trips", "Qty", "Trips", "Qty"];

        wsData.push(prodHeaders.map(h => ({ v: h, s: headerStyle })));
        wsData.push(prodSubHeaders.map(h => ({ v: h, s: subHeaderStyle })));

        production.forEach(row => {
            wsData.push([
                { v: row.SlNo, s: centerStyle },
                { v: row.MaterialName, s: leftStyle },
                { v: row.Unit, s: centerStyle },
                { v: row.DayTrip, s: centerStyle },
                { v: row.DayQty, s: rightStyle },
                { v: row.MonthTrip, s: centerStyle },
                { v: row.MonthQty, s: rightStyle },
                { v: row.YearTrip, s: centerStyle },
                { v: row.YearQty, s: rightStyle }
            ]);
        });
        wsData.push([""]);

        // --- Drilling Details ---
        wsData.push([{ v: "DRILLING DETAILS", s: { font: { bold: true } } }]);
        const drillHeaders = ["Sl No.", "Material Type", "No. of Holes Drilled", "", "", "Drilled Meters", "", "", "Total Hrs", "", "", "Meters/Hr", "", ""];
        const drillSubHeaders = ["", "", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD"];

        wsData.push(drillHeaders.map(h => ({ v: h, s: headerStyle })));
        wsData.push(drillSubHeaders.map(h => ({ v: h, s: subHeaderStyle })));

        drilling.forEach(row => {
            wsData.push([
                { v: row.SlNo, s: centerStyle },
                { v: row.MaterialType, s: leftStyle },
                { v: row.Holes_FTD, s: centerStyle },
                { v: row.Holes_MTD, s: centerStyle },
                { v: row.Holes_YTD, s: centerStyle },
                { v: row.Drilling_FTD, s: centerStyle },
                { v: row.Drilling_MTD, s: centerStyle },
                { v: row.Drilling_YTD, s: centerStyle },
                { v: row.Hrs_FTD, s: centerStyle },
                { v: row.Hrs_MTD, s: centerStyle },
                { v: row.Hrs_YTD, s: centerStyle },
                { v: "", s: centerStyle }, { v: "", s: centerStyle }, { v: "", s: centerStyle }
            ]);
        });
        wsData.push([""]);

        // --- Blasting Details ---
        wsData.push([{ v: "BLASTING DETAILS", s: { font: { bold: true } } }]);
        const blastHeaders = ["Sl No.", "No. of Holes", "", "", "Total Explosive Used", "", "", "Blasted Volume", "", "", "Powder Factor", "", ""];
        const blastSubHeaders = ["", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD"];

        wsData.push(blastHeaders.map(h => ({ v: h, s: headerStyle })));
        wsData.push(blastSubHeaders.map(h => ({ v: h, s: subHeaderStyle })));

        blasting.forEach(row => {
            wsData.push([
                { v: row.SlNo, s: centerStyle },
                { v: row.Holes_FTD, s: centerStyle },
                { v: row.Holes_MTD, s: centerStyle },
                { v: row.Holes_YTD, s: centerStyle },
                { v: row.Exp_FTD, s: centerStyle },
                { v: row.Exp_MTD, s: centerStyle },
                { v: row.Exp_YTD, s: centerStyle },
                { v: row.TotalVolume_FTD, s: centerStyle },
                { v: row.TotalVolume_MTD, s: centerStyle },
                { v: row.TotalVolume_YTD, s: centerStyle },
                { v: row.PowderFactor_FTD, s: centerStyle },
                { v: row.PowderFactor_MTD, s: centerStyle },
                { v: row.PowderFactor_YTD, s: centerStyle },
            ]);
        });
        wsData.push([""]);

        // --- Crusher Details ---
        wsData.push([{ v: "CRUSHER PRODUCTION", s: { font: { bold: true } } }]);
        const crushHeaders = ["Plant", "Hrs Run", "", "", "Production Qty.", "", "", "KWH", "", "", "KWH/Hrs", "", ""];
        const crushSubHeaders = ["", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD", "FTD", "MTD", "YTD"];

        wsData.push(crushHeaders.map(h => ({ v: h, s: headerStyle })));
        wsData.push(crushSubHeaders.map(h => ({ v: h, s: subHeaderStyle })));

        crusher.forEach(row => {
            wsData.push([
                { v: row.Plant, s: leftStyle },
                { v: row.Hrs_FTD, s: centerStyle },
                { v: row.Hrs_MTD, s: centerStyle },
                { v: row.Hrs_YTD, s: centerStyle },
                { v: row.Qty_FTD, s: centerStyle },
                { v: row.Qty_MTD, s: centerStyle },
                { v: row.Qty_YTD, s: centerStyle },
                { v: row.KWH_FTD, s: centerStyle },
                { v: row.KWH_MTD, s: centerStyle },
                { v: row.KWH_YTD, s: centerStyle },
                { v: row.KWH_HR_FTD, s: centerStyle },
                { v: row.KWH_HR_MTD, s: centerStyle },
                { v: row.KWH_HR_YTD, s: centerStyle },
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
            { wch: 8 }, { wch: 20 }, { wch: 10 },
            { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Daily Progress");
        XLSX.writeFile(wb, `Daily_Progress_Report_${displayDate}.xlsx`);
        toast.success("Excel exported successfully!");
    };


    return (
        <div className={styles.container}>
            <div className={`print:hidden ${styles.headingWrapper}`}>
                <h1 className={styles.title}>Daily Progress Report</h1>

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
                    onClick={handleShowReport}
                    disabled={loading}
                    className={styles.generateBtn}
                >
                    {loading ? 'Generating...' : 'Show Report'}
                </button>

                {reportData?.headerInfo?.ConversionFactor && (
                    <div className="ml-4 font-semibold text-blue-600 flex items-center">
                        BCM Conversion Factor : {reportData.headerInfo.ConversionFactor}
                    </div>
                )}

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
                    <DailyProgressTable data={reportData} date={date} />
                </div>
            )}
        </div>
    );
}
