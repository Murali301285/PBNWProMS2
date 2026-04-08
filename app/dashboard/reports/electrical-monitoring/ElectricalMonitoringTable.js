
import React, { useMemo } from 'react';
import styles from './ElectricalMonitoring.module.css';

export default function ElectricalMonitoringTable({ data, date }) {
    if (!data) return null;

    // Format Date Helpers (dd/mm/yyyy)
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-').replace(/\//g, '-'); // DD/MM/YYYY
    };

    const displayDate = formatDate(date);
    const dateObj = new Date(date);
    const monthName = dateObj.toLocaleString('default', { month: 'short' }) + '-' + dateObj.getFullYear().toString().slice(-2);
    const dayOfMonth = dateObj.getDate();

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0.00';
    const fmtDec3 = (val) => val != null ? Number(val).toFixed(3) : '0.000';

    // Process Data (Flat)
    const processedData = useMemo(() => {
        return data.map(row => {
            const ftdHrs = row.FTD_WorkingHr || 0;
            const ftdTrips = row.FTD_Trips || 0;
            const ftdQty = row.FTD_Qty || 0;

            const ftmHrs = row.FTM_WorkingHr || 0;
            const ftmTrips = row.FTM_Trips || 0;
            const ftmQty = row.FTM_Qty || 0;

            const ftdTripsHr = ftdHrs > 0 ? ftdTrips / ftdHrs : 0;
            const ftdBCMHr = ftdHrs > 0 ? ftdQty / ftdHrs : 0;

            const ftmTripsHr = ftmHrs > 0 ? ftmTrips / ftmHrs : 0;
            const ftmBCMHr = ftmHrs > 0 ? ftmQty / ftmHrs : 0;

            const dom = row.DayOfMonth || dayOfMonth || 1;
            const mtdAvgBCMDay = ftmQty / dom;

            return {
                ...row,
                metrics: {
                    ftdTripsHr,
                    ftdBCMHr,
                    ftmTripsHr,
                    ftmBCMHr,
                    mtdAvgBCMDay
                }
            };
        });
    }, [data, dayOfMonth]);

    // Calculate Grand Total
    const grand = data.reduce((acc, r) => ({
        ftdHrs: acc.ftdHrs + (r.FTD_WorkingHr || 0),
        ftdTrips: acc.ftdTrips + (r.FTD_Trips || 0),
        ftdQty: acc.ftdQty + (r.FTD_Qty || 0),
        ftmHrs: acc.ftmHrs + (r.FTM_WorkingHr || 0),
        ftmTrips: acc.ftmTrips + (r.FTM_Trips || 0),
        ftmQty: acc.ftmQty + (r.FTM_Qty || 0),
    }), { ftdHrs: 0, ftdTrips: 0, ftdQty: 0, ftmHrs: 0, ftmTrips: 0, ftmQty: 0 });

    const grandFtdTripsHr = grand.ftdHrs > 0 ? grand.ftdTrips / grand.ftdHrs : 0;
    const grandFtdBCMHr = grand.ftdHrs > 0 ? grand.ftdQty / grand.ftdHrs : 0;
    const grandFtmTripsHr = grand.ftmHrs > 0 ? grand.ftmTrips / grand.ftmHrs : 0;
    const grandFtmBCMHr = grand.ftmHrs > 0 ? grand.ftmQty / grand.ftmHrs : 0;
    const grandMtdAvg = grand.ftmQty / (dayOfMonth || 1);


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
                    <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem', textDecoration: 'underline' }}>ELECTRICAL EQUIPMENTS MONITORING REPORT</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: '#334155', fontWeight: '500' }}>
                        <div>Date: {displayDate}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-6 mt-4">
                <div className={styles.tableContainer}>

                    <table className={styles.table}>
                        <thead>
                            {/* Top Level Headers - Grouped by Metric */}
                            <tr className={styles.blueHeader}>
                                <th rowSpan="2" className="w-12 text-center">Sl. No.</th>
                                <th rowSpan="2" className="text-left pl-2">Equipment</th>
                                <th rowSpan="2" className="text-center">Sector</th>

                                {/* Trip/Hr Block */}
                                <th rowSpan="2" className="w-20 text-indigo-700 bg-slate-50">Target Trip/Hr</th>
                                <th colSpan="2" className="text-center font-bold bg-amber-50">Achieved Trip/Hr</th>

                                {/* BCM/Hr Block */}
                                <th rowSpan="2" className="w-20 text-indigo-700 bg-slate-50">Target BCM/Hr</th>
                                <th colSpan="2" className="text-center font-bold bg-amber-50">Achieved BCM/Hr</th>

                                {/* Unit/Hr Block */}
                                <th rowSpan="2" className="w-20 text-indigo-700 bg-slate-50">Target Unit/Hr</th>
                                <th colSpan="2" className="text-center font-bold bg-amber-50">Achieved Unit/Hr</th>

                                {/* Unit/BCM Block */}
                                <th rowSpan="2" className="w-20 text-indigo-700 bg-slate-50">Target Unit/BCM</th>
                                <th colSpan="2" className="text-center font-bold bg-amber-50">Achieved Unit/BCM</th>

                                {/* Total BCM Block */}
                                <th colSpan="3" className="text-center font-bold bg-amber-100">Total BCM</th>

                                {/* Avg BCM/Day */}
                                <th rowSpan="2" className="w-24 text-center font-bold bg-white">MTD Average BCM/Day</th>
                            </tr>

                            {/* Sub Headers (FTD / MTD) */}
                            <tr className={styles.blueHeader}>
                                {/* Trips */}
                                <th className="bg-white">FTD</th>
                                <th className="bg-white">MTD</th>

                                {/* BCM */}
                                <th className="bg-white">FTD</th>
                                <th className="bg-white">MTD</th>

                                {/* Unit */}
                                <th className="bg-white">FTD</th>
                                <th className="bg-white">MTD</th>

                                {/* Unit/BCM */}
                                <th className="bg-white">FTD</th>
                                <th className="bg-white">MTD</th>

                                {/* Total BCM Breakdown */}
                                <th className="bg-white">FTD</th>
                                <th className="bg-white">MTD</th>
                                <th className="bg-white">FTY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.map((r, idx) => (
                                <tr key={idx} className="hover:bg-blue-50 text-center text-sm">
                                    <td className="text-center">{idx + 1}</td>
                                    <td className="text-left pl-2 font-medium">{r.EquipmentName}</td>
                                    <td className="text-center text-slate-600">{r.SectorName}</td>

                                    {/* Trip/Hr */}
                                    <td className="text-indigo-700 bg-slate-50 font-medium">-</td>
                                    <td className="font-bold text-blue-700">{fmtDec2(r.metrics.ftdTripsHr)}</td>
                                    <td className="font-bold text-slate-800">{fmtDec2(r.metrics.ftmTripsHr)}</td>

                                    {/* BCM/Hr */}
                                    <td className="text-indigo-700 bg-slate-50 font-medium">-</td>
                                    <td className="font-bold text-blue-700">{fmtDec2(r.metrics.ftdBCMHr)}</td>
                                    <td className="font-bold text-slate-800">{fmtDec2(r.metrics.ftmBCMHr)}</td>

                                    {/* Unit/Hr */}
                                    <td className="text-indigo-700 bg-slate-50 font-medium">-</td>
                                    <td className="text-center">-</td>
                                    <td className="text-center">-</td>

                                    {/* Unit/BCM */}
                                    <td className="text-indigo-700 bg-slate-50 font-medium">-</td>
                                    <td className="text-center">-</td>
                                    <td className="text-center">-</td>

                                    {/* Total BCM */}
                                    <td className="font-bold">{fmt(r.FTD_Qty)}</td>
                                    <td className="font-bold">{fmt(r.FTM_Qty)}</td>
                                    <td className="font-bold text-slate-400">-</td>

                                    {/* MTD Avg */}
                                    <td className="font-bold">{fmtDec2(r.metrics.mtdAvgBCMDay)}</td>
                                </tr>
                            ))}

                            {/* Grand Total Row */}
                            <tr className="bg-yellow-300 font-bold border-t-2 border-slate-800">
                                <td colSpan="3" className="text-center font-extrabold text-lg">Total</td>

                                {/* Trip/Hr */}
                                <td className="text-center">-</td>
                                <td className="text-center">{fmtDec2(grandFtdTripsHr)}</td>
                                <td className="text-center">{fmtDec2(grandFtmTripsHr)}</td>

                                {/* BCM/Hr */}
                                <td className="text-center">-</td>
                                <td className="text-center">{fmtDec2(grandFtdBCMHr)}</td>
                                <td className="text-center">{fmtDec2(grandFtmBCMHr)}</td>

                                {/* Unit/Hr */}
                                <td className="text-center">-</td>
                                <td className="text-center">-</td>
                                <td className="text-center">-</td>

                                {/* Unit/BCM */}
                                <td className="text-center">-</td>
                                <td className="text-center">-</td>
                                <td className="text-center">-</td>

                                {/* Total BCM */}
                                <td className="text-center">{fmt(grand.ftdQty)}</td>
                                <td className="text-center">{fmt(grand.ftmQty)}</td>
                                <td className="text-center">-</td>

                                {/* MTD Avg */}
                                <td className="text-center">{fmtDec2(grandMtdAvg)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>


            </div>
        </div>
    );
}
