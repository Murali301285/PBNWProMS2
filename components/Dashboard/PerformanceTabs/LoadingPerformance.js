'use client';
import { useState } from 'react';
import SuperTable from '../../Shared/SuperTable';

// Data passed via props

const formatNumber = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

const TITLE_COL = { header: 'S.N.', accessor: 'SN', width: '60px', align: 'center', render: (_, __, index) => index };
const COMMON_COLS = [
    { header: 'Equipment', accessor: 'Equipment' },
    { header: 'Model', accessor: 'Model' },
    { header: 'Capacity', accessor: 'Capacity' },
    { header: 'Shift', accessor: 'Shift' },
];

export default function LoadingPerformance({ data = [] }) {
    const [rankingMode, setRankingMode] = useState('Top');
    const [limit, setLimit] = useState(10);

    const loadingOps = data.filter(d => d.Type === 'Loading');
    const haulingOps = data.filter(d => d.Type === 'Hauling');

    const processData = (data) => {
        const sorted = [...data].sort((a, b) => {
            return rankingMode === 'Top' ? b.Rate - a.Rate : a.Rate - b.Rate;
        });
        return sorted.slice(0, limit);
    };

    const displayLoading = processData(loadingOps);
    const displayHauling = processData(haulingOps);

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

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Reuse Control Bar Logic */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                alignItems: 'center',
                background: 'white',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Rank:</span>
                    <select
                        value={rankingMode}
                        onChange={e => setRankingMode(e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                        <option value="Top">Top</option>
                        <option value="Below">Below</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Count:</span>
                    <select
                        value={limit}
                        onChange={e => setLimit(Number(e.target.value))}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                    </select>
                </div>
            </div>

            {/* Tables Container - Vertical Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* 1. Loading Performance */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'blue', marginBottom: '1rem' }}>
                        {rankingMode} {limit} Loading Performance
                    </h2>
                    <SuperTable
                        columns={loadingCols}
                        data={displayLoading}
                        title={`${rankingMode} ${limit} Loading Performance`}
                        showPagination={false}
                    />
                </div>

                {/* 2. Hauling Performance */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#059669', marginBottom: '1rem' }}>
                        {rankingMode} {limit} Hauling Performance
                    </h2>
                    <SuperTable
                        columns={haulingCols}
                        data={displayHauling}
                        title={`${rankingMode} ${limit} Hauling Performance`}
                        showPagination={false}
                    />
                </div>

            </div>
        </div>
    );
}
