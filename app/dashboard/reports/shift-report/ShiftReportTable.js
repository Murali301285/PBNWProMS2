'use client';
import React from 'react';
import styles from './ShiftReport.module.css';

export default function ShiftReportTable({ data, date, shiftName }) {
    if (!data) return null;

    // Destructure Data
    const {
        incharge,
        sectionA_Coal, sectionA_Waste,
        sectionB_Loading,
        sectionC_Coal, sectionC_Waste,
        sectionD_Coal, sectionD_Waste,
        sectionE_Coal, sectionE_Waste,
        crushingDetails, dewateringDetails
    } = data;

    const fmt = (val) => val != null ? Number(val).toLocaleString('en-IN') : '0';

    return (
        <div>
            {/* HEADERS */}
            <div className={styles.header}>
                <h1 className="text-lg font-bold">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                <h2 className="text-md font-bold">PAKRI BARWADIH COAL MINING PROJECT</h2>
                <h3 className="text-md mt-2 text-red-600 font-extrabold underline">SHIFT REPORT</h3>

                <div className="w-full flex justify-between items-end mt-4 px-4">
                    <div className="text-left font-bold">
                        <div>SHIFT: {shiftName}</div>
                        {/* Incharge Details - Table Layout */}
                        <div className="mt-2 text-xs">
                            <div className="font-bold mb-1 w-fit">
                                Incharge : {data.inchargeDetails?.LargeScale || '-'}(Large Scale), {data.inchargeDetails?.SmallScale || '-'}(Mid Scale)
                            </div>
                        </div>
                    </div>
                    <div className="text-right font-bold text-red-600">Date: {date ? date.split('-').reverse().join('/') : '-'}</div>
                </div>
            </div>

            {/* SECTION A: TRIP-QUANTITY */}
            <h3 className={styles.sectionHeader}>A. TRIP-QUANTITY DETAILS</h3>
            <div className="flex flex-col mb-6">
                {/* Coal */}
                <div className="flex-1">
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="bg-green-200">Coal</th>
                                <th colSpan="2" className="text-red-700">SHIFT Production</th>
                                <th colSpan="2" className="text-red-700">FTD Production</th>
                            </tr>
                            <tr className={styles.blueHeader}>
                                <th>Segment</th>
                                <th>Trip</th><th>MT</th>
                                <th>Trip</th><th>MT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectionA_Coal.map((r, i) => (
                                <tr key={i}>
                                    <td className="font-bold text-left pl-2">{r.Scale}</td>
                                    <td>{fmt(r.Shift_Trips)}</td><td>{fmt(r.Shift_Qty)}</td>
                                    <td>{fmt(r.FTD_Trips)}</td><td>{fmt(r.FTD_Qty)}</td>
                                </tr>
                            ))}
                            {/* Total */}
                            <tr className="font-bold bg-white text-md border-b">
                                <td className="text-center font-bold font-sans">Total</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionA_Coal.reduce((s, r) => s + r.Shift_Trips, 0))}</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionA_Coal.reduce((s, r) => s + r.Shift_Qty, 0))}</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionA_Coal.reduce((s, r) => s + r.FTD_Trips, 0))}</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionA_Coal.reduce((s, r) => s + r.FTD_Qty, 0))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* Waste */}
                <div className="flex-1 mt-0">
                    <table className={styles.table}>
                        <thead className="border-t-2 border-slate-400">
                            <tr className={styles.blueHeader}>
                                <th className="bg-green-200">OB</th>
                                <th colSpan="2" className="text-red-700">SHIFT Production</th>
                                <th colSpan="2" className="text-red-700">FTD Production</th>
                            </tr>
                            <tr className={styles.blueHeader}>
                                <th>Segment</th>
                                <th>Trip</th><th>BCM</th>
                                <th>Trip</th><th>BCM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectionA_Waste.map((r, i) => (
                                <tr key={i}>
                                    <td className="font-bold text-left pl-2">{r.Scale}</td>
                                    <td>{fmt(r.Shift_Trips)}</td><td>{fmt(r.Shift_Qty)}</td>
                                    <td>{fmt(r.FTD_Trips)}</td><td>{fmt(r.FTD_Qty)}</td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-white text-md border-b">
                                <td className="text-center font-bold font-sans">Total</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionA_Waste.reduce((s, r) => s + r.Shift_Trips, 0))}</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionA_Waste.reduce((s, r) => s + r.Shift_Qty, 0))}</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionA_Waste.reduce((s, r) => s + r.FTD_Trips, 0))}</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionA_Waste.reduce((s, r) => s + r.FTD_Qty, 0))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION B: LOADING EQUIPMENTS */}
            <h3 className={styles.sectionHeader}>B. LOADING EQUIPMENT'S TRIP DETAILS</h3>
            <table className={`${styles.table} mb-6`}>
                <thead>
                    <tr className={styles.blueHeader}>
                        <th>LOADING EQP.</th>
                        <th>OB/IB</th>
                        <th>FREE DIG</th>
                        <th>COAL</th>
                        <th>Total Trip</th>
                        <th>BCM</th>
                        <th>MT</th>
                        <th>W. Hr</th>
                        <th>Target Trip/Hr</th>
                        <th>Trip/Hr</th>
                        <th>Target BCM/Hr</th>
                        <th>BCM/Hr</th>
                        <th>LOCATION</th>
                    </tr>
                </thead>
                <tbody>
                    {sectionB_Loading.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                            <td className="font-bold text-left pl-2">{r.LoadingEquipment}</td>
                            <td>{r.OBIB_Trip || '-'}</td>
                            <td>{r.TopSoil_Trip || '-'}</td>
                            <td>{r.Coal_Trip || '-'}</td>
                            <td className="font-bold">{r.Total_Trip}</td>
                            <td>{fmt(r.BCM)}</td>
                            <td>{fmt(r.MT)}</td>
                            <td>{r.WHr}</td>
                            <td>-</td>
                            <td>{r.WHr > 0 ? Math.round(r.Total_Trip / r.WHr) : '-'}</td>
                            <td>-</td>
                            <td>{r.WHr > 0 ? Math.round(r.BCM / r.WHr) : '-'}</td>
                            <td className="text-xs">{r.Location}</td>
                        </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-yellow-200 font-bold border-t-2 border-slate-900 text-md">
                        <td className="font-bold" style={{ fontWeight: 600 }}>TOTAL</td>
                        <td className="font-bold" style={{ fontWeight: 600 }}>{sectionB_Loading.reduce((s, r) => s + (r.OBIB_Trip || 0), 0)}</td>
                        <td className="font-bold" style={{ fontWeight: 600 }}>{sectionB_Loading.reduce((s, r) => s + (r.TopSoil_Trip || 0), 0)}</td>
                        <td className="font-bold" style={{ fontWeight: 600 }}>{sectionB_Loading.reduce((s, r) => s + (r.Coal_Trip || 0), 0)}</td>
                        <td className="font-bold" style={{ fontWeight: 600 }}>{sectionB_Loading.reduce((s, r) => s + (r.Total_Trip || 0), 0)}</td>
                        <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionB_Loading.reduce((s, r) => s + (r.BCM || 0), 0))}</td>
                        <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionB_Loading.reduce((s, r) => s + (r.MT || 0), 0))}</td>
                        <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                    </tr>
                </tbody>
            </table>

            {/* SECTION C: LOADING EQUIPMENT SUMMARY */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* C.1 Coal */}
                <div>
                    <h3 className={styles.sectionHeader}>C.1. Loading Equipment (in Coal)</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th>Equip. Model</th>
                                <th>No's</th>
                                <th>MT/Hr</th>
                                <th>Hr/Eq.</th>
                                <th>MT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectionC_Coal.map((r, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2">{r.EquipmentModel}</td>
                                    <td>{r.EqCount}</td>
                                    <td>{(r.TotalHrs > 0 ? r.MT / r.TotalHrs : 0).toFixed(0)}</td>
                                    <td>{(r.EqCount > 0 ? r.TotalHrs / r.EqCount : 0).toFixed(1)}</td>
                                    <td>{fmt(r.MT)}</td>
                                </tr>
                            ))}
                            {/* C.1 Total Row */}
                            <tr className="bg-yellow-200 font-bold border-t-2 border-slate-900 text-md">
                                <td className="font-bold text-center" style={{ fontWeight: 600 }}>Total</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{sectionC_Coal.reduce((s, r) => s + (r.EqCount || 0), 0)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionC_Coal.reduce((s, r) => s + (r.MT || 0), 0))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* C.2 Waste */}
                <div>
                    <h3 className={styles.sectionHeader}>C.2. Loading Equipment (in OB)</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th>Equip. Model</th>
                                <th>No's</th>
                                <th>BCM/Hr</th>
                                <th>Hr/Eq.</th>
                                <th>BCM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectionC_Waste.map((r, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2">{r.EquipmentModel}</td>
                                    <td>{r.EqCount}</td>
                                    <td>{(r.TotalHrs > 0 ? r.BCM / r.TotalHrs : 0).toFixed(0)}</td>
                                    <td>{(r.EqCount > 0 ? r.TotalHrs / r.EqCount : 0).toFixed(1)}</td>
                                    <td>{fmt(r.BCM)}</td>
                                </tr>
                            ))}
                            {/* C.2 Total Row */}
                            <tr className="bg-yellow-200 font-bold border-t-2 border-slate-900 text-md">
                                <td className="font-bold text-center" style={{ fontWeight: 600 }}>Total</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{sectionC_Waste.reduce((s, r) => s + (r.EqCount || 0), 0)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td className="font-bold" style={{ fontWeight: 600 }}>{fmt(sectionC_Waste.reduce((s, r) => s + (r.BCM || 0), 0))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION D: HAULING SUMMARY */}
            <h3 className={styles.sectionHeader}>D. Hauling Equipment</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}><th colSpan="3">COAL</th><th colSpan="2">OB</th></tr>
                        <tr className={styles.blueHeader}>
                            <th>Equip. Model</th>
                            <th>Trip</th><th>MT</th>
                            <th>Trip</th><th>BCM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const models = new Set([...sectionD_Coal.map(r => r.Equip), ...sectionD_Waste.map(r => r.Equip)]);
                            const rows = Array.from(models).map((m, i) => {
                                const c = sectionD_Coal.find(x => x.Equip === m) || {};
                                const w = sectionD_Waste.find(x => x.Equip === m) || {};
                                return (
                                    <tr key={i}>
                                        <td className="text-left pl-2">{m}</td>
                                        <td>{c.Trip || '-'}</td><td>{fmt(c.MT)}</td>
                                        <td>{w.Trip || '-'}</td><td>{fmt(w.BCM)}</td>
                                    </tr>
                                )
                            });

                            const totalCoalTrips = sectionD_Coal.reduce((s, r) => s + (r.Trip || 0), 0);
                            const totalCoalMT = sectionD_Coal.reduce((s, r) => s + (r.MT || 0), 0);
                            const totalWasteTrips = sectionD_Waste.reduce((s, r) => s + (r.Trip || 0), 0);
                            const totalWasteBCM = sectionD_Waste.reduce((s, r) => s + (r.BCM || 0), 0);

                            rows.push(
                                <tr key="total" className="font-bold bg-yellow-200">
                                    <td className="text-right pr-2">Total</td>
                                    <td>{fmt(totalCoalTrips)}</td><td>{fmt(totalCoalMT)}</td>
                                    <td>{fmt(totalWasteTrips)}</td><td>{fmt(totalWasteBCM)}</td>
                                </tr>
                            );

                            return rows;
                        })()}
                    </tbody>
                </table>
            </div>

            {/* SECTION E: DUMP WISE */}
            <h3 className={styles.sectionHeader}>E. Dump Wise Quantity</h3>
            <div className="mb-6">
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th>Dump</th>
                            <th>Coal Trips</th>
                            <th>Coal Qty(MT)</th>
                            <th>OB Trips</th>
                            <th>OB BCM</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const dumps = new Set([...sectionE_Coal.map(r => r.DumpWise), ...sectionE_Waste.map(r => r.DumpWise)]);
                            const rows = Array.from(dumps).map((d, i) => {
                                const c = sectionE_Coal.find(x => x.DumpWise === d) || {};
                                const w = sectionE_Waste.find(x => x.DumpWise === d) || {};
                                return (
                                    <tr key={i}>
                                        <td className="text-left pl-2">{d}</td>
                                        <td>{c.Trips || ''}</td>
                                        <td>{c.MT ? fmt(c.MT) : ''}</td>
                                        <td>{w.Trips || ''}</td>
                                        <td>{w.BCM ? fmt(w.BCM) : ''}</td>
                                    </tr>
                                );
                            });

                            const totalCoalTrips = sectionE_Coal.reduce((s, r) => s + (r.Trips || 0), 0);
                            const totalCoalMT = sectionE_Coal.reduce((s, r) => s + (r.MT || 0), 0);
                            const totalOBTrips = sectionE_Waste.reduce((s, r) => s + (r.Trips || 0), 0);
                            const totalOBBCM = sectionE_Waste.reduce((s, r) => s + (r.BCM || 0), 0);

                            rows.push(
                                <tr key="total" className="bg-white font-bold border-t-2 border-b-2 border-slate-900 text-md">
                                    <td className="font-bold text-left pl-2" style={{ fontWeight: 600 }}>Total</td>
                                    <td className="font-bold" style={{ fontWeight: 600 }}>{totalCoalTrips || ''}</td>
                                    <td className="font-bold" style={{ fontWeight: 600 }}>{totalCoalMT ? fmt(totalCoalMT) : ''}</td>
                                    <td className="font-bold" style={{ fontWeight: 600 }}>{totalOBTrips || ''}</td>
                                    <td className="font-bold" style={{ fontWeight: 600 }}>{totalOBBCM ? fmt(totalOBBCM) : ''}</td>
                                </tr>
                            );

                            return rows;
                        })()}
                    </tbody>
                </table>
            </div>

            {/* SECTION F: CRUSHING DETAILS */}
            <h3 className={styles.sectionHeader}>F. Crushing Details (1150 TPH)</h3>
            <div className="mb-6">
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th>Sl No</th>
                            <th>EQUIPMENT .</th>
                            <th>Hrs</th>
                            <th>Qty</th>
                            <th>Budget</th>
                            <th>Actual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {crushingDetails && crushingDetails.length > 0 ? (
                            crushingDetails.map((r, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{r.EquipmentName || '-'}</td>
                                    <td>{r.RunningHr}</td>
                                    <td>{fmt(r.TotalQty)}</td>
                                    <td>{fmt(r.Budget)}</td>
                                    <td>{fmt(r.Actual)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="text-center">No Data</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* SECTION G: DEWATERING PUMP DETAILS */}
            <h3 className={styles.sectionHeader}>G. Dewatering Pump Details :</h3>
            <div className="mb-6 w-1/2">
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th>Sl No</th>
                            <th>Pump</th>
                            <th>Rn Hr</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dewateringDetails && dewateringDetails.length > 0 ? (
                            dewateringDetails.map((r, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{r.Pump || '-'}</td>
                                    <td>{r.RunHr}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="3" className="text-center">No Data</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
