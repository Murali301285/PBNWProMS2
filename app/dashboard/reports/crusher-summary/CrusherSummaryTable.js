'use client';
import React from 'react';
import styles from './CrusherSummary.module.css';

export default function CrusherSummaryTable({ data, meta, date }) {
    if (!data || data.length === 0) return (
        <div className="p-5 text-center text-gray-500">
            No Data Found
        </div>
    );

    const { shiftNames } = meta;

    // Formatters
    const fmtQty = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
    const fmtHr = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
    const fmtInt = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';

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

        // Table 2 Totals
        acc.monthlyCumRHR += row.monthlyCumRHR || 0;
        acc.prodFromBSR += row.monthlyCumBSR || 0;

        return acc;
    }, {
        RunningHr: 0, ProdFTD: 0, ProdFTM: 0, ProdYTD: 0,
        monthlyCumRHR: 0, prodFromBSR: 0
    });

    return (
        <div className={styles.container}>
            {/* Report Content - Print Area */}
            <div id="report-content">

                {/* Header Summary Box */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', position: 'relative', minHeight: '110px' }}>
                    {/* Logo - Positioned left */}
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                        <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '96px', objectFit: 'contain' }} />
                    </div>

                    {/* Text Block - Centered */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                        <h2 style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem' }}>PAKRI BARWADIH COAL MINING PROJECT</h2>
                        <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem', textDecoration: 'underline' }}>CRUSHER PRODUCTION REPORT</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: '#334155', fontWeight: '500' }}>
                            <div>Date: {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').replace(/\//g, '-')}</div>
                        </div>
                    </div>
                </div>

                {/* Table 1: Production */}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="bg-pink-100 w-10">Sl.No.</th>
                                <th className="bg-pink-100 min-w-[100px]">Details</th>
                                <th className="bg-pink-100 w-20">Running Hour<br />Actuals for the day</th>
                                {shiftNames.map(s => (
                                    <th key={s} className="bg-pink-100 w-16">{s}</th>
                                ))}
                                <th className="bg-blue-100">Cum Production FTD</th>
                                <th className="bg-blue-100">Cum TPH FTD</th>
                                <th className="bg-green-100">Cum Production FTM</th>
                                <th className="bg-yellow-100">Production YTD 25-26</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => {
                                const cumTphFtd = row.RunningHr > 0 ? (row.ProductionQty / row.RunningHr) : 0;
                                return (
                                    <tr key={i}>
                                        <td className="font-bold">{i + 1}</td>
                                        <td className="font-bold text-left">{row.PlantName}</td>
                                        <td className="font-bold text-right">{fmtHr(row.RunningHr)}</td>

                                        {shiftNames.map(s => (
                                            <td key={s} className="text-right">{fmtQty(row.shifts[s])}</td>
                                        ))}

                                        <td className="font-bold text-right">{fmtQty(row.ProductionQty)}</td>
                                        <td className="font-bold text-right">{fmtInt(cumTphFtd)}</td>
                                        <td className="font-bold text-right bg-green-50">{fmtQty(row.ProdFTM)}</td>
                                        <td className="font-bold text-right bg-orange-50">{fmtQty(row.ProdYTD)}</td>
                                    </tr>
                                )
                            })}

                            {/* Total Row */}
                            <tr style={{ fontWeight: 'bold' }} className="bg-white">
                                <td colSpan={2} style={{ fontWeight: 'bold' }} className="text-right pr-4">Total Production</td>
                                <td style={{ fontWeight: 'bold' }} className="text-right">{fmtHr(totals.RunningHr)}</td>
                                {shiftNames.map(s => (
                                    <td key={s} style={{ fontWeight: 'bold' }} className="text-right">{fmtQty(totalProdShift[s])}</td>
                                ))}
                                <td style={{ fontWeight: 'bold' }} className="text-right">{fmtQty(totals.ProdFTD)}</td>
                                <td style={{ fontWeight: 'bold' }} className="text-right">-</td>
                                <td style={{ fontWeight: 'bold' }} className="text-right bg-green-50">{fmtQty(totals.ProdFTM)}</td>
                                <td style={{ fontWeight: 'bold' }} className="text-right bg-orange-50">{fmtQty(totals.ProdYTD)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Table 2: HMR/BSR (Performance) */}
                <div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="bg-green-100 w-10">Sl.No.</th>
                                <th className="bg-green-100">Details</th>
                                <th className="bg-pink-100">Month Starting<br />HMR</th>
                                <th className="bg-pink-100">As on Date<br />Closing HMR</th>
                                <th className="bg-pink-100">Monthly cum<br />RHR</th>
                                <th className="bg-pink-100">Month Starting BSR</th>
                                <th className="bg-pink-100">As on Date Closing<br />BSR</th>
                                <th className="bg-pink-100">Monthly cum<br />RHR (BSR)</th>
                                <th className="bg-blue-100">AVG TPH FTM</th>
                                <th className="bg-yellow-100">Budget FTM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i}>
                                    <td className="font-bold">{i + 1}</td>
                                    <td className="font-bold text-left">{row.PlantName}</td>
                                    <td className="text-right">{fmtHr(row.HMR?.MonthStartingHMR)}</td>
                                    <td className="text-right">{fmtHr(row.HMR?.AsonDateClosingHMR)}</td>
                                    <td className="font-bold text-right">{fmtHr(row.monthlyCumRHR)}</td>

                                    <td className="text-right">{row.HMR?.MonthStartingBSR ?? 'N/A'}</td>
                                    <td className="text-right">{row.HMR?.AsonDateClosingBSR ?? 'N/A'}</td>
                                    <td className="font-bold text-right bg-green-50">{fmtQty(row.monthlyCumBSR)}</td>

                                    <td className="font-bold text-right">{fmtInt(row.avgTphFtm)}</td>
                                    <td className="font-bold text-right bg-yellow-50">{fmtInt(row.budgetFtm)}</td>
                                </tr>
                            ))}

                            <tr style={{ fontWeight: 'bold' }} className="bg-white border-t-2 border-black">
                                <td colSpan={2} style={{ fontWeight: 'bold' }} className="text-center p-2 text-sm">Total Production</td>
                                <td colSpan={5} className="bg-gray-100"></td>
                                <td style={{ fontWeight: 'bold' }} className="text-right bg-green-50">{fmtQty(totals.prodFromBSR)}</td>
                                <td className="bg-gray-100"></td>
                                <td style={{ fontWeight: 'bold' }} className="text-right bg-yellow-50">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
