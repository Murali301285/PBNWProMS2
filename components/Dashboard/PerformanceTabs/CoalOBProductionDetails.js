'use client';
import SuperTable from '../../Shared/SuperTable';

const formatNumber = (num, decimals = 2) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);

export default function CoalOBProductionDetails({ data = [] }) {

    // Calculate Totals
    const totals = data.reduce((acc, curr) => ({
        Coal_MainPit: acc.Coal_MainPit + (curr.Coal_MainPit || 0),
        Coal_WP3: acc.Coal_WP3 + (curr.Coal_WP3 || 0),
        OB_MainPit: acc.OB_MainPit + (curr.OB_MainPit || 0),
        OB_WP3: acc.OB_WP3 + (curr.OB_WP3 || 0),
        OBRehandling_MainPit: acc.OBRehandling_MainPit + (curr.OBRehandling_MainPit || 0),
        OBRehandling_WP3: acc.OBRehandling_WP3 + (curr.OBRehandling_WP3 || 0),
        CoalRehandling_MainPit: acc.CoalRehandling_MainPit + (curr.CoalRehandling_MainPit || 0),
        CoalRehandling_WP3: acc.CoalRehandling_WP3 + (curr.CoalRehandling_WP3 || 0),
    }), {
        Coal_MainPit: 0, Coal_WP3: 0,
        OB_MainPit: 0, OB_WP3: 0,
        OBRehandling_MainPit: 0, OBRehandling_WP3: 0,
        CoalRehandling_MainPit: 0, CoalRehandling_WP3: 0
    });

    const columns = [
        { header: 'Date', accessor: 'DateDisplay', width: '120px', align: 'center' },

        // Coal Group
        {
            header: 'Coal (MT)',
            columns: [
                { header: 'Main Pit', accessor: 'Coal_MainPit', align: 'right', render: (val) => formatNumber(val, 0) },
                { header: 'WP-3', accessor: 'Coal_WP3', align: 'right', render: (val) => formatNumber(val, 0) },
            ]
        },

        // OB Group
        {
            header: 'OB (BCM)',
            columns: [
                { header: 'Main Pit', accessor: 'OB_MainPit', align: 'right', render: (val) => formatNumber(val, 0) },
                { header: 'WP-3', accessor: 'OB_WP3', align: 'right', render: (val) => formatNumber(val, 0) },
            ]
        },

        // OB Rehandling Group
        {
            header: 'OB Rehandling (BCM)',
            columns: [
                { header: 'Main Pit', accessor: 'OBRehandling_MainPit', align: 'right', render: (val) => formatNumber(val, 0) },
                { header: 'WP-3', accessor: 'OBRehandling_WP3', align: 'right', render: (val) => formatNumber(val, 0) },
            ]
        },

        // Coal Rehandling Group
        {
            header: 'Coal Rehandling (MT)',
            columns: [
                { header: 'Main Pit', accessor: 'CoalRehandling_MainPit', align: 'right', render: (val) => formatNumber(val, 0) },
                { header: 'WP-3', accessor: 'CoalRehandling_WP3', align: 'right', render: (val) => formatNumber(val, 0) },
            ]
        },
    ];

    // Using a custom table render because SuperTable might not support grouped headers easily out of the box
    // or we can just build a standard HTML table for this specific requirement to match the screenshot exactly.
    // The user provided a screenshot with specific grouped headers.

    return (
        <div style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)', overflowX: 'auto' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'blue', marginBottom: '1rem' }}>Coal & OB Production Details</h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: '#f0f4f8', color: '#333' }}>
                        <th rowSpan={2} style={thStyle}>Date</th>
                        <th colSpan={2} style={{ ...thStyle, textAlign: 'center', borderBottom: '1px solid #ddd' }}>Coal (MT)</th>
                        <th colSpan={2} style={{ ...thStyle, textAlign: 'center', borderBottom: '1px solid #ddd' }}>OB (BCM)</th>
                        <th colSpan={2} style={{ ...thStyle, textAlign: 'center', borderBottom: '1px solid #ddd' }}>OB Rehandling (BCM)</th>
                        <th colSpan={2} style={{ ...thStyle, textAlign: 'center', borderBottom: '1px solid #ddd' }}>Coal Rehandling (MT)</th>
                    </tr>
                    <tr style={{ background: '#f0f4f8', color: '#333' }}>
                        <th style={thStyle}>Main Pit</th>
                        <th style={thStyle}>WP-3</th>
                        <th style={thStyle}>Main Pit</th>
                        <th style={thStyle}>WP-3</th>
                        <th style={thStyle}>Main Pit</th>
                        <th style={thStyle}>WP-3</th>
                        <th style={thStyle}>Main Pit</th>
                        <th style={thStyle}>WP-3</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tdStyle}>{row.DateDisplay}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(row.Coal_MainPit, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(row.Coal_WP3, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(row.OB_MainPit, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(row.OB_WP3, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(row.OBRehandling_MainPit, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(row.OBRehandling_WP3, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(row.CoalRehandling_MainPit, 0)}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(row.CoalRehandling_WP3, 0)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '2rem' }}>No Data found</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr style={{ background: '#fffbeb', fontWeight: 'bold', borderTop: '2px solid #ddd' }}>
                        <td style={tdStyle}>Total</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totals.Coal_MainPit, 0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totals.Coal_WP3, 0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totals.OB_MainPit, 0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totals.OB_WP3, 0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totals.OBRehandling_MainPit, 0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totals.OBRehandling_WP3, 0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totals.CoalRehandling_MainPit, 0)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatNumber(totals.CoalRehandling_WP3, 0)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

const thStyle = {
    padding: '10px',
    border: '1px solid #e2e8f0',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '0.85rem'
};

const tdStyle = {
    padding: '8px 10px',
    border: '1px solid #e2e8f0',
    color: '#4a5568'
};
