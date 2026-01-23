'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import RecoveryChart from './Charts/RecoveryChart';
import SMEChart from './Charts/SMEChart';
import ExplosiveDonut from './Charts/ExplosiveDonut';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import styles from '../../app/dashboard/page.module.css'; // Reusing dashboard styles

export default function DrillingBlasting() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const contentRef = useRef(null);


    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/drilling-blasting?date=${date}`);
            const json = await res.json();

            if (json.success) {
                // Map KPI Array to Objects (Assuming 'Period' column: Shift, Day, Month)
                const kpis = json.drilling.kpis || [];
                const shiftKPI = kpis.find(k => k.Period === 'Shift') || {};
                const dayKPI = kpis.find(k => k.Period === 'Day') || {};
                const monthKPI = kpis.find(k => k.Period === 'Month') || {};

                setData({
                    drilling: {
                        shift: shiftKPI,
                        day: dayKPI,
                        month: monthKPI,
                        recovery: json.drilling.recovery,
                        performance: json.drilling.performance
                    },
                    blasting: json.blasting
                });
            } else {
                toast.error(json.message || 'Failed to fetch data');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (date) fetchData();
    }, [date]);

    const handleDownloadPDF = async () => {
        if (!contentRef.current) return;

        try {
            toast.info('Generating PDF...');
            const canvas = await html2canvas(contentRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Drilling_Blasting_Report_${date}.pdf`);
            toast.success('PDF Downloaded');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate PDF');
        }
    };

    if (loading && !data) return <div className="p-8 text-white">Loading Dashboard...</div>;


    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1>Drilling & Blasting Dashboard</h1>
                <div className={styles.controls}>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={styles.dateInput}
                    />
                    <button onClick={fetchData} className={`${styles.iconButton} ${styles.btnBlue}`}>
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={handleDownloadPDF} className={`${styles.iconButton} ${styles.btnGreen}`}>
                        <Download size={18} /> PDF
                    </button>
                </div>
            </div>


            <div ref={contentRef} style={{ padding: '1rem' }}>

                {/* Section 1: Drilling */}
                <section>
                    <h2 className={styles.sectionTitle}>1. Drilling Performance Overview</h2>

                    {/* KPI Cards */}
                    <div className={styles.gridThree}>
                        <div className={`${styles.kpiCard} ${styles.cardGreen}`}>
                            <h3 className={styles.kpiLabel}>Highest Drill (Shift)</h3>
                            <div className={styles.kpiValue}>{data?.drilling?.shift?.MaxMeters || 0} m</div>
                            <div className={styles.kpiSubtext}>
                                {data?.drilling?.shift?.EquipmentName || 'N/A'} ({data?.drilling?.shift?.ShiftName})
                            </div>
                        </div>
                        <div className={`${styles.kpiCard} ${styles.cardBlue}`}>
                            <h3 className={styles.kpiLabel}>Highest Drill (Day)</h3>
                            <div className={styles.kpiValue}>{data?.drilling?.day?.MaxMeters || 0} m</div>
                            <div className={styles.kpiSubtext}>
                                {data?.drilling?.day?.EquipmentName || 'N/A'}
                            </div>
                        </div>
                        <div className={`${styles.kpiCard} ${styles.cardPurple}`}>
                            <h3 className={styles.kpiLabel}>Highest Drill (Month)</h3>
                            <div className={styles.kpiValue}>{data?.drilling?.month?.MaxMeters || 0} m</div>
                            <div className={styles.kpiSubtext}>
                                {data?.drilling?.month?.EquipmentName || 'N/A'}
                            </div>
                        </div>
                    </div>


                    {/* Redesign: Chart Left, Detailed Table Right */}
                    <div className={styles.gridTwo} style={{ alignItems: 'start' }}>

                        {/* LEFT: Recovery Chart */}
                        <div className={styles.chartContainer}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Production Recovery</h3>
                            {data?.drilling?.recovery && <RecoveryChart data={data.drilling.recovery} />}
                        </div>

                        {/* RIGHT: Detailed Machine Performance */}
                        <div className={styles.chartContainer} style={{ height: 'auto', minHeight: '400px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Drill-wise Performance (Today)</h3>

                            <table className={styles.detailTable}>
                                <thead>
                                    <tr>
                                        <th>Drill No.</th>
                                        <th style={{ textAlign: 'right' }}>Shift (m)</th>
                                        <th style={{ textAlign: 'right' }}>Day (m)</th>
                                        <th style={{ textAlign: 'right' }}>Ach %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.drilling?.performance?.map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 500 }}>{row.EquipmentName} {row.Remarks && <span style={{ color: 'red', fontSize: '0.7em' }}>({row.Remarks})</span>}</td>
                                            <td style={{ textAlign: 'right' }}>{row.ShiftMeters}</td>
                                            <td style={{ textAlign: 'right' }}>{row.DayMeters}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    background: row.Achievement >= 90 ? '#dcfce7' : row.Achievement >= 50 ? '#fef9c3' : '#fee2e2',
                                                    color: row.Achievement >= 90 ? '#166534' : row.Achievement >= 50 ? '#854d0e' : '#991b1b',
                                                    fontWeight: 700
                                                }}>
                                                    {row.Achievement}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Section 2: Blasting */}
                <section style={{ marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>2. Blasting Performance Overview</h2>

                    <div className={styles.gridTwo}>
                        {/* SME Supplier Chart */}
                        <div className={styles.chartContainer}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Supplier Analysis</h3>
                            {data?.blasting?.supplier && <SMEChart data={data.blasting.supplier} />}
                        </div>

                        {/* Explosive Donut */}
                        <div className={styles.chartContainer}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Explosive Type Distribution</h3>
                            <div style={{ width: '60%', margin: '0 auto' }}>
                                {data?.blasting?.explosive && <ExplosiveDonut data={data.blasting.explosive} />}
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Detailed Blasting Log */}
                    <div className={styles.chartContainer} style={{ height: 'auto', marginTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Blasting Patterns Executed</h3>
                        <table className={styles.detailTable}>
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Pattern ID</th>
                                    <th style={{ textAlign: 'right' }}>Holes</th>
                                    <th style={{ textAlign: 'right' }}>Explosive (Kg)</th>
                                    <th>Type</th>
                                    <th>Supplier</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.blasting?.details?.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.Location}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{row.Pattern}</td>
                                        <td style={{ textAlign: 'right' }}>{row.Holes}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.Explosive.toLocaleString()}</td>
                                        <td>
                                            <span style={{
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7em',
                                                border: '1px solid var(--border)',
                                                background: 'var(--secondary)',
                                                color: 'var(--secondary-foreground)'
                                            }}>
                                                {row.Type}
                                            </span>
                                        </td>
                                        <td>{row.Supplier}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </section>

                <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '2rem', paddingBottom: '1rem' }}>
                    Generated on {new Date().toLocaleString()} | ProMS Dashboard
                </div>
            </div>
        </div>
    );
}
