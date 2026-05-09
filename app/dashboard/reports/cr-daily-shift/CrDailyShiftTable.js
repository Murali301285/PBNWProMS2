import React from 'react';
import styles from './CrDailyShift.module.css';

export default function CrDailyShiftTable({ shifts, date }) {
    if (!shifts || shifts.length === 0) return (
        <div className="p-5 text-center text-gray-500">
            No Data Found
        </div>
    );

    // Formatters
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0.00';
    const fmtDec0 = (val) => val != null ? Number(val).toFixed(0) : '0';
    const fmtQty = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0.000';

    return (
        <div className={styles.container}>
            <div id="report-content">
                {/* Standard Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', position: 'relative', minHeight: '110px' }}>
                    {/* Logo - Positioned left */}
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                        <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '96px', objectFit: 'contain' }} />
                    </div>

                    {/* Text Block - Centered */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"}</h1>
                        <h2 style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"}</h2>
                        <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem', textDecoration: 'underline' }}>Crusher Daily Shift Report</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: '#334155', fontWeight: '500' }}>
                            <div>Date: {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').replace(/\//g, '-')}</div>
                        </div>
                    </div>
                </div>

                {shifts.map((shift, idx) => {
                    const { plants, name: shiftName, inCharge } = shift;

                    // Time Logic
                    let timeFrom = "", timeTo = "";
                    const sn = shiftName.toUpperCase();
                    if (sn.includes('A')) { timeFrom = '6:00 am'; timeTo = '2:00 pm'; }
                    else if (sn.includes('B')) { timeFrom = '2:00 pm'; timeTo = '10:00 pm'; }
                    else if (sn.includes('C')) { timeFrom = '10:00 pm'; timeTo = '6:00 am'; }
                    else { timeFrom = '8:30 am'; timeTo = '5:00 pm'; }

                    const shiftTotalProd = plants.reduce((sum, p) => sum + (shift.plantMetrics[p.id]?.TotalProductionMT || 0), 0);

                    // Calculations
                    const getMetric = (pId, key) => shift.plantMetrics[pId]?.[key] || 0;
                    const getStoppageVal = (reason, pId) => shift.stoppageValues[reason]?.[pId] || 0;
                    const getTotalStop = (pId) => shift.stoppages.reduce((sum, r) => sum + (shift.stoppageValues[r]?.[pId] || 0), 0);
                    const getTPH = (pId) => {
                        const m = shift.plantMetrics[pId];
                        return (m && m.RunningHr > 0) ? m.TotalProductionMT / m.RunningHr : 0;
                    };

                    let rowNum = 1;

                    return (
                        <div key={idx} className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    {/* Row 1: Incharges */}
                                    <tr>
                                        <th colSpan={2} className="bg-white text-left pl-2 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span>Large Scale Incharge :- <span className="font-normal">{shift.largeIncharge || '-'}</span></span>
                                            </div>
                                        </th>
                                        <th colSpan={plants.length} className="bg-white text-left pl-2 text-sm">
                                            <span>Mid Scale Incharge :- <span className="font-normal">{shift.midIncharge || '-'}</span></span>
                                        </th>
                                    </tr>
                                    {/* Row 2: Columns */}
                                    <tr className={styles.blueHeader}>
                                        <th className="bg-white">SHIFT - {shiftName}</th>
                                        <th className="bg-white text-center">Description</th>
                                        {plants.map(p => <th key={p.id} className="bg-white">{p.name}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 1. Time */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">Time From</td>
                                        {plants.map(p => <td key={p.id}>{timeFrom}</td>)}
                                    </tr>
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">Time To</td>
                                        {plants.map(p => <td key={p.id}>{timeTo}</td>)}
                                    </tr>

                                    {/* 2. Readings */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">S.B.S. Reading</td>
                                        {plants.map(p => <td key={p.id} className="text-right">{fmtDec0(getMetric(p.id, 'SBS_Reading'))}</td>)}
                                    </tr>
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">C.B.S. Reading</td>
                                        {plants.map(p => <td key={p.id} className="text-right">{fmtDec0(getMetric(p.id, 'CBS_Reading'))}</td>)}
                                    </tr>

                                    {/* 3. Prod (Yellow) */}
                                    <tr className="bg-yellow-100 font-bold">
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">Total Production In MT</td>
                                        {plants.map(p => <td key={p.id} className="text-right">{fmtQty(getMetric(p.id, 'TotalProductionMT'))}</td>)}
                                    </tr>

                                    {/* 4. Trips */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">No of Trip Unloaded</td>
                                        {plants.map(p => <td key={p.id} className="text-right">{fmtDec0(getMetric(p.id, 'NoofTripUnloaded'))}</td>)}
                                    </tr>

                                    {/* 5. Apron HMR */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">Apron Starting. Hour</td>
                                        {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getMetric(p.id, 'ApronStartingHour'))}</td>)}
                                    </tr>
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">Apron Closing Hour</td>
                                        {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getMetric(p.id, 'ApronClosingHour'))}</td>)}
                                    </tr>

                                    {/* 6. Running (Blue) */}
                                    <tr className="bg-blue-50 font-bold">
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">Total Running Hour</td>
                                        {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getMetric(p.id, 'RunningHr'))}</td>)}
                                    </tr>

                                    {/* 7. TPH */}
                                    <tr>
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">TPH</td>
                                        {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getTPH(p.id))}</td>)}
                                    </tr>

                                    {/* 8. Stoppages */}
                                    {shift.stoppages.map(reason => (
                                        <tr key={reason}>
                                            <td>{rowNum++}</td>
                                            <td className="text-left pl-2">{reason}</td>
                                            {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getStoppageVal(reason, p.id))}</td>)}
                                        </tr>
                                    ))}

                                    {/* 9. Total Stop (Yellow) */}
                                    <tr className="bg-yellow-100 font-bold">
                                        <td>{rowNum++}</td>
                                        <td className="text-left pl-2">Total stoppage Hour</td>
                                        {plants.map(p => <td key={p.id} className="text-right">{fmtDec2(getTotalStop(p.id))}</td>)}
                                    </tr>

                                    {/* 10. Shift Hour */}
                                    <tr>
                                        <td></td>
                                        <td className="text-left font-bold pl-2">Total Shift Hour</td>
                                        {plants.map(p => <td key={p.id} className="text-right">8.00</td>)}
                                    </tr>

                                    {/* 11. Total Prod Footer */}
                                    <tr className="bg-white font-bold" style={{ fontWeight: 'bold' }}>
                                        <td colSpan={2} className="text-left pl-2 font-bold" style={{ fontWeight: 'bold' }}>Total Production</td>
                                        <td colSpan={plants.length} className="text-right pr-4 font-bold" style={{ fontWeight: 'bold' }}>{fmtQty(shiftTotalProd)}</td>
                                    </tr>

                                    {/* 12. Remarks */}
                                    <tr>
                                        <td></td>
                                        <td className="text-left font-bold pl-2">REMARKS:-</td>
                                        {plants.map(p => (
                                            <td key={p.id} className="text-left text-[11px] align-top whitespace-pre-wrap p-1">
                                                {shift.remarks[p.id] || ''}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
