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

    // Total calculations
    const totalCrusherHrs = crusher.reduce((sum, row) => sum + (row.RunningHr || 0), 0);
    const totalCrusherQty = crusher.reduce((sum, row) => sum + (row.TotalQty || 0), 0);

    return (
        <div className="w-full">
            {/* Header */}
            <div className={styles.header}>
                <h1 className="text-lg font-bold">THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                <h2 className="text-md font-bold">PAKRI BARWADIH COAL MINING PROJECT</h2>
                <h3 className="text-md mt-2 underline font-bold">PRODUCTION TSMPL REPORT</h3>
                <div className="text-sm font-bold text-red-600 mt-2">
                    Date: {date?.split('-').reverse().join('/')}
                    <span className="mx-2 text-slate-800">|</span>
                    Shift: {headerInfo?.ShiftName?.replace('SHIFT', 'Shift')}
                </div>
            </div>

            <div className="space-y-4">

                {/* 1. Time Breakdown Table */}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th className="text-left pl-2">Participle</th>
                                <th className="text-center">Shift Change</th>
                                <th className="text-center">Break fast/Tea Time</th>
                                <th className="text-center">Blasting</th>
                                <th className="text-center">Others</th>
                                <th className="text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th className="text-left pl-2">Mins</th>
                                <td className="text-center">{summary.ShiftChange}</td>
                                <td className="text-center">{summary.BreakTime}</td>
                                <td className="text-center">{summary.Blasting}</td>
                                <td className="text-center">{summary.Others}</td>
                                <td className="text-center font-bold">{summary.Totalmin}</td>
                            </tr>
                            <tr className="bg-slate-200 font-bold">
                                <th className="text-left pl-2">Hrs</th>
                                <td className="text-center">{summary.TotalShiftChangeHrs}</td>
                                <td className="text-center">{summary.TotalBreakTimeHrs}</td>
                                <td className="text-center">{summary.TotalBlastingHrs}</td>
                                <td className="text-center">{summary.TotalOthersHrs}</td>
                                <td className="text-center">{summary.TotalHrs}</td>
                            </tr>
                            <tr className={styles.totalRow}>
                                <td colSpan={5} className="text-left pl-2 text-black">Total working hrs</td>
                                <td className="text-center text-lg text-black">{summary.TotalWorkingHrs}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

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
                                <td className="font-bold text-left pl-4 text-black">{summary.ProdCoal} MT</td>
                                <td className="font-bold text-left pl-4 text-black">{summary.ProdCoalPerHrs} MT</td>
                            </tr>
                            <tr>
                                <th className={styles.rowHeader}>OB</th>
                                <td className="font-bold text-left pl-4 text-black">{summary.ProdOB} BCM</td>
                                <td className="font-bold text-left pl-4 text-black">{summary.ProdOBPerHrs} BCM</td>
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
                                <td className="font-bold text-left pl-4 text-black">{summary.WPCoalQty} MT</td>
                            </tr>
                            <tr>
                                <th className={styles.rowHeader}>OB</th>
                                <td className="font-bold text-left pl-4 text-black">{summary.WPObQty} BCM</td>
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
                                <td className="font-bold text-left pl-4 text-black">{summary.CarpettingObQty} BCM</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 5. Crusher Details */}
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
                                    <td className="text-center font-bold">{row.RunningHr?.toFixed(2)}</td>
                                    <td className="text-center font-bold">{row.TotalQty}</td>
                                </tr>
                            ))}
                            <tr className={styles.totalRow}>
                                <td className="text-left pl-2 text-black">Total</td>
                                <td className="text-center text-black">{totalCrusherHrs.toFixed(2)}</td>
                                <td className="text-center text-black">{totalCrusherQty}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>

        </div>
    );
}
