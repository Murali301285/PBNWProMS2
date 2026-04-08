import React from 'react';
import styles from './WaterTankerReport.module.css';

export default function WaterTankerTable({ data, fromDate, toDate }) {
    if (!data || data.length === 0) return (
        <div className="flex justify-center items-center p-8 text-gray-500">No records found.</div>
    );

    // Formatters
    const fmt0 = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';
    const fmt3 = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0.000';

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').replace(/\//g, '-');
    };

    const displayFrom = formatDate(fromDate);
    const displayTo = formatDate(toDate);
    const dateStr = `From Date: ${displayFrom || '-'}        To Date: ${displayTo || '-'}`;

    return (
        <div className="w-full">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', position: 'relative', minHeight: '110px' }}>
                {/* Logo - Positioned left */}
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                    <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '96px', objectFit: 'contain' }} />
                </div>

                {/* Text Block - Centered */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                    <h2 style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem' }}>PAKRI BARWADIH COAL MINING PROJECT</h2>
                    <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem', textDecoration: 'underline' }}>WATER TANKER PERFORMANCE REPORT</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: '#334155', fontWeight: '500' }}>
                        <div>{dateStr}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-6 mt-4">
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="text-center w-12 py-2">S.N.</th>
                                <th className="text-center py-2">Date</th>
                                <th className="text-left pl-2 py-2">Water Tanker Equipment</th>
                                <th className="text-right pr-2 py-2">Trip</th>
                                <th className="text-right pr-2 py-2">Tanker Capacity (Cub mtr)</th>
                                <th className="text-right pr-2 py-2">Qty.</th>
                                <th className="text-left pl-2 py-2">Filling Point</th>
                                <th className="text-left pl-2 py-2">Filling Pump</th>
                                <th className="text-left pl-2 py-2">Destination</th>
                                <th className="text-left pl-2 py-2">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50 text-sm">
                                    <td className="text-center py-1.5 border border-slate-300">{idx + 1}</td>
                                    <td className="text-center py-1.5 border border-slate-300">{formatDate(row.Date)}</td>
                                    <td className="text-left pl-2 py-1.5 font-medium border border-slate-300">{row['Water Tanker Equipment']}</td>
                                    <td className="text-right pr-2 py-1.5 border border-slate-300">{fmt0(row.Trip)}</td>
                                    <td className="text-right pr-2 py-1.5 border border-slate-300">{fmt0(row['Tanker Capacity'])}</td>
                                    <td className="text-right pr-2 py-1.5 font-bold border border-slate-300 text-blue-800">{fmt3(row.Qty)}</td>
                                    <td className="text-left pl-2 py-1.5 border border-slate-300">{row['Filling Point']}</td>
                                    <td className="text-left pl-2 py-1.5 border border-slate-300">{row['Filling Pump']}</td>
                                    <td className="text-left pl-2 py-1.5 border border-slate-300">{row.Destination}</td>
                                    <td className="text-left pl-2 py-1.5 border border-slate-300 text-slate-500">{row.Remarks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
