
import styles from './TentativeProduction.module.css';

/**
 * Custom Layout for Tentative Production Qty Report
 * Mirrors the structure of the PDF design.
 */
export default function TentativeReportTable({ data, loading }) {

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading Report Data...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-slate-400">No Data Generated</div>;
    }

    const { wasteHandling, coalProduction, wp3, obRehandling, coalRehandling, headerInfo } = data;

    // --- Totals Calculation Helpers (Duplicated from Page but essential for rendering) ---
    const calculateWasteTotal = (arr) => arr.reduce((acc, row) => ({
        OverBurden: acc.OverBurden + (row.OverBurden || 0),
        TopSoil: acc.TopSoil + (row.TopSoil || 0),
        TotalTrip: acc.TotalTrip + (row.TotalTrip || 0),
        QtyBcm: acc.QtyBcm + (row.QtyBcm || 0),
        Diff: acc.Diff + (row.Diff || 0)
    }), { OverBurden: 0, TopSoil: 0, TotalTrip: 0, QtyBcm: 0, Diff: 0 });

    const calculateCoalTotal = (arr) => arr.reduce((acc, row) => ({
        RomCoal: acc.RomCoal + (row.RomCoal || 0),
        Qty: acc.Qty + (row.Qty || 0),
        Diff: acc.Diff + (row.Diff || 0)
    }), { RomCoal: 0, Qty: 0, Diff: 0 });

    const calculateRehandlingTotal = (arr) => arr.reduce((acc, row) => ({
        Trip: acc.Trip + (row.Trip || 0),
        Qty: acc.Qty + (row.Qty || 0)
    }), { Trip: 0, Qty: 0 });


    const wasteTotal = calculateWasteTotal(wasteHandling);
    const calculateWP3Total = (arr) => arr.reduce((acc, row) => ({
        OverBurden: acc.OverBurden + (row.OverBurden || 0),
        TopSoil: acc.TopSoil + (row.TopSoil || 0),
        Coal: acc.Coal + (row.Coal || 0),
        CoalQty: acc.CoalQty + (row.CoalQty || 0),
        TotalTrip: acc.TotalTrip + (row.TotalTrip || 0),
        QtyBcm: acc.QtyBcm + (row.QtyBcm || 0)
    }), { OverBurden: 0, TopSoil: 0, Coal: 0, CoalQty: 0, TotalTrip: 0, QtyBcm: 0 });

    const wp3Total = calculateWP3Total(wp3);
    const coalTotal = calculateCoalTotal(coalProduction);
    const obRehandlingTotal = calculateRehandlingTotal(obRehandling);
    const coalRehandlingTotal = calculateRehandlingTotal(coalRehandling);

    // Format Date Helpers (dd/mm/yyyy)
    const formatDate = (d) => {
        if (!d) return '';
        // Assuming d is YYYY-MM-DD or similar standard
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return d;
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const fmt = (val) => (val !== undefined && val !== null) ? Number(val).toLocaleString('en-IN') : '0';

    return (
        <div className="p-4 bg-white min-h-screen">
            {/* Header */}
            <div className="flex flex-col items-center mb-6 w-full" style={{ textAlign: 'center' }}>
                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide text-center w-full" style={{ textAlign: 'center' }}>THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                <h2 className="text-xl font-bold text-slate-900 uppercase mt-1 text-center w-full" style={{ textAlign: 'center' }}>PAKRI BARWADIH COAL MINING PROJECT</h2>
                <h3 className="text-xl font-bold text-blue-900 uppercase underline decoration-2 underline-offset-4 mt-2 mb-3 text-center w-full" style={{ textAlign: 'center' }}>TENTATIVE PRODUCTION QTY</h3>

                <div className="flex flex-col items-center gap-1 text-sm font-bold text-slate-800 uppercase w-full text-center" style={{ textAlign: 'center', alignItems: 'center' }}>
                    <div>SHIFT: {headerInfo?.ShiftName}</div>
                    <div>Incharge : {headerInfo?.ShiftIncharge || '-'}</div>
                    <div>Date: {formatDate(headerInfo?.Date)}</div>
                </div>
            </div>

            {/* 1. OB Handling (Moved to Top) */}
            <div className="mb-6">
                {/* Section Header */}
                <div className={styles.sectionTitle}>
                    OB Handling
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th>Model</th>
                            <th>OB/IB</th>
                            <th>Factor</th>
                            <th>Free Dig</th>
                            <th>Factor</th>
                            <th>Total Trip</th>
                            <th>Qty (BCM)</th>
                            {/* Mapio Columns */}
                            <th className="bg-slate-100 border-l-2 border-slate-800">Trip</th>
                            <th>Qty (BCM)</th>
                            <th>Diff.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wasteHandling.map((row, i) => (
                            <tr key={i}>
                                <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                <td>{fmt(row.OverBurden)}</td>
                                <td>{row.OverBurdenFactor}</td>
                                <td>{fmt(row.TopSoil)}</td>
                                <td>{row.TopSoilFactor}</td>
                                <td>{fmt(row.TotalTrip)}</td>
                                <td>{fmt(row.QtyBcm)}</td>
                                {/* Mapio Data */}
                                <td className="border-l-2 border-slate-800">{fmt(row.MapioTrip)}</td>
                                <td>{fmt(row.MapioQty)}</td>
                                <td>{fmt(row.Diff)}</td>
                            </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-blue-100 font-bold border-t-2 border-slate-800">
                            <td className="text-left pl-2">Total</td>
                            <td>{fmt(wasteTotal.OverBurden)}</td>
                            <td></td>
                            <td>{fmt(wasteTotal.TopSoil)}</td>
                            <td></td>
                            <td>{fmt(wasteTotal.TotalTrip)}</td>
                            <td>{fmt(wasteTotal.QtyBcm)}</td>
                            {/* Mapio Total */}
                            <td className="border-l-2 border-slate-800">0</td>
                            <td>0</td>
                            <td>{fmt(wasteTotal.Diff)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 2. Coal Production */}
            <div className="mb-6">
                <div className={styles.sectionTitle}>
                    Coal Production
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th>Model</th>
                            <th>ROM COAL</th>
                            <th>Factor</th>
                            <th>Qty (MT)</th>
                            {/* Mapio Columns */}
                            <th className="bg-slate-100 border-l-2 border-slate-800">Trip</th>
                            <th>Qty (MT)</th>
                            <th>Diff.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coalProduction.map((row, i) => (
                            <tr key={i}>
                                <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                <td>{fmt(row.RomCoal)}</td>
                                <td>{row.Factor}</td>
                                <td>{fmt(row.Qty)}</td>
                                {/* Mapio Data */}
                                <td className="border-l-2 border-slate-800">{fmt(row.MapioTrip)}</td>
                                <td>{fmt(row.MapioQty)}</td>
                                <td>{fmt(row.Diff)}</td>
                            </tr>
                        ))}
                        <tr className="bg-blue-100 font-bold border-t-2 border-slate-800">
                            <td className="text-left pl-2">Total</td>
                            <td>{fmt(coalTotal.RomCoal)}</td>
                            <td></td>
                            <td>{fmt(coalTotal.Qty)}</td>
                            {/* Mapio Total */}
                            <td className="border-l-2 border-slate-800">0</td>
                            <td>0</td>
                            <td>{fmt(coalTotal.Diff)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 3. WP-3 Quantity */}
            <div className="mb-6">
                <div className={styles.sectionTitle}>
                    WP-3 Quantity
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.blueHeader}>
                            <th>Model</th>
                            <th>OB/IB</th>
                            <th>Factor</th>
                            <th>Free Dig</th>
                            <th>Factor</th>
                            <th>Coal</th>
                            <th>Factor</th>
                            <th>Total Trip</th>
                            <th>Coal Qty</th>
                            <th>Qty (BCM)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wp3.map((row, i) => (
                            <tr key={i}>
                                <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                <td>{fmt(row.OverBurden)}</td>
                                <td>{row.OverBurdenFactor}</td>
                                <td>{fmt(row.TopSoil)}</td>
                                <td>{row.TopSoilFactor}</td>
                                <td className="bg-yellow-50">{fmt(row.Coal)}</td>
                                <td className="bg-yellow-50">{row.CoalFactor}</td>
                                <td>{fmt(row.TotalTrip)}</td>
                                <td className="bg-yellow-50">{fmt(row.CoalQty)}</td>
                                <td>{fmt(row.QtyBcm)}</td>
                            </tr>
                        ))}
                        <tr className="bg-blue-100 font-bold border-t-2 border-slate-800">
                            <td className="text-left pl-2">Total</td>
                            <td>{fmt(wp3Total.OverBurden)}</td>
                            <td></td>
                            <td>{fmt(wp3Total.TopSoil)}</td>
                            <td></td>
                            <td>{fmt(wp3Total.Coal)}</td>
                            <td></td>
                            <td>{fmt(wp3Total.TotalTrip)}</td>
                            <td>{fmt(wp3Total.CoalQty)}</td>
                            <td>{fmt(wp3Total.QtyBcm)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 4 & 5. Rehandling Tables (OB Rehandling then Coal Rehandling) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">

                {/* OB Rehandling */}
                <div>
                    <div className={styles.sectionTitle}>
                        OB Rehandling/Carpeting Quantity
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th>Model</th>
                                <th>Trip</th>
                                <th>Factor</th>
                                <th>Qty (BCM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {obRehandling.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                    <td>{fmt(row.Trip)}</td>
                                    <td>{row.Factor}</td>
                                    <td>{fmt(row.Qty)}</td>
                                </tr>
                            ))}
                            <tr className="bg-blue-100 font-bold border-t-2 border-slate-800">
                                <td className="text-left pl-2">Total</td>
                                <td>{fmt(obRehandlingTotal.Trip)}</td>
                                <td></td>
                                <td>{fmt(obRehandlingTotal.Qty)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Coal Rehandling */}
                <div>
                    <div className={styles.sectionTitle}>
                        Coal Rehandling Quantity
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th>Model</th>
                                <th>Trip</th>
                                <th>Factor</th>
                                <th>Qty (MT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coalRehandling.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                    <td>{fmt(row.Trip)}</td>
                                    <td>{row.Factor}</td>
                                    <td>{fmt(row.Qty)}</td>
                                </tr>
                            ))}
                            <tr className="bg-blue-100 font-bold border-t-2 border-slate-800">
                                <td className="text-left pl-2">Total</td>
                                <td>{fmt(coalRehandlingTotal.Trip)}</td>
                                <td></td>
                                <td>{fmt(coalRehandlingTotal.Qty)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>


        </div>
    );
}
