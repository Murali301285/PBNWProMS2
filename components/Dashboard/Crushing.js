'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw, BarChart3, LineChart, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

import CrushingHighestProduction from './CrushingTabs/CrushingHighestProduction';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

import StoppagePareto from './Charts/StoppagePareto';
import html2canvas from 'html2canvas';
import { utils, writeFile } from 'xlsx';
import { toast } from 'sonner';
import styles from '../../app/dashboard/page.module.css';

export default function Crushing() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return {
            from: `${y}-${m}-01`,
            to: `${y}-${m}-${d}`
        };
    });
    const [viewMode, setViewMode] = useState('cumulative'); // cumulative | comprehensive
    const [chartType, setChartType] = useState('bar'); // bar | line
    const [hiddenShifts, setHiddenShifts] = useState([]);
    const [hiddenCrushers, setHiddenCrushers] = useState([]);
    const [highestProductionData, setHighestProductionData] = useState([]);

    // Table State
    // Table State (Production)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    // Table State (Stoppage)
    const [stoppagePage, setStoppagePage] = useState(1);
    const [stoppagePageSize, setStoppagePageSize] = useState(10);
    const [stoppageSearch, setStoppageSearch] = useState('');
    const [selectedStoppagePlant, setSelectedStoppagePlant] = useState('All');


    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/crushing?fromDate=${dateRange.from}&toDate=${dateRange.to}`);
            const json = await res.json();

            if (json.success) {
                setData({
                    transactions: json.transactions,
                    stoppages: json.stoppages,
                    stoppageLog: json.stoppageLog
                });

                // Fetch Production Overview
                const resProd = await fetch(`/api/dashboard/crushing/production-overview?fromDate=${dateRange.from}&toDate=${dateRange.to}`);
                const jsonProd = await resProd.json();
                if (jsonProd.success) {
                    setHighestProductionData(jsonProd.data);
                }
            } else {
                toast.error(json.message || 'Failed to fetch data');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setCurrentPage(1); // Reset page on refresh
    }, [dateRange]);

    // Data Processing for Charts
    const processChartData = () => {
        if (!data?.transactions) return null;

        const transactions = data.transactions.filter(t =>
            !hiddenCrushers.includes(t.CrusherName)
        );

        const crushers = [...new Set(transactions.map(t => t.CrusherName))].sort();
        const shifts = ['Shift A', 'Shift B', 'Shift C'];
        const dates = [...new Set(transactions.map(t => t.Date))].sort();

        if (viewMode === 'cumulative') {
            // X-Axis: Crusher Name
            // Grouped Bars (Unstacked): Shifts
            const datasets = shifts.map((shift, index) => {
                // Do NOT return null here. Return the dataset but mark as hidden.
                // This ensures it stays in the legend.
                return {
                    label: shift,
                    data: crushers.map(c => {
                        const items = transactions.filter(t => t.CrusherName === c && t.Shift === shift);
                        return items.reduce((sum, curr) => sum + curr.Qty, 0);
                    }),
                    backgroundColor: ['#60a5fa', '#34d399', '#f87171'][index], // Colors for Shift A, B, C
                    // stack: 'total', // REMOVED to make it Grouped (Individual Bars)
                    hidden: hiddenShifts.includes(shift), // Controlled visibility
                };
            });

            return {
                labels: crushers,
                datasets
            };
        } else {
            // Comprehensive (Date-wise)
            // X-Axis: Date
            // Legend: Crusher Name
            // In this mode, if we hide a Crusher, it IS removed from the data logic above (transactions.filter).
            // BUT for the Legend to work comfortably as a toggle, we might want to keep it in datasets but hidden?
            // However, the X-Axis depends on the filtered data?
            // Actually, if we use `hiddenCrushers` state to filter the `transactions` array at the top,
            // then `crushers` array won't have it, so no dataset is created.
            // Let's refactor: Don't filter `transactions` by `hiddenCrushers` at the top level if we want the legend item to persist.

            // Re-calculate based on FULL data for legends
            const allTransactions = data.transactions;
            const allCrushers = [...new Set(allTransactions.map(t => t.CrusherName))].sort();
            const allDates = [...new Set(allTransactions.map(t => t.Date))].sort();

            const datasets = allCrushers.map((crusher, index) => {
                return {
                    label: crusher,
                    data: allDates.map(d => {
                        const items = allTransactions.filter(t => t.Date === d && t.CrusherName === crusher);
                        return items.reduce((sum, curr) => sum + curr.Qty, 0);
                    }),
                    borderColor: `hsl(${index * 60}, 70%, 50%)`,
                    backgroundColor: `hsl(${index * 60}, 70%, 50%, 0.5)`,
                    tension: 0.3,
                    hidden: hiddenCrushers.includes(crusher)
                };
            });
            return {
                labels: allDates,
                datasets
            };
        }
    };

    const chartData = processChartData();

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                onClick: (e, legendItem, legend) => {
                    const index = legendItem.datasetIndex;
                    const ci = legend.chart;
                    const label = legendItem.text;

                    if (ci.isDatasetVisible(index)) {
                        ci.hide(index);
                        legendItem.hidden = true;
                        if (viewMode === 'cumulative') {
                            setHiddenShifts(prev => [...prev, label]);
                        } else {
                            // In comprehensive, label is Crusher Name
                            setHiddenCrushers(prev => [...prev, label]);
                        }
                    } else {
                        ci.show(index);
                        legendItem.hidden = false;
                        if (viewMode === 'cumulative') {
                            setHiddenShifts(prev => prev.filter(s => s !== label));
                        } else {
                            setHiddenCrushers(prev => prev.filter(c => c !== label));
                        }
                    }
                }
            },
            title: {
                display: true,
                text: viewMode === 'cumulative' ? 'Production Summary (Shift-wise)' : 'Production Trend (Date-wise)',
            },
        },
        scales: {
            x: {
                // stacked: viewMode === 'cumulative' && chartType === 'bar', // REMOVED -> Grouped Bars
            },
            y: {
                // stacked: viewMode === 'cumulative' && chartType === 'bar', // REMOVED
                title: { display: true, text: 'Quantity (MT)' }
            }
        }
    };

    // Prepare Pivoted Data for Table & Excel
    const preparePivotedData = () => {
        if (!data?.transactions) return [];

        const grouped = {};

        data.transactions.forEach(t => {
            // Apply Filters (Visually hide from table if filtered in chart? 
            // User requirement didn't explicitly say filters apply to table in this new view, 
            // but generally consistency is good. Let's keep filters.)
            if (hiddenCrushers.includes(t.CrusherName)) return;

            const key = `${t.Date}_${t.CrusherName}`;
            if (!grouped[key]) {
                grouped[key] = {
                    Date: t.Date,
                    CrusherName: t.CrusherName,
                    ShiftAQty: 0,
                    ShiftBQty: 0,
                    ShiftCQty: 0,
                    TotalQty: 0,
                    Remarks: []
                };
            }

            // Normalize shift name check (DB returns SHIFT-A, Loop checks Shift A)
            const s = t.Shift.toUpperCase().replace('-', ' '); // Converts 'SHIFT-A' -> 'SHIFT A', 'Shift A' -> 'SHIFT A'

            if (s.includes('SHIFT A')) grouped[key].ShiftAQty += t.Qty;
            if (s.includes('SHIFT B')) grouped[key].ShiftBQty += t.Qty;
            if (s.includes('SHIFT C')) grouped[key].ShiftCQty += t.Qty;
            grouped[key].TotalQty += t.Qty;

            if (t.Remarks) {
                grouped[key].Remarks.push(`${t.Shift}: ${t.Remarks}`);
            }
        });

        return Object.values(grouped).sort((a, b) => {
            if (a.Date !== b.Date) return a.Date.localeCompare(b.Date);
            return a.CrusherName.localeCompare(b.CrusherName);
        });
    };

    const pivotedData = preparePivotedData();

    // -- Pagination & Filtering Logic --
    const filteredData = pivotedData.filter(row => {
        const query = searchQuery.toLowerCase();
        return (
            row.Date.toLowerCase().includes(query) ||
            row.CrusherName.toLowerCase().includes(query) ||
            row.Remarks.some(r => r.toLowerCase().includes(query))
        );
    });

    const isAll = pageSize === 'All';
    const totalPages = isAll ? 1 : Math.ceil(filteredData.length / pageSize);
    const paginatedData = isAll
        ? filteredData
        : filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Reset page if search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, pageSize]);


    // Excel Download Handler
    const handleDownloadExcel = () => {
        if (!pivotedData || pivotedData.length === 0) {
            toast.error("No data available to export.");
            return;
        }

        const wb = utils.book_new();

        // --- Sheet 1: Detailed Data ---
        const dataToExport = filteredData;

        // Map for Excel
        const excelRows = dataToExport.map((row, idx) => ({
            'Sl No': idx + 1,
            'Date': row.Date,
            'Crusher Name': row.CrusherName,
            'Shift A Qty': row.ShiftAQty,
            'Shift B Qty': row.ShiftBQty,
            'Shift C Qty': row.ShiftCQty,
            'Total Qty': row.TotalQty,
            'Remarks': row.Remarks.join('; ')
        }));

        const wsData = utils.json_to_sheet(excelRows);
        utils.book_append_sheet(wb, wsData, 'Production Data');


        // --- Sheet 2: Highest Production ---
        if (highestProductionData && highestProductionData.length > 0) {
            // Flatten the highestProductionData for Excel since it's segmented by PeriodType and Category
            const hpExport = highestProductionData.map((row, idx) => ({
                'Sl No': idx + 1,
                'Plant / Category': row.Category,
                'Period Type': row.PeriodType,
                'Date/Month': row.Date || row.Month || '-',
                'Shift': row.Shift || '-',
                'Quantity (MT)': row.Qty
            }));
            const wsHp = utils.json_to_sheet(hpExport);
            utils.book_append_sheet(wb, wsHp, 'Highest Production');
        }


        // --- Sheet 3: Stoppages ---
        if (data.stoppages?.length > 0) {
            const wsStop = utils.json_to_sheet(data.stoppages);
            utils.book_append_sheet(wb, wsStop, 'Stoppage Summary');
        }

        writeFile(wb, `Crushing_Report_${dateRange.from}_to_${dateRange.to}.xlsx`);
        toast.success('Excel Downloaded');
    };

    if (loading && !data) return <div className="p-8 text-white">Loading Dashboard...</div>;


    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1>Crushing Dashboard</h1>
                <div className={styles.controls} style={{ gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--card)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>From:</span>
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                            className={styles.dateInput}
                            style={{ border: 'none', background: 'transparent' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--card)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>To:</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                            className={styles.dateInput}
                            style={{ border: 'none', background: 'transparent' }}
                        />
                    </div>

                    <button onClick={fetchData} className={`${styles.iconButton} ${styles.btnBlue}`}>
                        <RefreshCw size={18} /> Show
                    </button>
                    <button onClick={handleDownloadExcel} className={`${styles.iconButton} ${styles.btnGreen}`}>
                        <Download size={18} /> Download Excel
                    </button>
                </div>
            </div>


            <div style={{ padding: '1rem' }}>

                {/* Section 1: Production Overview */}
                <section>
                    <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>1. Production Overview</span>
                    </div>

                    {/* Highest Production Tables */}
                    <div className={styles.chartContainer} style={{ height: 'auto', minHeight: 'auto', marginBottom: '1.5rem', background: '#f8fafc', padding: '0' }}>
                        <CrushingHighestProduction data={highestProductionData} />
                    </div>
                </section>

                <section>

                    {/* Dynamic Data Table */}
                    <div className={styles.chartContainer} style={{ height: 'auto', minHeight: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>Detailed Data</h3>

                                {/* Search Input */}
                                <div style={{ position: 'relative', width: '250px' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search date, crusher..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '6px 10px 6px 30px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--background)',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {/* Page Size Selector */}
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '0.85rem' }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value="All">All</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className={styles.detailTable} style={{ border: '1px solid var(--border)' }}>
                                <thead>
                                    <tr>
                                        <th rowSpan="2" style={{ verticalAlign: 'middle', width: '50px', borderRight: '1px solid var(--border)' }}>Sl No</th>
                                        <th rowSpan="2" style={{ verticalAlign: 'middle', borderRight: '1px solid var(--border)' }}>Date</th>
                                        <th rowSpan="2" style={{ verticalAlign: 'middle', borderRight: '1px solid var(--border)' }}>Crusher Name</th>
                                        <th colSpan="4" style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>Quantity (MT)</th>
                                        <th rowSpan="2" style={{ verticalAlign: 'middle' }}>Remarks</th>
                                    </tr>
                                    <tr>
                                        <th style={{ textAlign: 'center', fontSize: '0.85em', color: 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>Shift A</th>
                                        <th style={{ textAlign: 'center', fontSize: '0.85em', color: 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>Shift B</th>
                                        <th style={{ textAlign: 'center', fontSize: '0.85em', color: 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>Shift C</th>
                                        <th style={{ textAlign: 'center', fontSize: '0.85em', fontWeight: 700, borderRight: '1px solid var(--border)' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((row, idx) => (
                                            <tr key={idx}>
                                                <td style={{ textAlign: 'center', color: 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>
                                                    {isAll ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                                                </td>
                                                <td style={{ borderRight: '1px solid var(--border)' }}>{row.Date}</td>
                                                <td style={{ fontWeight: 500, borderRight: '1px solid var(--border)' }}>{row.CrusherName}</td>

                                                {/* Shift A */}
                                                <td style={{ textAlign: 'right', color: row.ShiftAQty > 0 ? 'inherit' : 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>
                                                    {row.ShiftAQty > 0 ? row.ShiftAQty : '-'}
                                                </td>

                                                {/* Shift B */}
                                                <td style={{ textAlign: 'right', color: row.ShiftBQty > 0 ? 'inherit' : 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>
                                                    {row.ShiftBQty > 0 ? row.ShiftBQty : '-'}
                                                </td>

                                                {/* Shift C */}
                                                <td style={{ textAlign: 'right', color: row.ShiftCQty > 0 ? 'inherit' : 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>
                                                    {row.ShiftCQty > 0 ? row.ShiftCQty : '-'}
                                                </td>

                                                {/* Total */}
                                                <td style={{ textAlign: 'right', fontWeight: 700, background: 'var(--muted)', borderRadius: '4px', borderRight: '1px solid var(--border)' }}>
                                                    {row.TotalQty}
                                                </td>

                                                <td style={{ color: 'var(--muted-foreground)', fontSize: '0.9em' }}>
                                                    {row.Remarks.map((r, i) => <div key={i}>{r}</div>)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                                No data found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {!isAll && filteredData.length > pageSize && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0 0.5rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: currentPage === 1 ? 'var(--muted)' : 'var(--card)', cursor: currentPage === 1 ? 'default' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                                    >
                                        <ChevronsLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: currentPage === 1 ? 'var(--muted)' : 'var(--card)', cursor: currentPage === 1 ? 'default' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '0.9rem', fontWeight: 500 }}>
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: currentPage === totalPages ? 'var(--muted)' : 'var(--card)', cursor: currentPage === totalPages ? 'default' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: currentPage === totalPages ? 'var(--muted)' : 'var(--card)', cursor: currentPage === totalPages ? 'default' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                                    >
                                        <ChevronsRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Section 2: Stoppage Analysis */}
                <section style={{ marginTop: '2rem' }}>
                    <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>2. Stoppage Analysis</span>

                        {/* Plant Filter Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Plant:</span>
                            <select
                                value={selectedStoppagePlant}
                                onChange={(e) => {
                                    setSelectedStoppagePlant(e.target.value);
                                    setStoppagePage(1); // Reset pagination
                                }}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    background: 'var(--card)',
                                    fontSize: '0.85rem',
                                    minWidth: '120px'
                                }}
                            >
                                <option value="All">All</option>
                                {/* Derive unique crusher names from loaded data */}
                                {data?.stoppages && [...new Set(data.stoppages.map(s => s.CrusherName))].sort().map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Chart Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

                        {/* Summary Chart (Pareto) */}
                        <div className={styles.chartContainer} style={{ minHeight: '350px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--foreground)' }}>Stoppage Reasons (Hrs)</h3>
                            {data?.stoppages && (() => {
                                // Filter data based on selected plant
                                const filteredStoppages = selectedStoppagePlant === 'All'
                                    ? data.stoppages
                                    : data.stoppages.filter(s => s.CrusherName === selectedStoppagePlant);

                                return <StoppagePareto data={filteredStoppages} />;
                            })()}
                        </div>

                        {/* Summary Chart (Donut - Crusher Wise) */}
                        <div className={styles.chartContainer} style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', alignSelf: 'flex-start', color: 'var(--foreground)' }}>Stoppage by Crusher</h3>
                            {data?.stoppages && (() => {
                                // Filter data based on selected plant
                                const filteredStoppages = selectedStoppagePlant === 'All'
                                    ? data.stoppages
                                    : data.stoppages.filter(s => s.CrusherName === selectedStoppagePlant);

                                // Aggregate duration by crusher
                                const crusherMap = {};
                                filteredStoppages.forEach(s => {
                                    crusherMap[s.CrusherName] = (crusherMap[s.CrusherName] || 0) + s.TotalDuration;
                                });
                                const labels = Object.keys(crusherMap);
                                const values = Object.values(crusherMap);

                                const donutData = {
                                    labels: labels,
                                    datasets: [{
                                        data: values,
                                        backgroundColor: [
                                            '#60a5fa', // Blue
                                            '#34d399', // Green
                                            '#f87171', // Red
                                            '#fbbf24', // Amber
                                            '#a78bfa'  // Purple
                                        ],
                                        borderWidth: 1
                                    }]
                                };
                                const donutOptions = {
                                    plugins: {
                                        legend: { position: 'right' }
                                    },
                                    cutout: '60%'
                                };

                                return <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                    <Doughnut data={donutData} options={donutOptions} />
                                </div>
                            })()}
                        </div>
                    </div>

                    {/* Detailed Log Table Container */}
                    <div className={styles.chartContainer} style={{ height: 'auto', minHeight: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>Stoppage Logs</h3>

                                {/* Search Input */}
                                <div style={{ position: 'relative', width: '250px' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={stoppageSearch}
                                        onChange={(e) => setStoppageSearch(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '6px 10px 6px 30px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--background)',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Page Size & Export */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <select
                                    value={stoppagePageSize}
                                    onChange={(e) => setStoppagePageSize(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '0.85rem' }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value="All">All</option>
                                </select>
                            </div>
                        </div>

                        {/* Table Logic Calculation */}
                        {(() => {
                            const stopFiltered = data?.stoppageLog?.filter(row => {
                                // Plant Filter
                                if (selectedStoppagePlant !== 'All' && row.CrusherName !== selectedStoppagePlant) return false;

                                const q = stoppageSearch.toLowerCase();
                                return (
                                    row.CrusherName.toLowerCase().includes(q) ||
                                    row.Reason.toLowerCase().includes(q)
                                );
                            }) || [];

                            const isAllStop = stoppagePageSize === 'All';
                            const totalStopPages = isAllStop ? 1 : Math.ceil(stopFiltered.length / stoppagePageSize);
                            const paginatedStop = isAllStop
                                ? stopFiltered
                                : stopFiltered.slice((stoppagePage - 1) * stoppagePageSize, stoppagePage * stoppagePageSize);

                            // Reset page effect (needs to be outside but for inline render simplified here, 
                            // ideally logic should be above return. For now, assuming user interaction resets it manually or we add Effect above)

                            return (
                                <>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className={styles.detailTable} style={{ border: '1px solid var(--border)' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ borderRight: '1px solid var(--border)' }}>SlNo</th>
                                                    <th style={{ borderRight: '1px solid var(--border)' }}>Date</th>
                                                    <th style={{ borderRight: '1px solid var(--border)' }}>Crusher Name</th>
                                                    <th style={{ borderRight: '1px solid var(--border)' }}>Stoppage Reason</th>
                                                    <th style={{ borderRight: '1px solid var(--border)' }}>From Time</th>
                                                    <th style={{ borderRight: '1px solid var(--border)' }}>To Time</th>
                                                    <th style={{ textAlign: 'right' }}>Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedStop.map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ textAlign: 'center', color: 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>
                                                            {row.SlNo}
                                                        </td>
                                                        <td style={{ borderRight: '1px solid var(--border)' }}>{row.Date}</td>
                                                        <td style={{ fontWeight: 500, borderRight: '1px solid var(--border)' }}>{row.CrusherName}</td>
                                                        <td style={{ borderRight: '1px solid var(--border)' }}>
                                                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em', background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>
                                                                {row.Reason}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>{row.FromTime}</td>
                                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'var(--muted-foreground)', borderRight: '1px solid var(--border)' }}>{row.ToTime}</td>
                                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{row.Duration}</td>
                                                    </tr>
                                                ))}
                                                {paginatedStop.length === 0 && (
                                                    <tr>
                                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No logs found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls (Stoppage) */}
                                    {!isAllStop && stopFiltered.length > stoppagePageSize && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0 0.5rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                                                Showing {((stoppagePage - 1) * stoppagePageSize) + 1} to {Math.min(stoppagePage * stoppagePageSize, stopFiltered.length)} of {stopFiltered.length} entries
                                            </div>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={() => setStoppagePage(1)} disabled={stoppagePage === 1} className={styles.iconButton} style={{ padding: '6px', opacity: stoppagePage === 1 ? 0.5 : 1 }}>
                                                    <ChevronsLeft size={16} />
                                                </button>
                                                <button onClick={() => setStoppagePage(p => Math.max(1, p - 1))} disabled={stoppagePage === 1} className={styles.iconButton} style={{ padding: '6px', opacity: stoppagePage === 1 ? 0.5 : 1 }}>
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <span style={{ fontSize: '0.9rem', padding: '0 10px' }}>Page {stoppagePage} of {totalStopPages}</span>
                                                <button onClick={() => setStoppagePage(p => Math.min(totalStopPages, p + 1))} disabled={stoppagePage === totalStopPages} className={styles.iconButton} style={{ padding: '6px', opacity: stoppagePage === totalStopPages ? 0.5 : 1 }}>
                                                    <ChevronRight size={16} />
                                                </button>
                                                <button onClick={() => setStoppagePage(totalStopPages)} disabled={stoppagePage === totalStopPages} className={styles.iconButton} style={{ padding: '6px', opacity: stoppagePage === totalStopPages ? 0.5 : 1 }}>
                                                    <ChevronsRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </section>
            </div>
        </div>
    );
}
