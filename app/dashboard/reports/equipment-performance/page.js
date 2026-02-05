'use client';

import { useState } from 'react';
import ReportTable from '@/components/reports/ReportTable';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

import styles from './EquipmentPerformance.module.css';

/**
 * Equipment Performance Report
 * Shows FTD and FTM performance metrics per equipment
 */
export default function EquipmentPerformanceReport() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);

    // State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    // Columns Configuration
    const columns = [
        { header: 'SlNo', accessor: 'SlNo', width: '60px' },
        { header: 'Activity', accessor: 'ActivityName', width: '150px' },
        { header: 'Group', accessor: 'EquipmentGroupName', width: '150px' },
        { header: 'Equipment', accessor: 'EquipmentName', width: '180px' },

        // FTD
        { header: 'FTD Hrs', accessor: 'FTD_WorkingHr', width: '100px' },
        { header: 'FTD Trips', accessor: 'FTD_Trips', width: '100px' },
        { header: 'FTD Qty', accessor: 'FTD_Qty', width: '100px' },
        { header: 'FTD Trips/Hr', accessor: 'FTD_TripsHr', width: '100px', render: (row) => row.FTD_WorkingHr > 0 ? (row.FTD_Trips / row.FTD_WorkingHr).toFixed(2) : '0.00' },
        { header: 'FTD Qty/Hr', accessor: 'FTD_QtyHr', width: '100px', render: (row) => row.FTD_WorkingHr > 0 ? (row.FTD_Qty / row.FTD_WorkingHr).toFixed(2) : '0.00' },

        // FTM
        { header: 'FTM Hrs', accessor: 'FTM_WorkingHr', width: '100px' },
        { header: 'FTM Trips', accessor: 'FTM_Trips', width: '100px' },
        { header: 'FTM Qty', accessor: 'FTM_Qty', width: '100px' },
        { header: 'FTM Trips/Hr', accessor: 'FTM_TripsHr', width: '100px', render: (row) => row.FTM_WorkingHr > 0 ? (row.FTM_Trips / row.FTM_WorkingHr).toFixed(2) : '0.00' },
        { header: 'FTM Qty/Hr', accessor: 'FTM_QtyHr', width: '100px', render: (row) => row.FTM_WorkingHr > 0 ? (row.FTM_Qty / row.FTM_WorkingHr).toFixed(2) : '0.00' },
    ];

    const handleGenerate = async () => {
        if (!date) return toast.error('Please select a date');

        setLoading(true);
        setData([]); // Clear previous

        try {
            // Re-using the filter component logic but specifically for single date
            // ReportFilter expects separate props or we can just call API here if ReportFilter's onGenerate handles it.
            // Actually ReportFilter is robust. We can pass 'date' to it if it supports it, 
            // BUT ReportFilter usually does range.
            // Let's check ReportFilter again? 
            // The template EqGroup used a custom date input. 
            // I will use a simple custom header similar to EqGroup or adapt ReportFilter.
            // Plan said "Uses ReportFilter". ReportFilter has reportType, fromDate, toDate.
            // I need a SINGLE DATE.
            // I'll stick to the layout from EqGroup for the header part (simple date picker) but use ReportTable for data.

            const response = await fetch('/api/reports/equipment-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });

            const result = await response.json();

            if (result.success) {
                setData(result.data);
                toast.success(`Loaded ${result.data.length} records`);
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
            setGenerated(true);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Equipment Performance Report</h1>
                <p className={styles.subtitle}>Detailed performance metrics per equipment</p>
            </div>

            {/* Filter Container */}
            <div className={styles.filterContainer}>

                {/* Date Input */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={styles.input}
                    />
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={styles.generateBtn}
                >
                    <Search size={16} />
                    {loading ? 'Processing...' : 'Generate View'}
                </button>
            </div>

            <ReportTable
                columns={columns}
                data={data}
                loading={loading}
                reportName="Equipment Performance"
                fromDate={date}
                toDate={date}
                generated={generated}
            />
        </div>
    );
}
