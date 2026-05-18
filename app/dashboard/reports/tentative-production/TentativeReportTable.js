
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
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        
        // If already in DD-MMM-YYYY format (e.g. "01-May-2026"), return it directly
        if (typeof dateStr === 'string' && /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateStr)) {
            return dateStr;
        }

        let year, month, day;
        
        if (dateStr instanceof Date) {
            year = dateStr.getFullYear();
            month = dateStr.getMonth() + 1;
            day = dateStr.getDate();
        } else {
            const cleanStr = String(dateStr).trim().split('T')[0]; // Remove time portion if ISO
            const parts = cleanStr.split(/[-/]/); // Split by - or /
            
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    // YYYY-MM-DD
                    [year, month, day] = parts;
                } else if (parts[2].length === 4) {
                    // DD-MM-YYYY
                    [day, month, year] = parts;
                } else {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return dateStr;
                    year = d.getFullYear();
                    month = d.getMonth() + 1;
                    day = d.getDate();
                }
            } else {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                year = d.getFullYear();
                month = d.getMonth() + 1;
                day = d.getDate();
            }
        }

        const dayStr = String(day).padStart(2, '0');
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthStr = monthNames[parseInt(month, 10) - 1] || 'Jan';
        const yearStr = String(year);

        return `${dayStr}-${monthStr}-${yearStr}`;
    };

    const fmt = (val) => (val !== undefined && val !== null) ? Number(val).toLocaleString('en-IN') : '0';

    return (
        <div className="p-4 bg-white min-h-screen">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', position: 'relative', minHeight: '110px' }}>
                {/* Logo - Positioned left */}
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                    <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '96px', objectFit: 'contain' }} />
                </div>

                {/* Text Block - Centered */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"}</h1>
                    <h2 style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"}</h2>
                    <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem' }}>TENTATIVE PRODUCTION QTY</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: '#334155', fontWeight: '500' }}>
                        <div>SHIFT: {headerInfo?.ShiftName}</div>
                        <div>Incharge : {headerInfo?.ShiftIncharge || '-'}</div>
                        <div>Date: {formatDate(headerInfo?.Date)}</div>
                    </div>
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
                            <th rowSpan="2">Model</th>
                            <th rowSpan="2">OB/IB</th>
                            <th rowSpan="2">Factor</th>
                            <th rowSpan="2">Free Dig</th>
                            <th rowSpan="2">Factor</th>
                            <th rowSpan="2">Total Trip</th>
                            <th rowSpan="2">Qty (BCM)</th>
                            <th colSpan="3" className="bg-slate-200 border-l-2 border-slate-800 text-center">Mapio</th>
                        </tr>
                        <tr className={styles.blueHeader}>
                            <th className="bg-slate-100 border-l-2 border-slate-800">Trip</th>
                            <th className="bg-slate-100">Qty (BCM)</th>
                            <th className="bg-slate-100">Diff.</th>
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
                                <td className="border-l-2 border-slate-800">{fmt(row.MapioTrip)}</td>
                                <td>{fmt(row.MapioQty)}</td>
                                <td className={row.Diff < 0 ? 'text-red-500 font-bold' : ''}>{fmt(row.Diff)}</td>
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
                            <td className="border-l-2 border-slate-800">0</td>
                            <td>0</td>
                            <td className={wasteTotal.Diff < 0 ? 'text-red-500 font-bold' : ''}>{fmt(wasteTotal.Diff)}</td>
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
                            <th rowSpan="2">Model</th>
                            <th rowSpan="2">ROM COAL</th>
                            <th rowSpan="2">Factor</th>
                            <th rowSpan="2">Qty (MT)</th>
                            <th colSpan="3" className="bg-slate-200 border-l-2 border-slate-800 text-center">Mapio</th>
                        </tr>
                        <tr className={styles.blueHeader}>
                            <th className="bg-slate-100 border-l-2 border-slate-800">Trip</th>
                            <th className="bg-slate-100">Qty (MT)</th>
                            <th className="bg-slate-100">Diff.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coalProduction.map((row, i) => (
                            <tr key={i}>
                                <td className="text-left pl-2 font-semibold">{row.EquipmentGroup}</td>
                                <td>{fmt(row.RomCoal)}</td>
                                <td>{row.Factor}</td>
                                <td>{fmt(row.Qty)}</td>
                                <td className="border-l-2 border-slate-800">{fmt(row.MapioTrip)}</td>
                                <td>{fmt(row.MapioQty)}</td>
                                <td className={row.Diff < 0 ? 'text-red-500 font-bold' : ''}>{fmt(row.Diff)}</td>
                            </tr>
                        ))}
                        <tr className="bg-blue-100 font-bold border-t-2 border-slate-800">
                            <td className="text-left pl-2">Total</td>
                            <td>{fmt(coalTotal.RomCoal)}</td>
                            <td></td>
                            <td>{fmt(coalTotal.Qty)}</td>
                            <td className="border-l-2 border-slate-800">0</td>
                            <td>0</td>
                            <td className={coalTotal.Diff < 0 ? 'text-red-500 font-bold' : ''}>{fmt(coalTotal.Diff)}</td>
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
