'use client';
import { useState, useEffect } from 'react';
import Loader from '../../Shared/Loader';
import PerformanceSection from './PerformanceSection';

const formatNumber = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

const TITLE_COL = { header: 'S.N.', accessor: 'SN', width: '60px', align: 'center', render: (_, __, index) => index + 1 };
const COMMON_COLS = [
    { header: 'Equipment', accessor: 'Equipment' },
    { header: 'Model', accessor: 'Model' },
    { header: 'Capacity', accessor: 'Capacity' },
    { header: 'Shift', accessor: 'Shift' },
];

export default function LoadingPerformance({ dateRange }) {
    const [filterOptions, setFilterOptions] = useState({ models: [], capacities: [], shifts: [] });
    const [loadingFilters, setLoadingFilters] = useState(true);

    // Fetch Filters Once on Mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await fetch('/api/dashboard/performance/filters');
                const json = await res.json();
                if (json.success) {
                    setFilterOptions({
                        models: json.models,
                        capacities: json.capacities,
                        shifts: json.shifts
                    });
                }
            } catch (err) {
                console.error("Error fetching filters:", err);
            } finally {
                setLoadingFilters(false);
            }
        };
        fetchFilters();
    }, []);

    // Columns specific to each type
    const loadingCols = [
        TITLE_COL,
        { header: 'Current Performance (BCM/Hr)', accessor: 'Rate', align: 'right', render: (val) => formatNumber(val) },
        ...COMMON_COLS
    ];

    const haulingCols = [
        TITLE_COL,
        { header: 'Current Performance (Trip/Hr)', accessor: 'Rate', align: 'right', render: (val) => formatNumber(val) },
        ...COMMON_COLS
    ];

    if (loadingFilters) return <Loader text="Loading Filters..." />;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <PerformanceSection
                title="Loading Performance"
                type="Loading"
                dateRange={dateRange}
                filterOptions={filterOptions}
                color="blue"
                columns={loadingCols}
                apiEndpoint="/api/dashboard/performance/loading-performance"
                sortByCol="Rate"
            />

            <PerformanceSection
                title="Hauling Performance"
                type="Hauling"
                dateRange={dateRange}
                filterOptions={filterOptions}
                color="#059669" // Green
                columns={haulingCols}
                apiEndpoint="/api/dashboard/performance/loading-performance"
                sortByCol="Rate"
            />

        </div>
    );
}
