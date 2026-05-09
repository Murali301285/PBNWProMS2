'use client';
import styles from './ProductionTsmpl.module.css';

export default function ProductionTsmplTable({ data, loading, date }) {

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading Report Data...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-slate-400">No Data Generated</div>;
    }

    const { summary, crusher, headerInfo } = data;

    // Helper for Indian Number Format
    // Helper for Indian Number Format
    const formatNumber = (num, digits = 2) => {
        if (num === null || num === undefined) return '';
        // If it's a string, try parsing it, otherwise return as is
        const val = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(val)) return num;

        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: digits,
            minimumFractionDigits: 0 // Ensure no trailing zeros if integer
        }).format(val);
    };

    // Total calculations
    const totalCrusherHrs = crusher.reduce((sum, row) => sum + (row.RunningHr || 0), 0);
    const totalCrusherQty = crusher.reduce((sum, row) => sum + (row.TotalQty || 0), 0);

    return (
        <div id="print-area-inner" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', backgroundColor: '#ffffff', padding: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', width: '100%' }}>
                {/* Logo - Left */}
                <div style={{ flex: '0 0 100px', display: 'flex', justifyContent: 'flex-start' }}>
                    <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '70px', objectFit: 'contain' }} />
                </div>

                {/* Text Block - Centered */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 0.5rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '4px' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_1 || "THRIVENI SAINIK MINING PRIVATE LIMITED"}</h1>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '6px' }}>{process.env.NEXT_PUBLIC_REPORT_HEADING_2 || "PAKRI BARWADIH COAL MINING PROJECT"}</h2>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', textTransform: 'uppercase', marginBottom: '8px', textDecoration: 'underline' }}>PRODUCTION TSMPL REPORT</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 'bold' }}>
                        <div>Date: {date?.split('-').reverse().join('-')}</div>
                        <span style={{ color: '#1e293b' }}>|</span>
                        <div>Shift: {headerInfo?.ShiftName?.replace('SHIFT', 'Shift')}</div>
                    </div>
                </div>

                {/* Empty Spacer - Right (for symmetry to center the text exactly) */}
                <div style={{ flex: '0 0 100px' }}></div>
            </div>

            <div className="space-y-4" style={{ width: '100%' }}>

                {/* 1. Time Breakdown Table Removed as per request */}

                {/* 2. Production Quantity */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Production Quantity</div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="text-center w-1/4">Material</th>
                                <th className="text-left pl-4">Shift Qty.</th>
                                <th className="text-left pl-4">Per Hour</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th className={styles.rowHeader}>COAL</th>
                                <td className="font-bold text-left pl-4 text-black">{formatNumber(summary.ProdCoal)} MT</td>
                                <td className="font-bold text-center text-black">{formatNumber(summary.ProdCoalPerHrs, 0)} MT</td>
                            </tr>
                            <tr>
                                <th className={styles.rowHeader}>OB</th>
                                <td className="font-bold text-left pl-4 text-black">{formatNumber(summary.ProdOB)} BCM</td>
                                <td className="font-bold text-center text-black">{formatNumber(summary.ProdOBPerHrs, 0)} BCM</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 3. WP-3 Quantity */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>WP-3 Quantity</div>
                    <table className={styles.table}>
                        <tbody>
                            <tr>
                                <th className={styles.rowHeader}>COAL</th>
                                <td className="font-bold text-left pl-4 text-black">{formatNumber(summary.WPCoalQty)} MT</td>
                            </tr>
                            <tr>
                                <th className={styles.rowHeader}>OB</th>
                                <td className="font-bold text-left pl-4 text-black">{formatNumber(summary.WPObQty)} BCM</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 4. Carpeting Quantity */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Carpeting Quantity</div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="text-center w-1/4">Material</th>
                                <th className="text-left pl-4">Shift Qty.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th className={styles.rowHeader}>OB</th>
                                <td className="font-bold text-left pl-4 text-black">{formatNumber(summary.CarpettingObQty)} BCM</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 5. Coal Rehandling */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Coal Rehandling</div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="text-center w-1/4">Material</th>
                                <th className="text-left pl-4">Shift Qty.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th className={styles.rowHeader}>COAL</th>
                                <td className="font-bold text-left pl-4 text-black">{formatNumber(summary.RehandlingCoalQty)} MT</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 6. Crusher Details */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Crusher Details</div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="text-left pl-2">Plant</th>
                                <th className="text-center">W. Hours</th>
                                <th className="text-center">Quantity (MT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {crusher.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2 font-semibold">{row.Plant}</td>
                                    <td className="text-center font-bold">{formatNumber(row.RunningHr)}</td>
                                    <td className="text-center font-bold">{formatNumber(row.TotalQty)}</td>
                                </tr>
                            ))}
                            <tr className={styles.totalRow}>
                                <td className="text-left pl-2 text-black">Total</td>
                                <td className="text-center text-black">{formatNumber(totalCrusherHrs)}</td>
                                <td className="text-center text-black">{formatNumber(totalCrusherQty)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>

        </div>
    );
}
