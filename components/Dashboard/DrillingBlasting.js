'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import styles from '../../app/dashboard/page.module.css'; // Reusing dashboard styles
import DrillingDetailsTable from './DrillingDetailsTable';

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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>1. Drilling Performance Overview</h2>
                    </div>

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

                    {/* Inline Details Table replacing Charts */}
                    <DrillingDetailsTable date={date} />

                </section>

                <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '2rem', paddingBottom: '1rem' }}>
                    Generated on {new Date().toLocaleString()} | ProMS Dashboard
                </div>
            </div>
        </div>
    );
}
