
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SearchableSelect from '@/components/SearchableSelect';
import ReportTable from '@/components/reports/ReportTable';
import styles from './OperatorPerformance.module.css';

export default function OperatorPerformanceReport() {
    const today = new Date().toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);

    // Filters
    const [allOperators, setAllOperators] = useState([]);
    const [selectedOperators, setSelectedOperators] = useState([]); // Multi-select ID array

    const [allActivities, setAllActivities] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]); // Multi-select ID array

    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        fetchHelpers();
    }, []);

    const fetchHelpers = async () => {
        try {
            const res = await fetch('/api/reports/operator-performance-loading/helpers');
            const data = await res.json();
            if (data.operators) setAllOperators(data.operators);
            if (data.activities) setAllActivities(data.activities);
        } catch (error) {
            console.error("Error fetching helpers:", error);
            toast.error("Failed to load filters");
        }
    };

    const handleGenerate = async () => {
        if (!fromDate || !toDate) {
            toast.error("Please select both dates");
            return;
        }

        setIsLoading(true);
        setIsGenerated(true);
        try {
            const payload = {
                fromDate,
                toDate,
                operatorIds: selectedOperators, // Array of IDs
                activityIds: selectedActivities
            };

            const res = await fetch('/api/reports/operator-performance-loading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to fetch report");

            const data = await res.json();
            setReportData(data);
            if (data.length === 0) toast.info("No records found for selected criteria");

        } catch (error) {
            console.error("Error generating report:", error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const operatorOptions = useMemo(() => allOperators.map(op => ({
        id: op.id,
        name: op.name
    })), [allOperators]);

    const activityOptions = useMemo(() => allActivities.map(act => ({
        id: act.id,
        name: act.name
    })), [allActivities]);

    // Define table columns
    const columns = useMemo(() => [
        { header: 'Sl No', accessor: 'SlNo', width: '60px' },
        { header: 'Date', accessor: 'Date', width: '100px', render: r => new Date(r.Date).toLocaleDateString('en-GB') },
        { header: "Operator's Name", accessor: "OPERATOR'S NAME", width: '200px' },
        { header: 'Shift', accessor: 'SHIFT', width: '80px' },

        { header: 'Loading Equipment', accessor: 'LOADING EQUIPMENT', width: '150px' },
        { header: 'Equipment Model', accessor: 'MODEL', width: '150px' },

        { header: 'Sector', accessor: 'SECTOR', width: '120px' },
        { header: 'Relay', accessor: 'RELAY', width: '120px' },

        { header: 'Open HMR', accessor: 'Open HMR', width: '100px' },
        { header: 'Close HMR', accessor: 'Close HMR', width: '100px' },
        { header: 'Net HMR', accessor: 'Net HMR', width: '100px' },

        { header: 'Working Hr', accessor: 'WORKING HR', width: '100px' },
        { header: 'Idle Hr', accessor: 'IDLE HR', width: '100px' },
        { header: 'Maintenance Hr', accessor: 'MAINTENANCE HR', width: '100px' },
        { header: 'Breakdown Hr', accessor: 'BREAKDOWN HR', width: '100px' },

        { header: 'Coal Trips', accessor: 'COAL TRIPS', width: '100px' },
        { header: 'Coal Qty (MT)', accessor: 'QUANTITY (MT)', width: '120px' },
        { header: 'Coal Trips/Hr', accessor: 'COAL TRIPS/HR', width: '120px' },
        { header: 'Coal Qty/Hr', accessor: 'COAL QTY/HR', width: '120px' },

        { header: 'OB Trips', accessor: 'OB TRIPS', width: '100px' },
        { header: 'OB Qty (BCM)', accessor: 'QUANTITY (BCM)', width: '120px' },
        { header: 'OB Trips/Hr', accessor: 'OB TRIPS/HR', width: '120px' },
        { header: 'OB Qty/Hr', accessor: 'OB QTY/HR', width: '120px' },

        { header: 'Total Trips', accessor: 'TOTAL TRIPS', width: '100px' },
        { header: 'Total Qty', accessor: 'TOTAL QTY', width: '100px' },
        { header: 'Total Hrs', accessor: 'TOTAL HRS', width: '100px' },
        { header: 'Total Trips/Hr', accessor: 'TOTAL TRIPS PER HR', width: '120px' },
        { header: 'Total BCM/Hr', accessor: 'TOTAL BCM/HR', width: '120px' },

        { header: 'Shift Incharge (Large Scale)', accessor: 'Shift Incharge(Large Scale)', width: '200px' },
        { header: 'Shift Incharge (Mid Scale)', accessor: 'Shift Incharge - Mid Scale', width: '200px' },
        { header: 'Remarks', accessor: 'REMARKS', width: '150px' },
    ], []);

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Operator Performance Report - Loading</h1>
                <p className={styles.subtitle}>
                    Detailed performance metrics per operator (Loading Machines)
                </p>
            </div>

            <div className={styles.filterContainer}>
                {/* Date Filter */}
                {/* Date Filter */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>
                        From Date
                    </label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>
                        To Date
                    </label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className={styles.input}
                    />
                </div>

                {/* Activity Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>
                        Activity
                    </label>
                    <SearchableSelect
                        options={activityOptions}
                        value={selectedActivities}
                        onChange={(e) => setSelectedActivities(e.target.value)}
                        multiple
                        placeholder="All Activities"
                    />
                </div>

                {/* Operator Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>
                        Operator
                    </label>
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
                    disabled={isLoading}
                    className={styles.generateBtn}
                    style={{ marginTop: 'auto', marginBottom: '2px' }}
                >
                    {isLoading ? (
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

            <ReportTable
                columns={columns}
                data={reportData}
                loading={isLoading}
                generated={isGenerated}
                reportName="Operator Performance - Loading"
                fromDate={fromDate}
                toDate={toDate}
                stickyLeft={4}
                stickyBgColor="#e0f2fe"
            />
        </div>
    );
}
