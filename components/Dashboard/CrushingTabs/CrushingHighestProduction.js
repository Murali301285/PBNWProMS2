'use client';
import SuperTable from '../../Shared/SuperTable';

const formatNumber = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

export default function CrushingHighestProduction({ data = [] }) {

    // Helper: Get data for specific Plant and Period
    const getData = (plant, period) => {
        // Data structure from SP: { PeriodType, Category (PlantName), Date, Shift, Qty }
        return data.filter(d => d.Category === plant && d.PeriodType === period);
    };

    // Render logic for a single Table
    const renderTable = (title, periodData, columns) => (
        <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#555', marginBottom: '0.5rem' }}>{title}</h4>
            <SuperTable
                columns={columns}
                data={periodData}
                showPagination={false}
                showSearch={false}
                pageSizeDefault={5}
                title={title}
            />
        </div>
    );

    // Columns Definitions
    const getColumns = (unit, period) => {
        const base = [
            { header: 'SlNo', accessor: 'SN', width: '50px', align: 'center', render: (_, __, index) => index + 1 },
            { header: unit, accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) },
        ];

        if (period === 'Shift') {
            return [
                { header: 'SlNo', accessor: 'SN', width: '50px', align: 'center', render: (_, __, index) => index + 1 },
                { header: 'Date', accessor: 'Date', render: (val) => val ? new Date(val).toLocaleDateString('en-GB') : '-' },
                { header: 'Shift', accessor: 'Shift', align: 'center' },
                { header: unit, accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }
            ];
        } else if (period === 'Day') {
            return [
                { header: 'SlNo', accessor: 'SN', width: '50px', align: 'center', render: (_, __, index) => index + 1 },
                { header: 'Date', accessor: 'Date', render: (val) => val ? new Date(val).toLocaleDateString('en-GB') : '-' },
                { header: unit, accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }
            ];
        } else if (period === 'Month') {
            return [
                { header: 'SlNo', accessor: 'SN', width: '50px', align: 'center', render: (_, __, index) => index + 1 },
                { header: 'Month', accessor: 'Date' }, // SP sets Date column to Month String for 'Month' period
                { header: unit, accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }
            ];
        }
        return base;
    };

    const sections = [
        { title: 'Highest Production -> PSS 1 (MT)', plant: 'PSS-1', unit: 'Production (MT)' },
        { title: 'Highest Production -> PSS 2 (MT)', plant: 'PSS-2', unit: 'Production (MT)' },
        { title: 'Highest Production -> PSS 3 (MT)', plant: 'PSS-3', unit: 'Production (MT)' },
        { title: 'Highest Production -> IPCC (MT)', plant: 'IPCC', unit: 'Production (MT)' }, // Mapped from ICP
        { title: 'Highest Production -> WP-3 (MT)', plant: 'WP-3', unit: 'Production (MT)' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {sections.map((sec, idx) => (
                <div key={idx} style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'blue', marginBottom: '1rem' }}>{sec.title}</h2>

                    {/* Shift Wise */}
                    {renderTable('Shift Wise', getData(sec.plant, 'Shift'), getColumns(sec.unit, 'Shift'))}

                    {/* Day Wise */}
                    {renderTable('Day Wise', getData(sec.plant, 'Day'), getColumns(sec.unit, 'Day'))}

                    {/* Month Wise */}
                    {renderTable('Month Wise', getData(sec.plant, 'Month'), getColumns(sec.unit, 'Month'))}
                </div>
            ))}
        </div>
    );
}
