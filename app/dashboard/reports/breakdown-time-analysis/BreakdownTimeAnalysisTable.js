import styles from './BreakdownTime.module.css';

export default function BreakdownTimeAnalysisTable({ data, loading, filter }) {
    if (loading) return <div className="p-8 text-center text-slate-500">Loading Report Data...</div>;
    if (!data || data.length === 0) return <div className="p-8 text-center text-slate-400">No Data Found</div>;

    // Calculate Averages for Summary Row
    const totalCount = data.length;
    const totals = data.reduce((acc, row) => ({
        shiftChange: acc.shiftChange + (row.ShiftChange || 0),
        breakTea: acc.breakTea + (row.BreakTeaTime || 0),
        blasting: acc.blasting + (row.Blasting || 0),
        others: acc.others + (row.Others || 0),
        totalBreakMin: acc.totalBreakMin + (row.TotalBreakMinutes || 0),
        totalBreakHrs: acc.totalBreakHrs + ((row.TotalBreakMinutes || 0) / 60),
        totalWorkingHrs: acc.totalWorkingHrs + (parseFloat(row.TotalWorkingHours) || 0)
    }), { shiftChange: 0, breakTea: 0, blasting: 0, others: 0, totalBreakMin: 0, totalBreakHrs: 0, totalWorkingHrs: 0 });

    const averages = {
        shiftChange: (totals.shiftChange / totalCount).toFixed(2),
        breakTea: (totals.breakTea / totalCount).toFixed(2),
        blasting: (totals.blasting / totalCount).toFixed(2),
        others: (totals.others / totalCount).toFixed(2),
        totalBreakMin: (totals.totalBreakMin / totalCount).toFixed(2),
        totalBreakHrs: (totals.totalBreakHrs / totalCount).toFixed(2),
        totalWorkingHrs: (totals.totalWorkingHrs / totalCount).toFixed(2)
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // Helper to calculate Working Hours in H.MM format
    const calculateWorkingHours = (breakMinutes) => {
        const totalShiftMinutes = 8 * 60; // 480 minutes
        const netWorkingMinutes = totalShiftMinutes - (breakMinutes || 0);

        const hrs = Math.floor(netWorkingMinutes / 60);
        const mins = Math.round(netWorkingMinutes % 60); // Round to nearest minute

        return `${hrs}.${mins.toString().padStart(2, '0')}`;
    };

    const avgWorkingHours = calculateWorkingHours(totals.totalBreakMin / totalCount);

    return (
        <div className={styles.tableContainer}>
            {/* Report Header */}
            <div className={styles.reportHeader}>
                <h1>THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                <h2>PAKRI BARWADIH COAL MINING PROJECT</h2>
                <h3>BREAK TIME ANALYSIS REPORT</h3>
                <p>FROM : {formatDate(filter?.fromDate)} TO: {formatDate(filter?.toDate)}</p>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Sl No.</th>
                        <th>Date</th>
                        <th>Shift</th>
                        <th>Shift Change (Min)</th>
                        <th>Break / Tea Time (Min)</th>
                        <th>Blasting (Min)</th>
                        <th>Others (Min)</th>
                        <th>Total Break (Min)</th>
                        <th>Total Working Hours (Hrs)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{row.Date}</td>
                            <td>{row.ShiftName}</td>
                            <td>{row.ShiftChange}</td>
                            <td>{row.BreakTeaTime}</td>
                            <td>{row.Blasting}</td>
                            <td>{row.Others}</td>
                            <td className="font-bold">{row.TotalBreakMinutes}</td>
                            <td className="font-bold text-green-700">{calculateWorkingHours(row.TotalBreakMinutes)}</td>
                        </tr>
                    ))}
                    {/* Summary Row */}
                    <tr className="bg-yellow-100 font-extrabold border-t-2 border-black">
                        <td colSpan={3} className="text-right">Average</td>
                        <td>{averages.shiftChange}</td>
                        <td>{averages.breakTea}</td>
                        <td>{averages.blasting}</td>
                        <td>{averages.others}</td>
                        <td>{averages.totalBreakMin}</td>
                        <td className="text-green-800">{avgWorkingHours}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
