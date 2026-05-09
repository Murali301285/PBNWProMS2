import React from 'react';
import styles from '../daily-production/DailyProduction.module.css';

export default function DayWiseProductionTable({ data, date }) {
    if (!data) return null;

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';

    // Calculate Grand Total
    const grand = data.reduce((acc, r) => ({
        coal: acc.coal + (r.Coal_MT || 0),
        ob: acc.ob + (r.OB_BCM || 0),
        dispatch: acc.dispatch + (r.Dispatch_MT || 0),
        total: acc.total + (r.TotalProduction_BCM || 0)
    }), { coal: 0, ob: 0, dispatch: 0, total: 0 });

    return (
        <div style={{ width: '100%' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', position: 'relative', minHeight: '110px' }}>
                {/* Logo - Positioned left */}
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                    <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '96px', objectFit: 'contain' }} />
                </div>

                {/* Text Block - Centered */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"}</h1>
                    <h2 style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"}</h2>
                    <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem', textDecoration: 'underline' }}>DAY WISE PRODUCTION REPORT</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 'bold' }}>
                        <div>Month: {new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                        <span style={{ color: '#1e293b' }}>|</span>
                        <div>Date: {`${String(new Date(date).getDate()).padStart(2, '0')}-${new Date(date).toLocaleString('en-GB', { month: 'short' })}-${new Date(date).getFullYear()}`}</div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th>Date</th>
                            <th>Coal (MT)</th>
                            <th>OB (BCM)</th>
                            <th>Total Production</th>
                            <th>Dispatch</th>

                            <th>HSD (Ltr)</th>
                            <th>Ltr / BCM</th>
                            <th>HEMM Lead</th>
                            <th>Mid Scale</th>
                            <th>OB Lead KM</th>
                            <th>Coal Lead KM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((r, idx) => (
                            <tr key={idx}>
                                <td>{r.Date}</td>
                                <td>{fmt(r.Coal_MT)}</td>
                                <td>{fmt(r.OB_BCM)}</td>
                                <td className="font-bold bg-yellow-50">{fmt(r.TotalProduction_BCM)}</td>
                                <td>{fmt(r.Dispatch_MT)}</td>

                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                        ))}

                        {/* Grand Total Row */}
                        <tr className="bg-yellow-200 font-extrabold border-t-2 border-slate-900">
                            <td className="text-right pr-4">Grand Total</td>
                            <td>{fmt(grand.coal)}</td>
                            <td>{fmt(grand.ob)}</td>
                            <td>{fmt(grand.total)}</td>
                            <td>{fmt(grand.dispatch)}</td>

                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
