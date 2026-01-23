'use client';
import SuperTable from '../../Shared/SuperTable';



const formatNumber = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

const COLS = [
    { header: 'S.N.', accessor: 'SN', width: '50px', align: 'center', render: (_, __, index) => index },
    { header: 'Qty (MT/BCM)', accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }, // Generic Header to share Config for demo
    { header: 'Shift', accessor: 'Shift', align: 'center' },
    { header: 'Day', accessor: 'Day' },
    { header: 'Month', accessor: 'Month' },
];

export default function HighestProduction({ data = [] }) {

    // Filter Helper
    const getData = (category) => data.filter(d => d.Category === category);

    // 5 Tables Vertically
    const tables = [
        { title: '5 Highest Coal Production', unit: 'Coal (MT)', data: getData('Coal') },
        { title: '5 Highest OB Production', unit: 'OB (BCM)', data: getData('OB') },
        { title: '5 Highest Electrical Loading Production', unit: 'OB (BCM)', data: getData('Electrical') },
        { title: '5 Highest Dispatch Production', unit: 'Coal (MT)', data: getData('Dispatch') },
        { title: '5 Highest Crushing Production', unit: 'Coal (MT)', data: getData('Crushing') },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            {tables.map((tbl, idx) => (
                <div key={idx} style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'blue', marginBottom: '1rem' }}>{tbl.title}</h2>
                    {/* Modifying Columns to match specific Unit header */}
                    <SuperTable
                        columns={COLS.map(c => c.accessor === 'Qty' ? { ...c, header: tbl.unit } : c)}
                        data={tbl.data}
                        showPagination={false} // Top 5 usually fixed
                        showSearch={false}
                        pageSizeDefault={5}
                        title={tbl.title}
                    />
                </div>
            ))}
        </div>
    );
}
