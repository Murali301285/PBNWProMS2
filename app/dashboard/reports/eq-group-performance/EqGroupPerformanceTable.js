import React, { useMemo } from 'react';
import styles from './EqGroupPerformance.module.css';

export default function EqGroupPerformanceTable({ data, date }) {
    if (!data) return null;

    // derived constants
    const dateObj = new Date(date);
    const monthName = dateObj.toLocaleString('default', { month: 'short' }) + '-' + dateObj.getFullYear().toString().slice(-2);

    // Format helpers
    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';
    const fmtDec2 = (val) => val != null ? Number(val).toFixed(2) : '0.00';

    // Group Data by Activity
    const groupedData = useMemo(() => {
        const groups = {};
        data.forEach(row => {
            const activity = row.ActivityName || 'Unknown';
            if (!groups[activity]) groups[activity] = [];

            // Calculate Metrics
            const ftdEqRn = row.FTD_NoOfEqRn || 0;
            const ftdHrs = row.FTD_TotalHrs || 0;
            const ftdTrips = row.FTD_TotalTrips || 0;
            const ftdQty = row.FTD_TotalQty || 0;

            const ftmHrs = row.FTM_TotalHrs || 0;
            const ftmTrips = row.FTM_TotalTrips || 0;
            const ftmQty = row.FTM_TotalQty || 0;

            const rnHrsEq = ftdEqRn > 0 ? ftdHrs / ftdEqRn : 0;
            const ftdTripsHr = ftdHrs > 0 ? ftdTrips / ftdHrs : 0;
            const ftdBCMHr = ftdHrs > 0 ? ftdQty / ftdHrs : 0;

            const ftmTripsHr = ftmHrs > 0 ? ftmTrips / ftmHrs : 0;
            const ftmBCMHr = ftmHrs > 0 ? ftmQty / ftmHrs : 0;

            groups[activity].push({
                ...row,
                metrics: {
                    rnHrsEq,
                    ftdTripsHr,
                    ftdBCMHr,
                    ftmTripsHr,
                    ftmBCMHr
                },
                raw: { ftdEqRn, ftdHrs, ftdTrips, ftdQty, ftmHrs, ftmTrips, ftmQty }
            });
        });
        return groups;
    }, [data]);

    const activities = Object.keys(groupedData).sort();

    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        alert("Excel Export update needed for new columns - verifying UI first.");
    };

    return (
        <div className="w-full">

            <div className="text-center mb-6 uppercase font-bold text-slate-800">
                <h1 className="text-xl">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                <h3 className="text-lg mt-2 text-blue-700 decoration-slate-900 underline underline-offset-4">EQUIPMENT MODEL-WISE PERFORMANCE AND EFFICIENCY REPORT</h3>
                <div className="mt-2 text-sm text-slate-600">Date: {date}</div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className="bg-orange-100 text-slate-800">
                            <th rowSpan="2" className="w-40 bg-white border-none"></th>
                            <th colSpan="10" className="bg-rose-100 text-center border font-bold">F. T. D ({date})</th>
                            <th colSpan="3" className="bg-amber-100 text-center border font-bold">F. T. M : {monthName}</th>
                        </tr>

                        <tr className="bg-slate-100 text-xs font-bold text-slate-700 text-center">
                            <th className="bg-white border text-left px-2">ACTIVITY</th>

                            {/* FTD Columns (10) */}
                            <th className="w-20">No Of Eq. Rn</th>
                            <th className="w-20">Rn. Hrs./ Eq.</th>
                            <th className="w-20">Target Trip/Hr</th>
                            <th className="w-20">TRIPS / Hr.</th>
                            <th className="w-24">Target BCM/Hr</th>
                            <th className="w-24">BCM/Hr.</th>
                            <th className="w-24">Target HSD/BCM</th>
                            <th className="w-24">HSD/BCM</th>
                            <th className="w-24">Target HSD/Hr</th>
                            <th className="w-24">HSD/Hr</th>

                            {/* FTM Columns (3) */}
                            <th className="w-20">Trip / Hr.</th>
                            <th className="w-24">BCM(MT) / Hr.</th>
                            <th className="w-24">HSD/BCM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map((act, idx) => {
                            const rows = groupedData[act];

                            // Calculate Subtotals
                            const sub = rows.reduce((acc, r) => ({
                                ftdEqRn: acc.ftdEqRn + r.raw.ftdEqRn,
                                ftdHrs: acc.ftdHrs + r.raw.ftdHrs,
                                ftdTrips: acc.ftdTrips + r.raw.ftdTrips,
                                ftdQty: acc.ftdQty + r.raw.ftdQty,
                                ftmHrs: acc.ftmHrs + r.raw.ftmHrs,
                                ftmTrips: acc.ftmTrips + r.raw.ftmTrips,
                                ftmQty: acc.ftmQty + r.raw.ftmQty,
                            }), { ftdEqRn: 0, ftdHrs: 0, ftdTrips: 0, ftdQty: 0, ftmHrs: 0, ftmTrips: 0, ftmQty: 0 });

                            // Subtotal Metrics
                            const subRnHrsEq = sub.ftdEqRn > 0 ? sub.ftdHrs / sub.ftdEqRn : 0;
                            const subFtdTripsHr = sub.ftdHrs > 0 ? sub.ftdTrips / sub.ftdHrs : 0;
                            const subFtdBCMHr = sub.ftdHrs > 0 ? sub.ftdQty / sub.ftdHrs : 0;
                            const subFtmTripsHr = sub.ftmHrs > 0 ? sub.ftmTrips / sub.ftmHrs : 0;
                            const subFtmBCMHr = sub.ftmHrs > 0 ? sub.ftmQty / sub.ftmHrs : 0;

                            return (
                                <React.Fragment key={act}>
                                    {/* Activity Header */}
                                    <tr>
                                        <td colSpan="14" className={styles.activityHeader}>
                                            {act}
                                        </td>
                                    </tr>

                                    {rows.map((r, rIdx) => (
                                        <tr key={idx + '-' + rIdx} className={`${styles.dataRow} bg-white hover:bg-blue-50 text-center text-sm`}>
                                            <td className="text-left pl-4 font-medium bg-slate-50">{r.EquipmentGroupName}</td>

                                            {/* FTD */}
                                            <td className="font-bold">{r.FTD_NoOfEqRn}</td>
                                            <td>{fmtDec2(r.metrics.rnHrsEq)}</td>
                                            <td>-</td>
                                            <td className="font-bold text-blue-700">{fmtDec2(r.metrics.ftdTripsHr)}</td>
                                            <td>-</td>
                                            <td className="font-bold text-blue-700">{fmtDec2(r.metrics.ftdBCMHr)}</td>
                                            <td>-</td>
                                            <td>-</td>
                                            <td>-</td>
                                            <td>-</td>

                                            {/* FTM */}
                                            <td className={`${styles.ftmCell} font-bold`}>{fmtDec2(r.metrics.ftmTripsHr)}</td>
                                            <td className={`${styles.ftmCell} font-bold`}>{fmtDec2(r.metrics.ftmBCMHr)}</td>
                                            <td className={styles.ftmCell}>-</td>
                                        </tr>
                                    ))}

                                    {/* Activity Total */}
                                    <tr className={styles.totalRow}>
                                        <td className={`${styles.totalCell} text-right pr-4`}>Total</td>

                                        {/* FTD Totals (10 cols) */}
                                        <td className={styles.totalCell}>{sub.ftdEqRn}</td>
                                        <td className={styles.totalCell}>{fmtDec2(subRnHrsEq)}</td>
                                        <td className={styles.totalCell}>-</td>
                                        <td className={styles.totalCell}>{fmtDec2(subFtdTripsHr)}</td>
                                        <td className={styles.totalCell}>-</td>
                                        <td className={styles.totalCell}>{fmtDec2(subFtdBCMHr)}</td>
                                        <td className={styles.totalCell}>-</td>
                                        <td className={styles.totalCell}>-</td>
                                        <td className={styles.totalCell}>-</td>
                                        <td className={styles.totalCell}>-</td>

                                        {/* FTM Totals (3 cols) */}
                                        <td className={styles.totalCell}>{fmtDec2(subFtmTripsHr)}</td>
                                        <td className={styles.totalCell}>{fmtDec2(subFtmBCMHr)}</td>
                                        <td className={styles.totalCell}>-</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
