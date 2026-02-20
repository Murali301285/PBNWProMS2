
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
// import SearchableSelect from '@/components/SearchableSelect'; // Not using for single select shift for now, keeping simple select
import ReportTable from '@/components/reports/ReportTable';
import styles from './WaterTankerReport.module.css';

export default function WaterTankerReport() {
    const today = new Date().toISOString().split('T')[0];
    const [filter, setFilter] = useState({
        fromDate: today,
        toDate: today,
        shiftId: ''
    });

    // Data States
    const [data, setData] = useState([]);
    const [shifts, setShifts] = useState([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Load Shifts on Mount
    useEffect(() => {
        const loadShifts = async () => {
            try {
                const res = await fetch('/api/master/shift');
                const json = await res.json();
                if (Array.isArray(json)) setShifts(json);
                else if (json.success && json.data) setShifts(json.data);
            } catch (err) {
                console.error("Failed to load shifts", err);
                toast.error("Failed to load shift options");
            } finally {
                setInitializing(false);
            }
        };
        loadShifts();
    }, []);

    const fetchData = async () => {
        if (!filter.fromDate || !filter.toDate) {
            toast.error('Please select both dates');
            return;
        }

        setLoading(true);
        setGenerated(true);
        setData([]);

        try {
            const res = await fetch('/api/reports/water-tanker-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromDate: filter.fromDate, toDate: filter.toDate, shiftId: filter.shiftId })
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                if (result.data.length === 0) toast.info("No records found");
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
        }
    };

    // Formatters
    const fmt0 = (val) => val != null ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';
    const fmt3 = (val) => val != null ? Number(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '0.000';

    // Columns Configuration for ReportTable
    const columns = useMemo(() => [
        { header: 'S.N.', accessor: 'SlNo', width: '60px' },
        { header: 'Date', accessor: 'Date', width: '100px' }, // Added Date Column
        { header: 'Water Tanker Equipment', accessor: 'Water Tanker Equipment', width: '200px' },
        { header: 'Trip', accessor: 'Trip', width: '80px', render: r => fmt0(r.Trip) },
        { header: 'Tanker Capacity (Cub mtr)', accessor: 'Tanker Capacity', width: '150px', render: r => fmt0(r['Tanker Capacity']) }, // Updated accessor
        { header: 'Qty.', accessor: 'Qty', width: '100px', render: r => fmt3(r.Qty) },
        { header: 'Filling Point', accessor: 'Filling Point', width: '150px' }, // Updated accessor
        { header: 'Filling Pump', accessor: 'Filling Pump', width: '150px' }, // Updated accessor
        { header: 'Destination', accessor: 'Destination', width: '150px' },
        { header: 'Remarks', accessor: 'Remarks', width: '200px' },
    ], []);

    if (initializing) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Water Tanker Performance Report</h1>
                <p className={styles.subtitle}>Daily water tanker operations and entries</p>
            </div>

            {/* Filter Container */}
            <div className={styles.filterContainer}>

                {/* Date Inputs */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>From Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={filter.fromDate}
                        onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>To Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={filter.toDate}
                        onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
                    />
                </div>

                {/* Shift Filter (Single Select) */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Shift</label>
                    <select
                        className={styles.input}
                        value={filter.shiftId}
                        onChange={(e) => setFilter({ ...filter, shiftId: e.target.value })}
                        style={{ minWidth: '200px' }}
                    >
                        <option value="">All Shifts</option>
                        {shifts.map(s => (
                            <option key={s.SlNo} value={s.SlNo}>{s.ShiftName}</option>
                        ))}
                    </select>
                </div>

                {/* Generate Button */}
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className={styles.generateBtn}
                    style={{ marginTop: 'auto', marginBottom: '2px' }}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Search size={16} />
                            Generate View
                        </>
                    )}
                </button>
            </div>

            {/* Data Table */}
            <ReportTable
                columns={columns}
                data={data}
                loading={loading}
                generated={generated}
                reportName="Water Tanker Performance"
                fromDate={filter.fromDate}
                toDate={filter.toDate}
            />
        </div>
    );
}
