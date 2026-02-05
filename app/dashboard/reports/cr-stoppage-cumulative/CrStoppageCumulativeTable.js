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
                <div className={styles.header}>
                    <h2 className="text-xl font-bold uppercase text-slate-800">Stoppage cumulative report</h2>
                    <div className="w-full flex justify-end mt-2 px-4">
                        <div className="text-right font-bold text-slate-600 text-sm">Date: {new Date(date).toLocaleDateString('en-GB')}</div>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="bg-white w-[100px]">SHIFT COAL<br />CRUSHING REPORT</th>
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
