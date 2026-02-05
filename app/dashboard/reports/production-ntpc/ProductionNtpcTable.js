'use client';
import styles from './ProductionNtpc.module.css';

export default function ProductionNtpcTable({ data, loading }) {

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
                <div className="flex-1">
                    <h1 className="text-xl font-bold uppercase text-slate-900 mb-2">Production NTPC</h1>
                    <div className="grid grid-cols-1 gap-y-1 text-sm font-bold text-slate-900">
                        <p>Date : <span>{headerInfo?.Date}</span></p>
                        <p>Shift : <span>{headerInfo?.ShiftName}</span></p>
                    </div>
                </div>
                <div>
                    <div className="text-right">
                        <div className="text-sky-800 font-bold text-lg">THRIVENI SAINIK</div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">

                {/* 1. Production Quantity */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Production Quantity</div>
                    <table className={styles.table}>
                        <tbody>
                            <tr className={styles.totalRow}>
                                <th className="w-1/2 text-center text-black">COAL</th>
                                <td className="font-bold text-left pl-4 text-black">{summary.ProdCoal} MT</td>
                            </tr>
                            <tr className={styles.totalRow}>
                                <th className="text-center text-black">OB</th>
                                <td className="font-bold text-left pl-4 text-black">{summary.ProdOB} BCM</td>
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
                                <th className="w-1/2 text-center text-black">COAL</th>
                                <td className="font-bold text-left pl-4 text-black">{summary.WPCoalQty} MT</td>
                            </tr>
                            <tr className={styles.totalRow}>
                                <th className="text-center text-black">OB</th>
                                <td className="font-bold text-left pl-4 text-black">{summary.WPObQty} BCM</td>
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
                                <th className="text-left pl-2 text-black">PLANT</th>
                                <th className="text-black">HRS</th>
                                <th className="text-black">QTY (MT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {crusher.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2 font-semibold">{row.Plant}</td>
                                    <td className="text-left pl-10 font-bold">{row.RunningHr?.toFixed(2)}</td>
                                    <td className="text-left pl-10 font-bold">{row.TotalQty}</td>
                                </tr>
                            ))}
                            <tr className={styles.totalRow}>
                                <td className="text-left pl-2 text-black">Total</td>
                                <td className="text-left pl-10 text-black">{totalCrusherHrs.toFixed(2)}</td>
                                <td className="text-left pl-10 text-black">{totalCrusherQty}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
