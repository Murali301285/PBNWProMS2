'use client';
import styles from './ProductionNtpc.module.css';

export default function ProductionNtpcTable({ data, loading, date }) {

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading Report Data...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-slate-400">No Data Generated</div>;
    }

    const { summary, crusher, headerInfo } = data;

    // Helper for Total calculation
    const totalCrusherHrs = crusher.reduce((sum, row) => sum + (row.RunningHr || 0), 0);
    const totalCrusherQty = crusher.reduce((sum, row) => sum + (row.TotalQty || 0), 0);

    return (
        <div className="w-full">
            {/* Header */}
            <div className={styles.header}>
                <h1 className="text-lg font-bold">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                <h2 className="text-md font-bold">PAKRI BARWADIH COAL MINING PROJECT</h2>
                <h3 className="text-md mt-2 underline font-bold">PRODUCTION NTPC REPORT</h3>
                <div className="text-sm font-bold text-red-600 mt-2">
                    Date: {date?.split('-').reverse().join('/')}
                    <span className="mx-2 text-slate-800">|</span>
                    Shift: {headerInfo?.ShiftName?.replace('SHIFT', 'Shift')}
                </div>
            </div>

            <div className="space-y-12 max-w-4xl mx-auto">

                {/* 1. Production Quantity */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Production Quantity</div>
                    <table className={styles.table}>
                        <tbody>
                            <tr className={styles.totalRow}>
                                <th className="w-1/2 text-left pl-8 text-black">COAL</th>
                                <td className="font-bold text-right pr-8 text-black">{summary.ProdCoal?.toLocaleString('en-IN')} MT</td>
                            </tr>
                            <tr className={styles.totalRow}>
                                <th className="text-left pl-8 text-black">OB</th>
                                <td className="font-bold text-right pr-8 text-black">{summary.ProdOB?.toLocaleString('en-IN')} BCM</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 2. WP-3 Quantity */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>WP-3 Quantity</div>
                    <table className={styles.table}>
                        <tbody>
                            <tr className={styles.totalRow}>
                                <th className="w-1/2 text-left pl-8 text-black">COAL</th>
                                <td className="font-bold text-right pr-8 text-black">{summary.WPCoalQty?.toLocaleString('en-IN')} MT</td>
                            </tr>
                            <tr className={styles.totalRow}>
                                <th className="text-left pl-8 text-black">OB</th>
                                <td className="font-bold text-right pr-8 text-black">{summary.WPObQty?.toLocaleString('en-IN')} BCM</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 3. Crusher Details */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Crusher Details</div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.totalRow}>
                                <th className="text-left pl-4 text-black">PLANT</th>
                                <th className="text-right pr-8 text-black">HRS</th>
                                <th className="text-right pr-8 text-black">QTY (MT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {crusher.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-4 font-semibold">{row.Plant}</td>
                                    <td className="text-right pr-8 font-bold">{row.RunningHr?.toFixed(2)}</td>
                                    <td className="text-right pr-8 font-bold">{row.TotalQty?.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            <tr className={styles.totalRow}>
                                <td className="text-left pl-4 text-black">Total</td>
                                <td className="text-right pr-8 text-black">{totalCrusherHrs.toFixed(2)}</td>
                                <td className="text-right pr-8 text-black">{totalCrusherQty?.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
