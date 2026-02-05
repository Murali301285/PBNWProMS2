import React from 'react';
import styles from './MisDrilling.module.css';

export default function MisDrillingTable({ data, date }) {
    const { coal = [], ob = [] } = data || {};

    // Formatters
    const fmtMeters = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
    const fmtDepth = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    const fmtHoles = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';
    const fmtDecimal = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '';

    // Calculate Totals
    const calcTotals = (rows) => {
        return rows.reduce((acc, row) => {
            acc.NoofHoles += row.NoofHoles || 0;
            acc.TotalMeters += row.TotalMeters || 0;
            return acc;
        }, { NoofHoles: 0, TotalMeters: 0 });
    };

    const coalTotals = calcTotals(coal);
    const obTotals = calcTotals(ob);
    const grandTotals = {
        NoofHoles: coalTotals.NoofHoles + obTotals.NoofHoles,
        TotalMeters: coalTotals.TotalMeters + obTotals.TotalMeters
    };

    const renderRow = (row, i, isFirst, type) => (
        <tr key={`${type}-${i}`}>
            <td className="text-left pl-2 border border-slate-400">{isFirst ? type : ''}</td>
            <td className="text-left pl-2 border border-slate-400">{row.DrillingPatchId}</td>
            <td className="text-left pl-2 border border-slate-400">{row.Location}</td>
            <td className="text-left pl-2 border border-slate-400">{row.Agency}</td>
            <td className="text-left pl-2 border border-slate-400">{row.Remarks}</td>
            <td className="text-right pr-2 font-bold border border-slate-400">{fmtHoles(row.NoofHoles)}</td>
            <td className="text-right pr-2 font-bold border border-slate-400">{fmtMeters(row.TotalMeters)}</td>
            <td className="text-right pr-2 border border-slate-400">{fmtDecimal(row.Spacing)}</td>
            <td className="text-right pr-2 border border-slate-400">{fmtDecimal(row.Burden)}</td>
            <td className="text-right pr-2 border border-slate-400">{fmtDepth(row.AverageDepth)}</td>
        </tr>
    );

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr className={styles.blueHeader}>
                        <th className="bg-white">Material</th>
                        <th className="bg-white">Drilling Patch Id</th>
                        <th className="bg-white">Location</th>
                        <th className="bg-white">Agency</th>
                        <th className="bg-white">Remark</th>
                        <th className="bg-white">No of Holes</th>
                        <th className="bg-white">Total Meters</th>
                        <th className="bg-white">Spacing (m)</th>
                        <th className="bg-white">Burden (m)</th>
                        <th className="bg-white">Avg Depth (m)</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Coal */}
                    {coal.length > 0 ? (
                        coal.map((row, i) => renderRow(row, i, i === 0, 'Coal'))
                    ) : (
                        <tr>
                            <td className="text-left pl-2 border border-slate-400">Coal</td>
                            <td colSpan={9} className="border border-slate-400"></td>
                        </tr>
                    )}
                    <tr className="bg-gray-200" style={{ fontWeight: 'bold' }}>
                        <td colSpan={5} className="text-left pl-2 border border-slate-400" style={{ fontWeight: 'bold' }}>Coal Total</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmtHoles(coalTotals.NoofHoles)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmtMeters(coalTotals.TotalMeters)}</td>
                        <td colSpan={3} className="border border-slate-400"></td>
                    </tr>

                    {/* OB */}
                    {ob.length > 0 ? (
                        ob.map((row, i) => renderRow(row, i, i === 0, 'OB'))
                    ) : (
                        <tr>
                            <td className="text-left pl-2 border border-slate-400">OB</td>
                            <td colSpan={9} className="border border-slate-400"></td>
                        </tr>
                    )}
                    <tr className="bg-gray-200" style={{ fontWeight: 'bold' }}>
                        <td colSpan={5} className="text-left pl-2 border border-slate-400" style={{ fontWeight: 'bold' }}>OB Total</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmtHoles(obTotals.NoofHoles)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmtMeters(obTotals.TotalMeters)}</td>
                        <td colSpan={3} className="border border-slate-400"></td>
                    </tr>

                    {/* Grand Total */}
                    <tr className="bg-yellow-200 border-t-2 border-black" style={{ fontWeight: 'bold' }}>
                        <td colSpan={5} className="text-left pl-2 border border-slate-400" style={{ fontWeight: 'bold' }}>Grand Total</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmtHoles(grandTotals.NoofHoles)}</td>
                        <td className="text-right pr-2 border border-slate-400" style={{ fontWeight: 'bold' }}>{fmtMeters(grandTotals.TotalMeters)}</td>
                        <td colSpan={3} className="border border-slate-400"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
