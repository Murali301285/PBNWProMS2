'use client';
import { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import SuperTable from '../../Shared/SuperTable';
import { Table, PieChart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const formatNumber = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

// Replicating Vertical Table Structure for Crusher Wise
// Data passed via props

const COLS = [
    { header: 'Plant', accessor: 'Plant' },
    { header: 'Qty (MT/BCM)', accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }
];

export default function CrusherWise({ data = [] }) {
    const [viewMode, setViewMode] = useState('data'); // chart | data

    // Filter Helper
    const getData = (category) => data.filter(d => d.Category === category);

    // 5 Tables Vertically (Mocked Data for now, can be specialized)
    const tables = [
        { title: 'Crusher Wise Coal Production', unit: 'Coal (MT)', data: getData('Coal') },
        { title: 'Crusher Wise OB Production', unit: 'OB (BCM)', data: getData('OB') },
        { title: 'Crusher Wise Electrical Loading', unit: 'OB (BCM)', data: getData('Electrical') }, // Assuming generic title for now
        { title: 'Crusher Wise Dispatch', unit: 'Coal (MT)', data: getData('Dispatch') },
        { title: 'Crusher Wise Crushing', unit: 'Coal (MT)', data: getData('Crushing') },
    ];

    // Chart Data (Aggregated by Plant across all categories or specific?)
    // For now, let's aggregate 'Crushing' category only for the chart to make it meaningful? 
    // Or aggregate all? Let's use 'Crushing' category specific data for the chart as default.
    const chartSource = getData('Crushing');
    const total = chartSource.reduce((acc, curr) => acc + curr.Qty, 0);
    const chartData = {
        labels: chartSource.map(d => d.Plant),
        datasets: [{
            data: chartSource.map(d => d.Qty),
            backgroundColor: ['#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa'],
            borderWidth: 1
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'right' },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const val = context.raw;
                        const pct = ((val / total) * 100).toFixed(1);
                        return `${context.label}: ${formatNumber(val)} (${pct}%)`;
                    }
                }
            }
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header with Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'blue' }}>Crusher Wise Production Details</h2>

                <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                    <button
                        onClick={() => setViewMode('data')}
                        style={{ padding: '8px 12px', background: viewMode === 'data' ? 'var(--primary)' : 'transparent', color: viewMode === 'data' ? 'white' : 'inherit', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <Table size={16} /> Data
                    </button>
                    <button
                        onClick={() => setViewMode('chart')}
                        style={{ padding: '8px 12px', background: viewMode === 'chart' ? 'var(--primary)' : 'transparent', color: viewMode === 'chart' ? 'white' : 'inherit', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <PieChart size={16} /> Chart
                    </button>
                </div>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '400px' }}>
                {viewMode === 'data' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {tables.map((tbl, idx) => (
                            <div key={idx}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.5rem' }}>{tbl.title}</h3>
                                <SuperTable
                                    columns={COLS.map(c => c.accessor === 'Qty' ? { ...c, header: tbl.unit } : c)}
                                    data={tbl.data}
                                    title={tbl.title}
                                    pageSizeDefault={10}
                                />
                                {idx === tables.length - 1 && (
                                    <div style={{ marginTop: '1rem', padding: '10px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', textAlign: 'right', fontWeight: 'bold' }}>
                                        Total (Example): {formatNumber(total)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ height: '350px', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut data={chartData} options={options} />
                    </div>
                )}
            </div>
        </div>
    );
}
