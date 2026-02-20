'use client';
import { useState, useEffect } from 'react';
import SuperTable from '../../Shared/SuperTable';
import { Filter, RefreshCw } from 'lucide-react';
import Loader from '../../Shared/Loader';
import SearchableSelect from '../../Shared/SearchableSelect';

export default function PerformanceSection({
    title,
    type,
    dateRange,
    filterOptions,
    color,
    columns, // Pass columns dynamically
    apiEndpoint, // API endpoint to fetch data from
    sortByCol = 'Qty', // Column to sort by
    defaultLimit = 10
}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rankingMode, setRankingMode] = useState('Top'); // Top | Below
    const [limit, setLimit] = useState(defaultLimit);

    // Local Filters
    const [filters, setFilters] = useState({ model: '', capacity: '', shiftId: '' });

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                fromDate: dateRange.from,
                toDate: dateRange.to,
                model: filters.model,
                capacity: filters.capacity,
                shiftId: filters.shiftId,
                type: type // 'Loading' or 'Hauling'
            });

            const res = await fetch(`${apiEndpoint}?${query}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch when DateRange changes
    useEffect(() => {
        if (dateRange && dateRange.from && dateRange.to) {
            fetchData();
        }
    }, [dateRange, apiEndpoint]);

    const handleShow = () => {
        fetchData();
    };

    const processData = (list) => {
        const sorted = [...list].sort((a, b) => {
            // valueOf() ensures we compare numbers if possible
            const valA = Number(a[sortByCol]) || 0;
            const valB = Number(b[sortByCol]) || 0;
            return rankingMode === 'Top' ? valB - valA : valA - valB;
        });
        return sorted.slice(0, limit);
    };

    const displayData = processData(data);

    return (
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: color, marginBottom: '1rem' }}>{title}</h2>

            {/* Filter Bar */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                alignItems: 'center',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '1rem'
            }}>
                {/* Ranking Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #cbd5e1', paddingRight: '15px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Rank:</span>
                    <select
                        value={rankingMode}
                        onChange={e => setRankingMode(e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                        <option value="Top">Top</option>
                        <option value="Below">Below</option>
                    </select>

                    <select
                        value={limit}
                        onChange={e => setLimit(Number(e.target.value))}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                {/* DB Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <Filter size={16} className="text-gray-500" />

                    <div style={{ width: '150px' }}>
                        <SearchableSelect
                            options={filterOptions.models || []}
                            value={filters.model}
                            onChange={(val) => setFilters(prev => ({ ...prev, model: val }))}
                            placeholder="All Models"
                        />
                    </div>

                    <div style={{ width: '120px' }}>
                        <select
                            value={filters.capacity}
                            onChange={e => setFilters({ ...filters, capacity: e.target.value })}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', cursor: 'pointer' }}
                        >
                            <option value="">All Cap.</option>
                            {filterOptions.capacities?.map((c, i) => <option key={i} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div style={{ width: '150px' }}>
                        <select
                            value={filters.shiftId}
                            onChange={e => setFilters({ ...filters, shiftId: e.target.value })}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%', cursor: 'pointer' }}
                        >
                            <option value="">All Shifts</option>
                            {filterOptions.shifts?.map((s) => <option key={s.SlNo} value={s.SlNo}>{s.ShiftName}</option>)}
                        </select>
                    </div>

                    <button
                        onClick={handleShow}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', height: '38px', whiteSpace: 'nowrap' }}
                    >
                        <RefreshCw size={14} /> Show
                    </button>
                </div>

            </div>

            {loading ? <Loader text={`Loading ${type} Data...`} /> : (
                <SuperTable
                    columns={columns}
                    data={displayData}
                    title={`${rankingMode} ${limit} ${title}`}
                    showPagination={false}
                />
            )}
        </div>
    );
}
