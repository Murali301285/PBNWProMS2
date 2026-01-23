'use client';
import { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import SuperTable from '../../Shared/SuperTable';
import { Table, PieChart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

// Same structure as Crusher Wise but for Sectors
// Data passed via props

const formatNumber = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

const COLS = [
    { header: 'Sector', accessor: 'Plant' },
    { header: 'Production (MT)', accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }
];

export default function SectorWise({ data = [] }) {
    const [viewMode, setViewMode] = useState('data');

    const total = data.reduce((acc, curr) => acc + curr.Qty, 0);

    const chartData = {
        labels: data.map(d => d.Plant),
        datasets: [{
            data: data.map(d => d.Qty),
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
                        return `${context.label}: ${val} MT (${pct}%)`;
                    }
                }
            }
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'blue' }}>Sector Wise Production Details</h2>

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
                    <>
                        <SuperTable columns={COLS} data={data} title="Sector Wise Production" pageSizeDefault={10} />
                        <div style={{ marginTop: '1rem', padding: '10px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', textAlign: 'right', fontWeight: 'bold' }}>
                            Total: {total.toLocaleString()} MT
                        </div>
                    </>
                ) : (
                    <div style={{ height: '350px', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut data={chartData} options={options} />
                    </div>
                )}
            </div>
        </div>
    );
}
