'use client';
import React from 'react';
import styles from './CrStoppageCumulative.module.css';

export default function CrStoppageCumulativeTable({ data, date }) {
    if (!data || !data.plants || data.plants.length === 0) return (
        <div className="p-5 text-center text-gray-500">
            No Data Found
        </div>
    );

    const { plants, metricsMap, stoppageRows, calculatedTotalStop } = data;

    // Formatters
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0';
    const fmtDec0 = (val) => val != null ? Number(val).toFixed(0) : '0';

    // Helper to get metric for plant
    const getMetric = (pId, key) => metricsMap[pId]?.[key] || 0;

    return (
        <div className={styles.container}>
            <div id="report-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', position: 'relative', minHeight: '110px' }}>
                    {/* Logo - Positioned left */}
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                        <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '96px', objectFit: 'contain' }} />
                    </div>

                    {/* Text Block - Centered */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"}</h1>
                        <h2 style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"}</h2>
                        <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem', textDecoration: 'underline' }}>Stoppage cumulative report</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: '#334155', fontWeight: '500' }}>
                            <div>Date: {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').replace(/\//g, '-')}</div>
                        </div>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="bg-white w-[100px]">Sl.No.</th>
                                <th className="bg-white min-w-[200px] text-center">Description</th>
                                {plants.map(p => (
                                    <th key={p.id} className="bg-white">{p.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Fixed Metrics */}
                            <tr>
                                <td>1</td>
                                <td className="text-left font-bold pl-2">Apron Starting. Hour</td>
                                {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getMetric(p.id, 'startingHour'))}</td>)}
                            </tr>
                            <tr>
                                <td>2</td>
                                <td className="text-left font-bold pl-2">Apron Closing Hour</td>
                                {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getMetric(p.id, 'closingHour'))}</td>)}
                            </tr>

                            {/* Total Running (Blue) */}
                            <tr className="bg-blue-50 font-bold">
                                <td>3</td>
                                <td className="text-left pl-2">Total Running Hour</td>
                                {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getMetric(p.id, 'runningHr'))}</td>)}
                            </tr>

                            {/* Dynamic Stoppages */}
                            {stoppageRows.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{4 + idx}</td>
                                    <td className="text-left pl-2">{row.reason}</td>
                                    {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(row.values[p.id] || 0)}</td>)}
                                </tr>
                            ))}

                            {/* Total Stoppage (Yellow) */}
                            <tr className="bg-yellow-100 font-bold">
                                <td>{4 + stoppageRows.length}</td>
                                <td className="text-left pl-2">Total stoppage Hour</td>
                                {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(calculatedTotalStop[p.id])}</td>)}
                            </tr>

                            {/* Total Shift Hour */}
                            <tr>
                                <td></td>
                                <td className="text-left font-bold pl-2">Total Shift Hour</td>
                                {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getMetric(p.id, 'totalShiftHour'))}</td>)}
                            </tr>

                            {/* Remarks Row (Per Plant) */}
                            <tr>
                                <td></td>
                                <td className="text-left font-bold pl-2">REMARKS:-</td>
                                {plants.map(p => (
                                    <td key={p.id} className="text-left text-[11px] align-top whitespace-pre-wrap p-1">
                                        {getMetric(p.id, 'remarks') || ''}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
