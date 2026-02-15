import React from 'react';
import styles from '../daily-production/DailyProduction.module.css';

export default function DayWiseProductionTable({ data, date }) {
    if (!data) return null;

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    // Calculate Grand Total
    const grand = data.reduce((acc, r) => ({
        coal: acc.coal + (r.Coal_MT || 0),
        ob: acc.ob + (r.OB_BCM || 0),
        dispatch: acc.dispatch + (r.Dispatch_MT || 0),
        total: acc.total + (r.TotalProduction_BCM || 0)
    }), { coal: 0, ob: 0, dispatch: 0, total: 0 });

    return (
        <div style={{ width: '100%' }}>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <h1 className="text-xl font-bold text-slate-800 uppercase">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                <h2 className="text-lg font-bold text-slate-800 uppercase">PAKRI BARWADIH COAL MINING PROJECT</h2>
                <h3 className="text-lg text-blue-800 decoration-slate-900 underline underline-offset-4 font-bold uppercase" style={{ marginTop: '0.5rem' }}>DAY WISE PRODUCTION REPORT</h3>
                <div className="mt-1 text-sm text-slate-600">Month: {new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
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
                                <td>{fmtDate(r.Date)}</td>
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
