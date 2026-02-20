'use client';
import React, { useState, useEffect } from 'react';
import Loader from '../Shared/Loader';

const formatNumber = (num) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);

export default function DrillingDetailsTable({ date }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/dashboard/drilling/details?date=${date}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [date]);

    // Grouping Logic
    const groupedData = data.reduce((acc, row) => {
        const material = row.Material || 'Unknown';
        if (!acc[material]) acc[material] = [];
        acc[material].push(row);
        return acc;
    }, {});

    const materials = Object.keys(groupedData);

    // Calculate Grand Total
    const getAvg = (list, key) => {
        const sum = list.reduce((s, i) => s + (Number(i[key]) || 0), 0);
        return list.length ? sum / list.length : 0;
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{
                background: 'white', borderRadius: '8px',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0'
            }}>
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                        MIS Drilling Details - {new Date(date).toLocaleDateString('en-GB')}
                    </h2>
                </div>

                {/* Content */}
                <div style={{ padding: '1rem', overflowX: 'auto', flex: 1 }}>
                    {loading ? <Loader text="Loading Details..." /> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                                <tr style={{ background: '#e2e8f0' }}>
                                    <th style={thStyle}>Drilling Date</th>
                                    <th style={thStyle}>Material</th>
                                    <th style={thStyle}>Drilling Patch Id</th>
                                    <th style={thStyle}>Location</th>
                                    <th style={thStyle}>Agency</th>
                                    <th style={thStyle}>Remark</th>
                                    <th style={thStyleRight}>No of Holes</th>
                                    <th style={thStyleRight}>Total Meters</th>
                                    <th style={thStyleRight}>Spacing (m)</th>
                                    <th style={thStyleRight}>Burden (m)</th>
                                    <th style={thStyleRight}>Avg Depth (m)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map(mat => {
                                    const rows = groupedData[mat];
                                    const subTotalHoles = rows.reduce((s, r) => s + (Number(r.NoofHoles) || 0), 0);
                                    const subTotalMeters = rows.reduce((s, r) => s + (Number(r.TotalMeters) || 0), 0);

                                    const avgSpacing = getAvg(rows, 'Spacing');
                                    const avgBurden = getAvg(rows, 'Burden');
                                    const avgDepth = getAvg(rows, 'AvgDepth');

                                    return (
                                        <React.Fragment key={mat}>
                                            {rows.map((row, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={tdStyle}>{idx === 0 ? new Date(row.DrillingDate).toLocaleDateString('en-GB') : ''}</td>
                                                    <td style={tdStyle}>{idx === 0 ? mat : ''}</td>
                                                    <td style={tdStyle}>{row.DrillingPatchId}</td>
                                                    <td style={tdStyle}>{row.Location}</td>
                                                    <td style={tdStyle}>{row.Agency}</td>
                                                    <td style={tdStyle}>{row.Remarks}</td>
                                                    <td style={tdStyleRight}>{row.NoofHoles}</td>
                                                    <td style={tdStyleRight}>{formatNumber(row.TotalMeters)}</td>
                                                    <td style={tdStyleRight}>{formatNumber(row.Spacing)}</td>
                                                    <td style={tdStyleRight}>{formatNumber(row.Burden)}</td>
                                                    <td style={tdStyleRight}>{formatNumber(row.AvgDepth)}</td>
                                                </tr>
                                            ))}
                                            {/* Subtotal Row */}
                                            <tr style={{ background: '#fce7f3', fontWeight: 700 }}>
                                                <td colSpan={1}></td>
                                                <td style={tdStyle} colSpan={5}>{mat} Total</td>
                                                <td style={tdStyleRight}>{subTotalHoles}</td>
                                                <td style={tdStyleRight}>{formatNumber(subTotalMeters)}</td>
                                                <td style={tdStyleRight}>{formatNumber(avgSpacing)}</td>
                                                <td style={tdStyleRight}>{formatNumber(avgBurden)}</td>
                                                <td style={tdStyleRight}>{formatNumber(avgDepth)}</td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}

                                {/* Grand Total */}
                                {data.length > 0 && (
                                    <tr style={{ background: '#fef08a', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                                        <td style={tdStyle} colSpan={6}>Grand Total</td>
                                        <td style={tdStyleRight}>
                                            {data.reduce((s, r) => s + (Number(r.NoofHoles) || 0), 0)}
                                        </td>
                                        <td style={tdStyleRight}>
                                            {formatNumber(data.reduce((s, r) => s + (Number(r.TotalMeters) || 0), 0))}
                                        </td>
                                        <td style={tdStyleRight}>{formatNumber(getAvg(data, 'Spacing'))}</td>
                                        <td style={tdStyleRight}>{formatNumber(getAvg(data, 'Burden'))}</td>
                                        <td style={tdStyleRight}>{formatNumber(getAvg(data, 'AvgDepth'))}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

const thStyle = { padding: '10px', textAlign: 'left', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, color: '#334155' };
const thStyleRight = { ...thStyle, textAlign: 'right' };
const tdStyle = { padding: '8px', border: '1px solid #e2e8f0', color: '#334155' };
const tdStyleRight = { ...tdStyle, textAlign: 'right' };
