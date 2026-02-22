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

    const formatNum = (value) => {
        if (value === null || value === undefined) return 0;

        // Remove commas if the value is a string and convert to number
        const cleanStr = String(value).replace(/,/g, '');
        const num = Number(cleanStr);

        if (isNaN(num)) return 0;

        // Format using Indian Number System 
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const drillTotals = calculateTotal(drilling, ['Holes_FTD', 'Holes_MTD', 'Holes_YTD', 'Drilling_FTD', 'Drilling_MTD', 'Drilling_YTD', 'Hrs_FTD', 'Hrs_MTD', 'Hrs_YTD']);
    const blastTotals = calculateTotal(blasting, ['Holes_FTD', 'Holes_MTD', 'Holes_YTD', 'Exp_FTD', 'Exp_MTD', 'Exp_YTD', 'TotalVolume_FTD', 'TotalVolume_MTD', 'TotalVolume_YTD']);
    const crusherTotals = calculateTotal(crusher, ['Hrs_FTD', 'Hrs_MTD', 'Hrs_YTD', 'Qty_FTD', 'Qty_MTD', 'Qty_YTD', 'KWH_FTD', 'KWH_MTD', 'KWH_YTD']);

    return (
        <div className="w-full">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', width: '100%', position: 'relative', minHeight: '110px' }}>
                {/* Logo - Positioned left */}
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                    <img src="/Asset/Logo.png" alt="Thriveni Logo" style={{ height: '96px', objectFit: 'contain' }} />
                </div>

                {/* Text Block - Centered */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.025em' }}>THRIVENI SAINIK MINING PRIVATE LIMITED</h1>
                    <h2 style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginTop: '0.25rem' }}>PAKRI BARWADIH COAL MINING PROJECT</h2>
                    <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase', marginTop: '0.25rem', marginBottom: '0.5rem', textDecoration: 'underline' }}>DAILY PROGRESS REPORT</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', fontSize: '0.875rem', lineHeight: '1.25rem', color: '#334155', fontWeight: '500' }}>
                        <div>Date: {displayDate}</div>
                    </div>
                </div>
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
                                        <td style={{ textAlign: 'center' }}>{row.SlNo || ''}</td>
                                        <td className="text-left pl-2">{displayMaterial}</td>
                                        <td style={{ textAlign: 'center' }}>{row.Unit}</td>
                                        <td style={{ textAlign: 'center' }}>{formatNum(row.DayTrip)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatNum(row.DayQty)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatNum(row.MonthTrip)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatNum(row.MonthQty)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatNum(row.YearTrip)}</td>
                                        <td style={{ textAlign: 'center' }}>{formatNum(row.YearQty)}</td>
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
                                    <td style={{ textAlign: 'center' }}>{row.SlNo}</td>
                                    <td className="text-left pl-2">{row.MaterialType}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Holes_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Holes_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Holes_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Drilling_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Drilling_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Drilling_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Hrs_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Hrs_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Hrs_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.MetersHr_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.MetersHr_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.MetersHr_YTD)}</td>
                                </tr>
                            ))}
                            {drilling.length > 0 && (
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                                    <td style={{ textAlign: 'center' }}></td>
                                    <td className="text-left pl-2">TOTAL</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(drillTotals.Holes_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(drillTotals.Holes_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(drillTotals.Holes_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(drillTotals.Drilling_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(drillTotals.Drilling_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(drillTotals.Drilling_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(drillTotals.Hrs_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(drillTotals.Hrs_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(drillTotals.Hrs_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{drillTotals.Hrs_FTD > 0 ? formatNum(drillTotals.Drilling_FTD / drillTotals.Hrs_FTD) : 0}</td>
                                    <td style={{ textAlign: 'center' }}>{drillTotals.Hrs_MTD > 0 ? formatNum(drillTotals.Drilling_MTD / drillTotals.Hrs_MTD) : 0}</td>
                                    <td style={{ textAlign: 'center' }}>{drillTotals.Hrs_YTD > 0 ? formatNum(drillTotals.Drilling_YTD / drillTotals.Hrs_YTD) : 0}</td>
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
                                <th rowSpan="2" className="w-48 text-left pl-2">Material Type</th>
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
                                    <td style={{ textAlign: 'center' }}>{row.SlNo}</td>
                                    <td className="text-left pl-2">{row.MaterialName}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Holes_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Holes_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Holes_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Exp_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Exp_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Exp_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.TotalVolume_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.TotalVolume_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.TotalVolume_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.PowderFactor_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.PowderFactor_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.PowderFactor_YTD)}</td>
                                </tr>
                            ))}
                            {blasting.length > 0 && (
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                                    <td style={{ textAlign: 'center' }}></td>
                                    <td className="text-left pl-2">TOTAL</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(blastTotals.Holes_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(blastTotals.Holes_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(blastTotals.Holes_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(blastTotals.Exp_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(blastTotals.Exp_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(blastTotals.Exp_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(blastTotals.TotalVolume_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(blastTotals.TotalVolume_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(blastTotals.TotalVolume_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}></td>
                                    <td style={{ textAlign: 'center' }}></td>
                                    <td style={{ textAlign: 'center' }}></td>
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
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Hrs_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Hrs_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Hrs_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Qty_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Qty_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.Qty_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.KWH_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.KWH_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.KWH_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.KWH_HR_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.KWH_HR_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(row.KWH_HR_YTD)}</td>
                                </tr>
                            ))}
                            {crusher.length > 0 && (
                                <tr style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                                    <td className="text-left pl-2">TOTAL</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(crusherTotals.Hrs_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(crusherTotals.Hrs_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(crusherTotals.Hrs_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(crusherTotals.Qty_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(crusherTotals.Qty_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(crusherTotals.Qty_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(crusherTotals.KWH_FTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(crusherTotals.KWH_MTD)}</td>
                                    <td style={{ textAlign: 'center' }}>{formatNum(crusherTotals.KWH_YTD)}</td>
                                    <td style={{ textAlign: 'center' }}></td>
                                    <td style={{ textAlign: 'center' }}></td>
                                    <td style={{ textAlign: 'center' }}></td>
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
