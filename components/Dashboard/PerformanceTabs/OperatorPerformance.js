'use client';
import { useState, useEffect } from 'react';
import Loader from '../../Shared/Loader';
import OperatorSection from './OperatorSection';

export default function OperatorPerformance({ dateRange }) {
    // The models and capacities must be fetched per section based on type (Loading/Hauling)
    // We only need to fetch shifts once here.
    const [filterOptions, setFilterOptions] = useState({ shifts: [] });
    const [loadingFilters, setLoadingFilters] = useState(true);

    // Fetch Shifts Once on Mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Fetch only shifts centrally
                const res = await fetch('/api/dashboard/performance/filters?type=ShiftsOnly');
                const json = await res.json();
                if (json.success) {
                    setFilterOptions({
                        shifts: json.shifts
                    });
                }
            } catch (err) {
                console.error("Error fetching shifts:", err);
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
