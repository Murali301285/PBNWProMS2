'use client';
import SuperTable from '../../Shared/SuperTable';

// Same structure as Crusher Wise but for Sectors
// Data passed via props

const formatNumber = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

const COLS = [
    { header: 'Plant', accessor: 'Plant', align: 'left' },
    { header: 'OB Qty. (BCM)', accessor: 'OBQty', align: 'right', render: (val) => formatNumber(val || 0) },
    { header: 'Coal Qty. (MT)', accessor: 'CoalQty', align: 'right', render: (val) => formatNumber(val || 0) }
];

export default function SectorWise({ data = [] }) {
    const totalOB = data.reduce((acc, curr) => acc + (curr.OBQty || 0), 0);
    const totalCoal = data.reduce((acc, curr) => acc + (curr.CoalQty || 0), 0);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'blue' }}>Sector Wise Production Details</h2>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)', minHeight: '400px' }}>
                <SuperTable columns={COLS} data={data} title="Sector Wise Production" pageSizeDefault={10} />
                <div style={{
                    marginTop: '1rem',
                    padding: '10px 20px',
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '4rem',
                    fontWeight: 'bold'
                }}>
                    <span>Total OB: {formatNumber(totalOB)} BCM</span>
                    <span>Total Coal: {formatNumber(totalCoal)} MT</span>
                </div>
            </div>
        </div>
    );
}
