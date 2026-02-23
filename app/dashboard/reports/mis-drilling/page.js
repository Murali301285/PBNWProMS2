"use client";
import { useState, useEffect } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';
import { RotateCcw, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import MISDrillingTable from './MISDrillingTable';
import styles from './MisDrilling.module.css';

export default function MISDrillingPage() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/mis-drilling?date=${date}`);
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            setData(result);
            toast.success("Report loaded successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to load report");
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleShow = () => fetchData();
    const handleReset = () => {
        setDate(today);
    };

    const handlePrint = () => window.print();

    const handleExportExcel = async () => {
        if (!data) return;
        try {
            const ExcelJS = await import('exceljs');
            const { saveAs } = await import('file-saver');

            const { coal, ob } = data;
            const calcTotals = (rows) => rows.reduce((acc, row) => ({
                NoofHoles: acc.NoofHoles + (row.NoofHoles || 0),
                TotalMeters: acc.TotalMeters + (row.TotalMeters || 0)
            }), { NoofHoles: 0, TotalMeters: 0 });

            const coalTotals = calcTotals(coal || []);
            const obTotals = calcTotals(ob || []);
            const grandTotals = {
                NoofHoles: coalTotals.NoofHoles + obTotals.NoofHoles,
                TotalMeters: coalTotals.TotalMeters + obTotals.TotalMeters
            };

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('MIS Drilling');

            // 1. Column Widths Setup
            ws.columns = [
                { width: 3 },  // A: Padding
                { width: 14 }, // B: Material
                { width: 20 }, // C: Drilling Patch Id
                { width: 18 }, // D: Location
                { width: 18 }, // E: Agency
                { width: 22 }, // F: Remark
                { width: 14 }, // G: No of Holes
                { width: 16 }, // H: Total Meters
                { width: 14 }, // I: Spacing
                { width: 14 }, // J: Burden
                { width: 16 }, // K: Avg Depth
            ];

            // Add Logo
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

            // 2. Headers
            ws.getRow(1).height = 15;

            ws.mergeCells(`B2:K2`);
            setCell(ws.getCell('B2'), "THRIVENI SAINIK MINING PRIVATE LIMITED", { bold: true, align: 'center', border: false, fontSize: 16 });

            ws.mergeCells(`B3:K3`);
            setCell(ws.getCell('B3'), "PAKRI BARWADIH COAL MINING PROJECT", { bold: true, align: 'center', border: false, fontSize: 13 });

            ws.mergeCells(`B4:K4`);
            setCell(ws.getCell('B4'), "MIS DRILLING REPORT", { bold: true, align: 'center', border: false, underline: true, fontSize: 13, color: 'FFDC2626' });

            if (logoId !== undefined) {
                ws.addImage(logoId, {
                    tl: { col: 1, row: 1 },
                    ext: { width: 160, height: 60 }
                });
            }

            ws.mergeCells('B5:D5');
            const fmtDate = date.split('-').reverse().join('-');
            setCell(ws.getCell('B5'), `Drilling Date: ${fmtDate}`, { bold: true, align: 'left', border: false });

            // Space
            ws.getRow(6).height = 10;

            // 3. Table Headers
            const headerRow = ws.getRow(7);
            headerRow.height = 30;
            const headers = ["Material", "Drilling Patch Id", "Location", "Agency", "Remark", "No of Holes", "Total Meters", "Spacing (m)", "Burden (m)", "Avg Depth (m)"];
            headers.forEach((h, i) => {
                setCell(ws.getCell(7, i + 2), h, { bold: true, bg: 'FFEAEAEA' });
            });

            // Freeze panes
            ws.views = [
                { state: 'frozen', xSplit: 0, ySplit: 7 }
            ];

            let currentRow = 8;
            const fmtDec2 = '#,##0.00';
            const fmtDec0 = '#,##0';

            const addDataRow = (row, materialName = '', isTotal = false, bg = null) => {
                let startCol = 2;
                setCell(ws.getCell(currentRow, startCol++), materialName || row.Material, { align: 'left', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.DrillingPatchId || "", { align: 'left', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.Location || "", { align: 'left', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.Agency || "", { align: 'left', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.Remarks || "", { align: 'left', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.NoofHoles || 0, { numFmt: fmtDec0, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.TotalMeters || 0, { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.Spacing || "", { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.Burden || "", { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                setCell(ws.getCell(currentRow, startCol++), row.AverageDepth || "", { numFmt: fmtDec2, align: 'right', bold: isTotal, bg: bg });
                currentRow++;
            };

            // COAL Data
            if (coal && coal.length > 0) {
                coal.forEach((row, i) => addDataRow(row, i === 0 ? 'Coal' : ''));
            }
            addDataRow({ NoofHoles: coalTotals.NoofHoles, TotalMeters: coalTotals.TotalMeters }, "Coal Total", true, "FFF5F5F5");

            // Empty row inside table mapping
            let startCol = 2;
            for (let i = 0; i < 10; i++) setCell(ws.getCell(currentRow, startCol++), "");
            currentRow++;

            // OB Data
            if (ob && ob.length > 0) {
                ob.forEach((row, i) => addDataRow(row, i === 0 ? 'OB' : ''));
            }
            addDataRow({ NoofHoles: obTotals.NoofHoles, TotalMeters: obTotals.TotalMeters }, "OB Total", true, "FFF5F5F5");

            // Empty row inside table mapping
            startCol = 2;
            for (let i = 0; i < 10; i++) setCell(ws.getCell(currentRow, startCol++), "");
            currentRow++;

            // Grand Total
            ws.getRow(currentRow).height = 20;
            addDataRow({ NoofHoles: grandTotals.NoofHoles, TotalMeters: grandTotals.TotalMeters }, "Grand Total", true, "FFEAEAEA");

            const buf = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buf]), `ProMS_MIS_Drilling_${date}.xlsx`);
            toast.success("Excel Downloaded Successfully");

        } catch (error) {
            console.error("Excel Export Error:", error);
            toast.error("Failed to export Excel");
        }
    };

    return (
        <div className={styles.container}>
            {loading && <LoadingOverlay message="Generating Report..." />}

            <div className={styles.filterContainer}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input type="date" className={styles.input} value={date} max={today} onChange={e => setDate(e.target.value)} />
                </div>
                <button onClick={handleShow} className={styles.generateBtn}>Show Report</button>
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

            {data && (
                <div className={styles.reportSheet} id="print-area">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', position: 'relative', minHeight: '110px' }}>
                        {/* Logo - Positioned left */}
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                            <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '96px', objectFit: 'contain' }} />
                        </div>

                        {/* Text Block - Centered */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                            <h2 style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem' }}>PAKRI BARWADIH COAL MINING PROJECT</h2>
                            <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem', textDecoration: 'underline' }}>MIS Drilling Report</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: '#334155', fontWeight: '500' }}>
                                <div>Date: {new Date(date).toLocaleDateString('en-GB')}</div>
                            </div>
                        </div>
                    </div>
                    <MISDrillingTable data={data} date={date} />
                </div>
            )}
        </div>
    );
}

