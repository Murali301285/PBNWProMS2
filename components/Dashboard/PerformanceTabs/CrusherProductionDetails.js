'use client';

const formatNumber = (num, decimals = 0) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);

export default function CrusherProductionDetails({ data = [] }) {

    // Calculate Total
    const totalQty = data.reduce((acc, curr) => acc + (curr.TotalQty || 0), 0);

    return (
        <div style={{ background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'blue', marginBottom: '1rem', textAlign: 'center' }}>Crusher Production Details</h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                <thead>
                    <tr style={{ background: '#e2e8f0', color: '#333' }}>
                        <th style={thStyle}>Plant</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Crushed Qty. (MT)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tdStyle}>{row.PlantName}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{formatNumber(row.TotalQty)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={2} style={{ ...tdStyle, textAlign: 'center', padding: '2rem' }}>No Data found</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr style={{ background: '#fffbeb', fontWeight: 'bold', borderTop: '2px solid #ddd' }}>
                        <td style={{ ...tdStyle, textAlign: 'right', paddingRight: '20px' }}>Total</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{formatNumber(totalQty)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

const thStyle = {
    padding: '12px',
    border: '1px solid #333',
    textAlign: 'left',
    fontWeight: 'bold',
    background: '#d1d5db'
};

const tdStyle = {
    padding: '10px',
    border: '1px solid #ccc',
    color: '#333'
};
