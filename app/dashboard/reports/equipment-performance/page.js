'use client';

import { useState, useEffect, useMemo } from 'react';
import ReportTable from '@/components/reports/ReportTable';
import { toast } from 'sonner';
import { Search, Loader2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect'; // Assuming this exists, based on other reports

import styles from './EquipmentPerformance.module.css';

/**
 * Equipment Performance Report
 * Shows Shift-wise, FTD, and MTD performance metrics per equipment
 */
export default function EquipmentPerformanceReport() {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);

    // Filters
    const [activityOptions, setActivityOptions] = useState([]);
    const [equipmentOptions, setEquipmentOptions] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]); // Array of IDs
    const [selectedEquipment, setSelectedEquipment] = useState([]); // Array of IDs
    const [operatorOptions, setOperatorOptions] = useState([]);
    const [selectedOperators, setSelectedOperators] = useState([]);

    // Master Data (Full list to filter locally)
    const [allEquipment, setAllEquipment] = useState([]);

    // State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Fetch Helper Data
    useEffect(() => {
        const fetchHelpers = async () => {
            try {
                const res = await fetch('/api/reports/equipment-performance/helpers');
                const data = await res.json();

                if (data.activities) setActivityOptions(data.activities);
                if (data.operators) setOperatorOptions(data.operators);
                if (data.equipment) {
                    setAllEquipment(data.equipment);
                    setEquipmentOptions(data.equipment); // Default show all
                }
            } catch (error) {
                console.error("Error fetching helpers:", error);
                toast.error("Failed to load filter options");
            } finally {
                setInitializing(false);
            }
        };

        fetchHelpers();
    }, []);

    // Filter Equipment based on Activity Selection
    useEffect(() => {
        if (selectedActivities.length === 0) {
            setEquipmentOptions(allEquipment);
        } else {
            // Filter equipment where ActivityId matches selected activities (IDs)
            const filtered = allEquipment.filter(eq => selectedActivities.includes(eq.ActivityId));
            setEquipmentOptions(filtered);
        }
    }, [selectedActivities, allEquipment]);

    // Columns Configuration
    const columns = useMemo(() => [
        { header: 'Sl.No', accessor: 'SlNo', width: '60px' },
        { header: 'PMS Code', accessor: 'PMS Code', width: '100px' },
        { header: 'Cost Center', accessor: 'CostCenter', width: '100px' },
        { header: 'Equipment', accessor: 'Equipment', width: '180px' },
        { header: 'Operator', accessor: 'Operator', width: '150px' },
        { header: 'Activity', accessor: 'Activity', width: '150px' },

        // Shift A
        { header: 'Shift A Trips', accessor: 'Shift ATotal Trips', width: '110px' },
        { header: 'Shift A Qty', accessor: 'Shift ATotal Qty', width: '110px' },
        { header: 'Shift A Hrs', accessor: 'Shift ATotal Hrs', width: '110px' },
        { header: 'Shift A Kms', accessor: 'Shift ATotal Kms', width: '110px' },
        { header: 'Shift A Trips/Hr', accessor: 'Shift ATrips Per Hr', width: '120px' },
        { header: 'Shift A Qty/Hr', accessor: 'Shift AQty Per Hr', width: '120px' },

        // Shift B
        { header: 'Shift B Trips', accessor: 'Shift BTotal Trips', width: '110px' },
        { header: 'Shift B Qty', accessor: 'Shift BTotal Qty', width: '110px' },
        { header: 'Shift B Hrs', accessor: 'Shift BTotal Hrs', width: '110px' },
        { header: 'Shift B Kms', accessor: 'Shift BTotal Kms', width: '110px' },
        { header: 'Shift B Trips/Hr', accessor: 'Shift BTrips Per Hr', width: '120px' },
        { header: 'Shift B Qty/Hr', accessor: 'Shift BQty Per Hr', width: '120px' },

        // Shift C
        { header: 'Shift C Trips', accessor: 'Shift CTotal Trips', width: '110px' },
        { header: 'Shift C Qty', accessor: 'Shift CTotal Qty', width: '110px' },
        { header: 'Shift C Hrs', accessor: 'Shift CTotal Hrs', width: '110px' },
        { header: 'Shift C Kms', accessor: 'Shift CTotal Kms', width: '110px' },
        { header: 'Shift C Trips/Hr', accessor: 'Shift CTrips Per Hr', width: '120px' },
        { header: 'Shift C Qty/Hr', accessor: 'Shift CQty Per Hr', width: '120px' },

        // FTD
        { header: 'FTD Trips', accessor: 'FTDTotal Trips', width: '110px' },
        { header: 'FTD Qty', accessor: 'FTDTotal Qty', width: '110px' },
        { header: 'FTD Hrs', accessor: 'FTDTotal Hrs', width: '110px' },
        { header: 'FTD Kms', accessor: 'FTDTotal Kms', width: '110px' },
        { header: 'FTD Fuel', accessor: 'FTDTotal Fuel', width: '110px' },
        { header: 'FTD Trips/Hr', accessor: 'FTDTrips Per Hr', width: '120px' },
        { header: 'FTD Qty/Hr', accessor: 'FTDQty Per Hr', width: '120px' },
        { header: 'FTD Fuel/Hr', accessor: 'FTDFuel Per Hr', width: '120px', render: r => Number(r['FTDFuel Per Hr']).toFixed(2) },
        { header: 'FTD KMPL', accessor: 'FTDKMPL', width: '110px', render: r => Number(r['FTDKMPL']).toFixed(2) },

        // MTD
        { header: 'MTD Trips', accessor: 'MTDTotal Trips', width: '110px' },
        { header: 'MTD Qty', accessor: 'MTDTotal Qty', width: '110px' },
        { header: 'MTD Hrs', accessor: 'MTDTotal Hrs', width: '110px' },
        { header: 'MTD Kms', accessor: 'MTDTotal Kms', width: '110px' },
        { header: 'MTD Fuel', accessor: 'MTDTotal Fuel', width: '110px' },
        { header: 'MTD Trips/Hr', accessor: 'MTDTrips Per Hr', width: '120px' },
        { header: 'MTD Qty/Hr', accessor: 'MTDQty Per Hr', width: '120px' },
        { header: 'MTD Fuel/Hr', accessor: 'MTDFuel Per Hr', width: '120px', render: r => Number(r['MTDFuel Per Hr']).toFixed(2) },
        { header: 'MTD KMPL', accessor: 'MTDKMPL', width: '110px', render: r => Number(r['MTDKMPL']).toFixed(2) },

    ], []);

    const handleGenerate = async () => {
        if (!date) return toast.error('Please select a date');

        setLoading(true);
        setData([]);

        try {
            const payload = {
                date,
                activityIds: selectedActivities,
                date,
                activityIds: selectedActivities,
                equipmentIds: selectedEquipment,
                operatorIds: selectedOperators
            };

            const response = await fetch('/api/reports/equipment-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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

    if (initializing) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" /></div>;
    }

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

                {/* Activity Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>Activity</label>
                    <SearchableSelect
                        options={activityOptions}
                        value={selectedActivities}
                        onChange={(e) => setSelectedActivities(e.target.value)}
                        multiple
                        placeholder="All Activities"
                    />
                </div>

                {/* Equipment Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>Equipment</label>
                    <SearchableSelect
                        options={equipmentOptions}
                        value={selectedEquipment}
                        onChange={(e) => setSelectedEquipment(e.target.value)}
                        multiple
                        placeholder="All Equipment"
                    />
                </div>

                {/* Operator Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>Operator</label>
                    <SearchableSelect
                        options={operatorOptions}
                        value={selectedOperators}
                        onChange={(e) => setSelectedOperators(e.target.value)}
                        multiple
                        placeholder="All Operators"
                    />
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={styles.generateBtn}
                    style={{ marginTop: 'auto', marginBottom: '2px' }}
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
