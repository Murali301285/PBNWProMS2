import styles from './DailyProgressPage.module.css';

const DailyProgressTable = ({ data, date }) => {
    // Parse date if it's in ISO format to be more readable
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    const displayDate = data?.headerInfo?.Date ? formatDate(data.headerInfo.Date) : formatDate(date);

    if (!data) return null;

    const { production, drilling, blasting, crusher } = data;

    const calculateTotal = (dataArr, fields) => {
        return dataArr.reduce((acc, row) => {
            fields.forEach(f => {
                // Remove commas and handle NaN cases properly
                const valStr = String(row[f] || '').replace(/,/g, '');
                const num = Number(valStr);
                acc[f] = (acc[f] || 0) + (isNaN(num) ? 0 : num);
            });
            return acc;
        }, {});
    };

    const formatNum = (num) => {
        if (!num || isNaN(num)) return 0;

        // Format using Indian Number System 
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const drillTotals = calculateTotal(drilling, ['Holes_FTD', 'Holes_MTD', 'Holes_YTD', 'Drilling_FTD', 'Drilling_MTD', 'Drilling_YTD', 'Hrs_FTD', 'Hrs_MTD', 'Hrs_YTD']);
    const blastTotals = calculateTotal(blasting, ['Holes_FTD', 'Holes_MTD', 'Holes_YTD', 'Exp_FTD', 'Exp_MTD', 'Exp_YTD', 'TotalVolume_FTD', 'TotalVolume_MTD', 'TotalVolume_YTD']);
    const crusherTotals = calculateTotal(crusher, ['Hrs_FTD', 'Hrs_MTD', 'Hrs_YTD', 'Qty_FTD', 'Qty_MTD', 'Qty_YTD', 'KWH_FTD', 'KWH_MTD', 'KWH_YTD']);

    return (
        <div className="w-full">
            {/* Header */}
            <div className={styles.reportHeader}>
                <h1>THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                <h2>PAKRI BARWADIH COAL MINING PROJECT</h2>
                <h3>DAILY PROGRESS REPORT</h3>
                <p>Date: {displayDate}</p>
            </div>

            <div className="space-y-6 mt-4">

                {/* 1. Production Table */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Production Details</div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th rowSpan="2">Sl No.</th>
                                <th rowSpan="2" className="w-48">Material</th>
                                <th rowSpan="2">Unit</th>
                                <th colSpan="2">For The Day</th>
                                <th colSpan="2">For The Month</th>
                                <th colSpan="2">For The Year</th>
                            </tr>
                            <tr className={styles.blueHeader}>
                                <th>Trips</th>
                                <th>Qty</th>
                                <th>Trips</th>
                                <th>Qty</th>
                                <th>Trips</th>
                                <th>Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {production.map((row, i) => {
                                let displayMaterial = row.MaterialName;
                                if (displayMaterial === 'Waste') displayMaterial = 'OB';
                                if (displayMaterial === 'TOTAL WASTE') displayMaterial = 'TOTAL OB';

                                return (
                                    <tr key={i} style={row.MaterialName.includes("TOTAL") || row.MaterialName.includes("Total") ? { fontWeight: 'bold', backgroundColor: '#f1f5f9' } : {}}>
                                        <td className="text-center">{row.SlNo || ''}</td>
                                        <td className="text-left pl-2">{displayMaterial}</td>
                                        <td className="text-center">{row.Unit}</td>
                                        <td className="!text-center">{row.DayTrip}</td>
                                        <td className="!text-right !pr-4">{row.DayQty}</td>
                                        <td className="!text-center">{row.MonthTrip}</td>
                                        <td className="!text-right !pr-4">{row.MonthQty}</td>
                                        <td className="!text-center">{row.YearTrip}</td>
                                        <td className="!text-right !pr-4">{row.YearQty}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 2. Drilling Table */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Drilling Details</div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th rowSpan="2">Sl No.</th>
                                <th rowSpan="2" className="w-48">Material Type</th>
                                <th colSpan="3">No. of Holes Drilled</th>
                                <th colSpan="3">Drilled Meters</th>
                                <th colSpan="3">Total Hrs</th>
                                <th colSpan="3">Meters/Hr</th>
                            </tr>
                            <tr className={styles.blueHeader}>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drilling.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-center">{row.SlNo}</td>
                                    <td className="text-left pl-2">{row.MaterialType}</td>
                                    <td className="text-center">{row.Holes_FTD}</td>
                                    <td className="text-center">{row.Holes_MTD}</td>
                                    <td className="text-center">{row.Holes_YTD}</td>
                                    <td className="text-center">{row.Drilling_FTD}</td>
                                    <td className="text-center">{row.Drilling_MTD}</td>
                                    <td className="text-center">{row.Drilling_YTD}</td>
                                    <td className="text-center">{row.Hrs_FTD}</td>
                                    <td className="text-center">{row.Hrs_MTD}</td>
                                    <td className="text-center">{row.Hrs_YTD}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            ))}
                            {drilling.length > 0 && (
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                                    <td className="text-center"></td>
                                    <td className="text-left pl-2">TOTAL</td>
                                    <td className="text-center">{formatNum(drillTotals.Holes_FTD)}</td>
                                    <td className="text-center">{formatNum(drillTotals.Holes_MTD)}</td>
                                    <td className="text-center">{formatNum(drillTotals.Holes_YTD)}</td>
                                    <td className="text-center">{formatNum(drillTotals.Drilling_FTD)}</td>
                                    <td className="text-center">{formatNum(drillTotals.Drilling_MTD)}</td>
                                    <td className="text-center">{formatNum(drillTotals.Drilling_YTD)}</td>
                                    <td className="text-center">{formatNum(drillTotals.Hrs_FTD)}</td>
                                    <td className="text-center">{formatNum(drillTotals.Hrs_MTD)}</td>
                                    <td className="text-center">{formatNum(drillTotals.Hrs_YTD)}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 3. Blasting Table */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Blasting Details</div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th rowSpan="2">Sl No.</th>
                                <th colSpan="3">No. of Holes</th>
                                <th colSpan="3">Total Explosive Used</th>
                                <th colSpan="3">Blasted Volume</th>
                                <th colSpan="3">Powder Factor</th>
                            </tr>
                            <tr className={styles.blueHeader}>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blasting.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-center">{row.SlNo}</td>
                                    <td className="text-center">{row.Holes_FTD}</td>
                                    <td className="text-center">{row.Holes_MTD}</td>
                                    <td className="text-center">{row.Holes_YTD}</td>
                                    <td className="text-center">{row.Exp_FTD}</td>
                                    <td className="text-center">{row.Exp_MTD}</td>
                                    <td className="text-center">{row.Exp_YTD}</td>
                                    <td className="text-center">{row.TotalVolume_FTD}</td>
                                    <td className="text-center">{row.TotalVolume_MTD}</td>
                                    <td className="text-center">{row.TotalVolume_YTD}</td>
                                    <td className="text-center">{row.PowderFactor_FTD}</td>
                                    <td className="text-center">{row.PowderFactor_MTD}</td>
                                    <td className="text-center">{row.PowderFactor_YTD}</td>
                                </tr>
                            ))}
                            {blasting.length > 0 && (
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                                    <td className="text-center">TOTAL</td>
                                    <td className="text-center">{formatNum(blastTotals.Holes_FTD)}</td>
                                    <td className="text-center">{formatNum(blastTotals.Holes_MTD)}</td>
                                    <td className="text-center">{formatNum(blastTotals.Holes_YTD)}</td>
                                    <td className="text-center">{formatNum(blastTotals.Exp_FTD)}</td>
                                    <td className="text-center">{formatNum(blastTotals.Exp_MTD)}</td>
                                    <td className="text-center">{formatNum(blastTotals.Exp_YTD)}</td>
                                    <td className="text-center">{formatNum(blastTotals.TotalVolume_FTD)}</td>
                                    <td className="text-center">{formatNum(blastTotals.TotalVolume_MTD)}</td>
                                    <td className="text-center">{formatNum(blastTotals.TotalVolume_YTD)}</td>
                                    <td className="text-center"></td>
                                    <td className="text-center"></td>
                                    <td className="text-center"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 4. Crusher Table */}
                <div className={styles.tableContainer}>
                    <div className={styles.sectionHeader}>Crusher Production</div>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.blueHeader}>
                                <th rowSpan="2" className="w-48 text-left pl-2">Plant</th>
                                <th colSpan="3">Hrs Run</th>
                                <th colSpan="3">Production Qty.</th>
                                <th colSpan="3">KWH</th>
                                <th colSpan="3">KWH/Hrs</th>
                            </tr>
                            <tr className={styles.blueHeader}>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                                <th>FTD</th>
                                <th>MTD</th>
                                <th>YTD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {crusher.map((row, i) => (
                                <tr key={i}>
                                    <td className="text-left pl-2 font-bold">{row.Plant}</td>
                                    <td className="text-center">{row.Hrs_FTD}</td>
                                    <td className="text-center">{row.Hrs_MTD}</td>
                                    <td className="text-center">{row.Hrs_YTD}</td>
                                    <td className="text-center">{row.Qty_FTD}</td>
                                    <td className="text-center">{row.Qty_MTD}</td>
                                    <td className="text-center">{row.Qty_YTD}</td>
                                    <td className="text-center">{row.KWH_FTD}</td>
                                    <td className="text-center">{row.KWH_MTD}</td>
                                    <td className="text-center">{row.KWH_YTD}</td>
                                    <td className="text-center">{row.KWH_HR_FTD}</td>
                                    <td className="text-center">{row.KWH_HR_MTD}</td>
                                    <td className="text-center">{row.KWH_HR_YTD}</td>
                                </tr>
                            ))}
                            {crusher.length > 0 && (
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                                    <td className="text-left pl-2">TOTAL</td>
                                    <td className="text-center">{formatNum(crusherTotals.Hrs_FTD)}</td>
                                    <td className="text-center">{formatNum(crusherTotals.Hrs_MTD)}</td>
                                    <td className="text-center">{formatNum(crusherTotals.Hrs_YTD)}</td>
                                    <td className="text-center">{formatNum(crusherTotals.Qty_FTD)}</td>
                                    <td className="text-center">{formatNum(crusherTotals.Qty_MTD)}</td>
                                    <td className="text-center">{formatNum(crusherTotals.Qty_YTD)}</td>
                                    <td className="text-center">{formatNum(crusherTotals.KWH_FTD)}</td>
                                    <td className="text-center">{formatNum(crusherTotals.KWH_MTD)}</td>
                                    <td className="text-center">{formatNum(crusherTotals.KWH_YTD)}</td>
                                    <td className="text-center"></td>
                                    <td className="text-center"></td>
                                    <td className="text-center"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default DailyProgressTable;
