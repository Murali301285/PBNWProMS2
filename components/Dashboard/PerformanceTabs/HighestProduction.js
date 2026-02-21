'use client';
import SuperTable from '../../Shared/SuperTable';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import styles from '../../../app/dashboard/page.module.css';



const formatNumber = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

const COLS = [
    { header: 'S.N.', accessor: 'SN', width: '50px', align: 'center', render: (_, __, index) => index },
    { header: 'Qty (MT/BCM)', accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }, // Generic Header to share Config for demo
    { header: 'Shift', accessor: 'Shift', align: 'center' },
    { header: 'Day', accessor: 'Day' },
    { header: 'Month', accessor: 'Month' },
];

export default function HighestProduction({ data = [] }) {

    const handleDownloadExcel = () => {
        if (!data || data.length === 0) return;

        const exportData = data.map((d, i) => ({
            'SlNo': i + 1,
            'Category': d.Category,
            'Period Type': d.PeriodType,
            'Date/Month': d.Date ? new Date(d.Date).toLocaleDateString('en-IN') : (d.Month || '-'),
            'Shift': d.Shift || '-',
            'Quantity': d.Qty
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Highest Production');
        XLSX.writeFile(wb, 'Performance_Highest_Production.xlsx');
    };

    // Helper: Get data for specific Category and Period
    const getData = (category, period) => {
        return data.filter(d => d.Category === category && d.PeriodType === period);
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
                showExport={false}
                pageSizeDefault={5}
                title={title}
            />
        </div>
    );

    // Columns Definitions (Dynamic based on logic)
    const getColumns = (unit, period) => {
        const base = [
            { header: 'SlNo', accessor: 'SN', width: '50px', align: 'center' },
            { header: unit, accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) },
        ];

        if (period === 'Shift') {
            return [
                { header: 'SlNo', accessor: 'SN', width: '50px', align: 'center' },
                { header: 'Date', accessor: 'Date', render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-' },
                { header: 'Shift', accessor: 'Shift', align: 'center' },
                { header: unit, accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }
            ];
        } else if (period === 'Day') {
            return [
                { header: 'SlNo', accessor: 'SN', width: '50px', align: 'center' },
                { header: 'Date', accessor: 'Date', render: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-' },
                { header: unit, accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }
            ];
        } else if (period === 'Month') {
            return [
                { header: 'SlNo', accessor: 'SN', width: '50px', align: 'center' },
                { header: 'Month', accessor: 'Month' },
                { header: unit, accessor: 'Qty', align: 'right', render: (val) => formatNumber(val) }
            ];
        }
        return base;
    };


    const sections = [
        { title: 'Highest Coal (MT) Production', category: 'Coal', unit: 'Production (MT)' },
        { title: 'Highest OB (BCM) Removal', category: 'OB', unit: 'Production (BCM)' },
        { title: 'Highest Electrical Loading Production OB (BCM)', category: 'Electrical', unit: 'Production (BCM)' },
        { title: 'Highest Coal Dispatch (MT)', category: 'Dispatch', unit: 'Production (MT)' },
        { title: 'Highest Coal Crushing (MT)', category: 'Crushing', unit: 'Production (MT)' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 1rem' }}>
                <button onClick={handleDownloadExcel} className={`${styles.iconButton} ${styles.btnGreen}`} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                    <Download size={16} /> Export Excel
                </button>
            </div>

            {sections.map((sec, idx) => (
                <div key={idx} style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'blue', marginBottom: '1rem' }}>{sec.title}</h2>

                    {/* Shift Wise */}
                    {renderTable('Shift Wise', getData(sec.category, 'Shift'), getColumns(sec.unit, 'Shift'))}

                    {/* Day Wise */}
                    {renderTable('Day Wise', getData(sec.category, 'Day'), getColumns(sec.unit, 'Day'))}

                    {/* Month Wise */}
                    {renderTable('Month Wise', getData(sec.category, 'Month'), getColumns(sec.unit, 'Month'))}
                </div>
            ))}
        </div>
    );
}
