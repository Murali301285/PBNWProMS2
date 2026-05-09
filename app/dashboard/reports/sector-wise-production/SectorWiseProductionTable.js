'use client';
import React, { useMemo } from 'react';
import styles from './SectorWiseProduction.module.css';

const TableHeader = () => (
    <thead className={styles.blueHeader}>
        <tr>
            <th className="w-12">Si No</th>
            <th>Equipment Name</th>
            <th>Patch</th>
            <th>Trip</th>
            <th>Qty(BCM)</th>
            <th>OB Hrs</th>
            <th>Target BCM/Hr</th>
            <th>BCM/Hr</th>
            <th>Method</th>
        </tr>
    </thead>
);

export default function SectorWiseProductionTable({ data, date, shiftName }) {
    if (!data) return null;

    const formatDate = (d) => {
        if (!d) return '';
        const [y, m, day] = d.split('-');
        return `${day}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m, 10) - 1]}-${y}`;
    };

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0';
    const fmtDec = (val) => val != null ? Math.round(Number(val)) : '0';

    // Group Data by Sector
    const groupedData = useMemo(() => {
        const groups = {};
        data.forEach(row => {
            const sector = row.SectorName || 'Unknown';
            if (!groups[sector]) groups[sector] = [];
            groups[sector].push(row);
        });
        return groups;
    }, [data]);

    const sectors = Object.keys(groupedData).sort();

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', width: '100%' }}>
                {/* Logo - Left */}
                <div style={{ flex: '0 0 100px', display: 'flex', justifyContent: 'flex-start' }}>
                    <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '70px', objectFit: 'contain' }} />
                </div>

                {/* Text Block - Centered */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 0.5rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '4px' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"}</h1>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '6px' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"}</h2>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1d4ed8', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '8px', textDecoration: 'underline', textUnderlineOffset: '4px' }}>SECTOR WISE PRODUCTION REPORT</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: 'bold' }}>
                        <div style={{ textTransform: 'uppercase' }}>{shiftName}</div>
                        <span style={{ color: '#1e293b' }}>|</span>
                        <div>Date: {formatDate(date)}</div>
                    </div>
                </div>

                {/* Empty Spacer - Right (for symmetry to center the text exactly) */}
                <div style={{ flex: '0 0 100px' }}></div>
            </div>

            <div className="overflow-x-auto print:overflow-visible print:block">
                {sectors.map((sector, sIdx) => {
                    const rows = groupedData[sector];

                    // Sector Totals
                    const secTrips = rows.reduce((s, r) => s + (r.Trips || 0), 0);
                    const secQty = rows.reduce((s, r) => s + (r.QtyBCM || 0), 0);
                    const secHrs = rows.reduce((s, r) => s + (r.OBHrs || 0), 0);
                    const secEff = secHrs > 0 ? secQty / secHrs : 0;

                    return (
                        <div key={sector} className="mb-8">
                            {/* Sector Title */}
                            <h3 className="text-lg mb-2 font-bold text-blue-900">
                                {String.fromCharCode(65 + sIdx)}. <span className="underline">{sector}</span>
                            </h3>

                            <table className={styles.table}>
                                <TableHeader />
                                <tbody>
                                    {rows.map((r, rIdx) => (
                                        <tr key={rIdx} className="bg-white hover:bg-slate-50 border-b border-slate-100">
                                            <td className="text-center">{rIdx + 1}</td>
                                            <td className="text-left pl-2 font-medium">{r.EquipmentName}</td>
                                            <td>{r.PatchName}</td>
                                            <td>{r.Trips}</td>
                                            <td>{fmt(r.QtyBCM)}</td>
                                            <td>{r.OBHrs?.toFixed(1) || '-'}</td>
                                            <td>{r.TargetBCMHr || 0}</td>
                                            <td className="font-bold text-slate-700">{fmtDec(r.BCMHr)}</td>
                                            <td>{r.MethodName}</td>
                                        </tr>
                                    ))}
                                    {/* Sector Subtotal */}
                                    <tr className="bg-blue-100 font-bold">
                                        <td colSpan="3" className="text-right pr-4 py-2">Total ({sector})</td>
                                        <td>{secTrips}</td>
                                        <td>{fmt(secQty)}</td>
                                        <td>{secHrs.toFixed(1)}</td>
                                        <td>-</td>
                                        <td>{fmtDec(secEff)}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}

                {/* Grand Total */}
                <div className="mt-8 border-t-4 border-black pt-4">
                    <table className={styles.table}>
                        <TableHeader />
                        <tbody>
                            <tr className="bg-yellow-300 font-bold border-t-2 border-black" style={{ fontSize: '1.1rem' }}>
                                <td></td>
                                <td className="text-center">Grand Total</td>
                                <td></td>
                                <td>{data.reduce((s, r) => s + (r.Trips || 0), 0)}</td>
                                <td>{fmt(data.reduce((s, r) => s + (r.QtyBCM || 0), 0))}</td>
                                <td>{data.reduce((s, r) => s + (r.OBHrs || 0), 0).toFixed(1)}</td>
                                <td>-</td>
                                <td>
                                    {(() => {
                                        const tQty = data.reduce((s, r) => s + (r.QtyBCM || 0), 0);
                                        const tHrs = data.reduce((s, r) => s + (r.OBHrs || 0), 0);
                                        return tHrs > 0 ? fmtDec(tQty / tHrs) : "0";
                                    })()}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* OB Target vs Achieved Summary Table */}
                <div className="mt-8 mb-8 w-1/2">
                    <h3 className={styles.sectionHeader}>Summary</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th rowSpan="2" className="border-r border-slate-300 w-1/3">Location</th>
                                <th colSpan="3" className="text-center font-bold">OB</th>
                            </tr>
                            <tr className={styles.blueHeader}>
                                <th>Total Qty</th>
                                <th>Target</th>
                                <th>Achieved %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectors.map((sector, sIdx) => {
                                const rows = groupedData[sector];
                                const secAchieved = rows.reduce((s, r) => s + (r.QtyBCM || 0), 0);
                                const secTarget = rows.reduce((s, r) => s + (r.TargetBCMHr || 0), 0); // Need to pull proper target if added to SP later
                                const percent = secTarget > 0 ? ((secAchieved / secTarget) * 100).toFixed(0) : 0;

                                return (
                                    <tr key={sector} className="bg-white border-b border-slate-300">
                                        <td className="text-center font-bold">
                                            {sector}
                                        </td>
                                        <td className="text-center font-bold">{fmt(secAchieved)}</td>
                                        <td className="text-center text-fuchsia-600 font-bold">{fmt(secTarget)}</td>
                                        <td className="text-center font-bold relative">
                                            {percent}%
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* Summary Total */}
                            <tr className="bg-white font-bold border-t-2 border-black">
                                <td className="text-center font-bold">
                                    Total
                                </td>
                                <td className="text-center">
                                    {fmt(data.reduce((s, r) => s + (r.QtyBCM || 0), 0))}
                                </td>
                                <td className="text-center text-fuchsia-600">
                                    {fmt(data.reduce((s, r) => s + (r.TargetBCMHr || 0), 0))}
                                </td>
                                <td className="text-center relative font-bold">
                                    {(() => {
                                        const totalAchieved = data.reduce((s, r) => s + (r.QtyBCM || 0), 0);
                                        const totalTarget = data.reduce((s, r) => s + (r.TargetBCMHr || 0), 0);
                                        return totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(0) : 0;
                                    })()}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
