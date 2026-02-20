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
        return `${day}/${m}/${y}`;
    };

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0';
    const fmtDec = (val) => val != null ? Number(val).toFixed(2) : '0.00';

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
            <div className={styles.header}>
                <h1 className="text-xl font-bold">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                <h2 className="text-lg font-bold">PAKRI BARWADIH COAL MINING PROJECT</h2>
                <h3 className="text-lg mt-2 text-blue-700 decoration-slate-900 underline underline-offset-4 font-bold">SECTOR WISE PRODUCTION REPORT</h3>
                <div className="mt-2 text-sm text-slate-800 font-bold uppercase">{shiftName}</div>
                <div className="text-sm text-slate-600 font-medium">Date: {formatDate(date)}</div>
            </div>

            <div className="overflow-x-auto">
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
                                        return tHrs > 0 ? fmtDec(tQty / tHrs) : "0.00";
                                    })()}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
