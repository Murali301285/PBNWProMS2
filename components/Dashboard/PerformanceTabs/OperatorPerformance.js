'use client';
import { useState } from 'react';
import SuperTable from '../../Shared/SuperTable';
import { Settings2 } from 'lucide-react';

// Data passed via props

const formatNumber = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

const COLS = [
    { header: 'S.N.', accessor: 'SN', width: '60px', align: 'center', render: (_, __, index) => index },
    { header: 'Equipment', accessor: 'Equipment' },
    { header: 'Trip', accessor: 'Trip', align: 'center' },
    { header: 'Qty (BCM)', accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) },
    { header: 'Hrs', accessor: 'Hrs', align: 'right', render: (val) => formatNumber(val) },
    { header: 'Model', accessor: 'Model' },
    { header: 'Capacity', accessor: 'Capacity' },
    { header: 'Shift', accessor: 'Shift' },
];

export default function OperatorPerformance({ data = [] }) {
    const [rankingMode, setRankingMode] = useState('Top'); // Top | Below
    const [limit, setLimit] = useState(10); // 5 | 10

    // Filter Data by Type
    const loadingOps = data.filter(d => d.Type === 'Loading');
    const haulingOps = data.filter(d => d.Type === 'Hauling');

    const processData = (data) => {
        const sorted = [...data].sort((a, b) => {
            return rankingMode === 'Top' ? b.Qty - a.Qty : a.Qty - b.Qty;
        });
        return sorted.slice(0, limit);
    };

    const displayLoading = processData(loadingOps);
    const displayHauling = processData(haulingOps);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

            {/* Control Bar */}
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
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Settings2 size={16} />
                    <span>Use filters in table header for sorting by Shift/Model</span>
                </div>
            </div>

            {/* Tables Container - Vertical Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* 1. Loading Operator Performance */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'blue', marginBottom: '1rem' }}>
                        {rankingMode} {limit} Loading Operator Performance
                    </h2>
                    <SuperTable
                        columns={COLS}
                        data={displayLoading}
                        title={`${rankingMode} ${limit} Loading Operator Performance`}
                        showPagination={false}
                    />
                </div>

                {/* 2. Hauling Operator Performance */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#059669', marginBottom: '1rem' }}>
                        {rankingMode} {limit} Hauling Operator Performance
                    </h2>
                    <SuperTable
                        columns={COLS}
                        data={displayHauling}
                        title={`${rankingMode} ${limit} Hauling Operator Performance`}
                        showPagination={false}
                    />
                </div>

            </div>
        </div>
    );
}
