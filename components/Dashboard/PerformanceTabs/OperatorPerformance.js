'use client';
import { useState, useEffect } from 'react';
import Loader from '../../Shared/Loader';
import OperatorSection from './OperatorSection';

export default function OperatorPerformance({ dateRange }) {
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

    if (loadingFilters) return <Loader text="Loading Filters..." />;

    return (
        <div style={{ width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <OperatorSection
                title="Loading Operator Performance"
                type="Loading"
                dateRange={dateRange}
                filterOptions={filterOptions}
                color="blue"
            />

            <OperatorSection
                title="Hauling Operator Performance"
                type="Hauling"
                dateRange={dateRange}
                filterOptions={filterOptions}
                color="#059669" // Green
            />

        </div>
    );
}
