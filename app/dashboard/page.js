'use client';

import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import {
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
    Layers, Truck, Anchor, Send, Recycle, Box, Loader2
} from 'lucide-react';
import styles from './page.module.css';

const sections = [
    {
        id: 'coal_prod',
        title: 'Coal Production (MT)',
        icon: Layers,
        bgClass: styles.themePeach,
        hasDetails: true,
        data: { ftd: 0, mtd: 0, avg: 0, ytd: 0 }
    },
    {
        id: 'ob_rem',
        title: 'OB Removal (BCM)',
        icon: Truck,
        bgClass: styles.themeBlue,
        hasDetails: true,
        data: { ftd: 0, mtd: 0, avg: 0, ytd: 0 }
    },
    {
        id: 'crushing',
        title: 'Crushing (MT)',
        icon: Anchor,
        bgClass: styles.themePink,
        hasDetails: true,
        data: { ftd: 0, mtd: 0, avg: 0, ytd: 0 }
    },
    {
        id: 'dispatch',
        title: 'Dispatch (MT)',
        icon: Send,
        bgClass: styles.themeGrey,
        hasDetails: true,
        data: { ftd: 0, mtd: 0, avg: 0, ytd: 0 }
    },
    {
        id: 'coal_re',
        title: 'Coal Rehandling (MT)',
        icon: Box,
        bgClass: styles.themeYellow,
        hasDetails: false, // No Details for now
        data: { ftd: 0, mtd: 0, avg: 0, ytd: 0 }
    },
    {
        id: 'ob_re',
        title: 'OB Rehandling (BCM)',
        icon: Recycle,
        bgClass: styles.themeGreen,
        hasDetails: false, // No Details for now
        data: { ftd: 0, mtd: 0, avg: 0, ytd: 0 }
    }
];



function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

function getFinancialYearLabel(dateStr) {
    if (!dateStr) return 'FY';
    const parts = dateStr.split('-');
    if (parts.length < 2) return 'FY';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let startYear, endYear;
    if (month >= 4) {
        startYear = year;
        endYear = year + 1;
    } else {
        startYear = year - 1;
        endYear = year;
    }
    return `FY(${startYear}-${String(endYear).slice(-2)})`;
}

export default function Dashboard() {
    const [activeDetail, setActiveDetail] = useState(null);
    const scrollRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false); // Hover Pause State
    const [isManualPaused, setIsManualPaused] = useState(false); // Manual Toggle State

    // Metric Toggle State: 'prod' (Productivity) or 'time' (Working Hours)
    const [haulingMetric, setHaulingMetric] = useState('prod');
    const [loadingMetric, setLoadingMetric] = useState('prod');

    // State for chart toggles (Best vs Worst)
    const [haulingView, setHaulingView] = useState('best');
    const [loadingView, setLoadingView] = useState('best');

    // Date Filter State (Default to Current Date)
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    // Equipment Model Filter State
    const [haulingModels, setHaulingModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState([]);
    const [selectedHaulingModel, setSelectedHaulingModel] = useState('All Models');
    const [selectedLoadingModel, setSelectedLoadingModel] = useState('All Models');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch Unique Models for Filters
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch('/api/dashboard/analytical/models');
                const json = await res.json();
                if (json.success) {
                    setLoadingModels(json.loadingModels || []);
                    setHaulingModels(json.haulingModels || []);
                }
            } catch (err) {
                console.error("Failed to fetch models", err);
            }
        };
        fetchModels();
    }, []);

    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');

        const firstDay = `${yyyy}-${mm}-01`;
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        setDateRange({ from: firstDay, to: formattedDate });
    }, []);

    const [dashboardData, setDashboardData] = useState({
        kpis: [],
        details: {},
        hauling: [],
        loading: []
    });

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                fromDate: dateRange.from,
                toDate: dateRange.to,
                loadingModel: selectedLoadingModel,
                haulingModel: selectedHaulingModel
            });
            const res = await fetch(`/api/dashboard/analytical?${queryParams.toString()}`);
            const json = await res.json();
            if (json.success) {
                // Process Details into Dictionary Map
                const detailsMap = {};
                json.details.forEach(row => {
                    if (!detailsMap[row.SectionId]) detailsMap[row.SectionId] = [];
                    detailsMap[row.SectionId].push(row);
                });

                setDashboardData({
                    kpis: json.kpis,
                    details: detailsMap,
                    hauling: json.hauling,
                    loading: json.loading
                });
            }
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (dateRange.from && dateRange.to) {
            fetchDashboardData();
        }
    }, [dateRange, selectedLoadingModel, selectedHaulingModel]);

    // Merge API Data with Static Config
    const displaySections = sections.map(sec => {
        const kpi = dashboardData.kpis.find(k => k.SectionId === sec.id) || {};
        return {
            ...sec,
            data: {
                ftd: kpi.FTD || 0,
                mtd: kpi.MTD || 0,
                avg: kpi.Avg || 0,
                ytd: kpi.YTD || 0
            }
        };
    });

    // Duplicate loop logic
    const loopedSections = [...displaySections, ...displaySections, ...displaySections, ...displaySections];

    const toggleDetail = (id) => {
        const realId = id.split('_dup')[0];
        if (activeDetail === realId) {
            setActiveDetail(null);
        } else {
            setActiveDetail(realId);
        }
    };

    const handleScrollLeft = () => {
        const container = scrollRef.current;
        if (container) {
            container.scrollBy({ left: -340, behavior: 'smooth' });
        }
    };

    const handleScrollRight = () => {
        const container = scrollRef.current;
        if (container) {
            container.scrollBy({ left: 340, behavior: 'smooth' });
        }
    };

    // Auto-scroll Logic
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const speed = 1; // Increased speed slightly
        let animationFrameId;

        const scroll = () => {
            // Scroll only if NOT paused (hover) AND NOT manually paused
            if (!isPaused && !isManualPaused && scrollContainer) {
                if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth / 2)) {
                    // Reset to beginning to create infinite loop effect
                    // We are duplicating the list 4 times, so resetting at half-way point is safe
                    scrollContainer.scrollLeft = 0;
                } else {
                    scrollContainer.scrollLeft += speed;
                }
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        animationFrameId = requestAnimationFrame(scroll);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPaused, isManualPaused]); // Add isManualPaused dependency

    // Helper to get formatted data based on Metric and View
    const getChartData = (type, view, metric) => {
        // Source Data from API
        let rawData = type === 'hauling' ? [...dashboardData.hauling] : [...dashboardData.loading];

        // Max Scale Normalizer
        const maxVal = type === 'hauling' ? 10 : 600; // Adjusted defaults

        // Calculate 'val' and 'hrs' from API fields if needed
        // Assuming API returns { EquipmentName, Productivity, WorkingHours, Type }

        // Sorting Logic
        if (metric === 'time') {
            // Sort by WorkingHours
            if (view === 'best') {
                rawData.sort((a, b) => b.WorkingHours - a.WorkingHours); // Descending
            } else {
                rawData.sort((a, b) => a.WorkingHours - b.WorkingHours); // Ascending
            }
        } else {
            // Sort by Productivity
            if (view === 'best') {
                rawData.sort((a, b) => b.Productivity - a.Productivity);
            } else {
                rawData.sort((a, b) => a.Productivity - b.Productivity);
            }
        }

        // Slice top 10
        const displayData = rawData.slice(0, 10);

        // Normalize for Bar Height
        const normalizer = metric === 'time' ? 24 : maxVal; // 24 hours max

        return displayData.map(d => ({
            name: d.EquipmentName,
            val: Number(d.Productivity || 0).toFixed(1),
            hrs: Number(d.WorkingHours || 0).toFixed(1),
            displayVal: metric === 'time'
                ? Number(d.WorkingHours || 0).toFixed(1)
                : Number(d.Productivity || 0).toFixed(1),
            heightItems: Math.min(((metric === 'time' ? d.WorkingHours : (d.Productivity || 0)) / normalizer) * 100, 100),
            colorClass: metric === 'time'
                ? (type === 'hauling' ? styles.barHaulingTime : styles.barLoadingTime)
                : (view === 'best'
                    ? (type === 'hauling' ? styles.barHaulingBest : styles.barLoadingBest)
                    : styles.barWorst)
        }));
    };

    return (
        <div className={styles.container}>
            <style>{`
                @keyframes dash-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Global Loader Overlay */}
            {isLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(2px)',
                    zIndex: 99999, display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <Loader2 size={48} style={{ animation: 'dash-spin 1s linear infinite', color: 'var(--primary, #0070f3)' }} />
                    <span style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>Processing Analytics...</span>
                </div>
            )}

            {/* ... Header ... */}
            <div className={styles.pageHeader}>
                <h1>Analytical Dashboard</h1>
                {/* ... Date Filter ... */}
                <div className={styles.dateFilter}>
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="bg-transparent border-none outline-none text-sm"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="bg-transparent border-none outline-none text-sm"
                    />
                    <button className={styles.btn}>Show</button>
                </div>
            </div>

            <div
                className={styles.gridContainer}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Play/Pause Toggle */}
                <button
                    className={styles.playPauseBtn}
                    onClick={() => setIsManualPaused(!isManualPaused)}
                    title={isManualPaused ? "Resume Scroll" : "Pause Scroll"}
                >
                    {isManualPaused ? <span style={{ fontSize: '1.2rem' }}>▶</span> : <span style={{ fontSize: '1.2rem' }}>⏸</span>}
                </button>

                {/* Left Arrow */}
                <button
                    onClick={handleScrollLeft}
                    className={`${styles.navBtn} ${styles.prevBtn}`}
                >
                    <ChevronLeft size={24} />
                </button>
                {/* Right Arrow */}
                <button
                    onClick={handleScrollRight}
                    className={`${styles.navBtn} ${styles.nextBtn}`}
                >
                    <ChevronRight size={24} />
                </button>

                <div className={styles.grid} ref={scrollRef}>
                    {loopedSections.map((section, index) => {
                        const uniqueId = `${section.id}_${index}`;
                        const serialNo = (index % sections.length) + 1;

                        return (
                            <div key={uniqueId} className={`${styles.card} glass ${section.bgClass}`}>
                                <div className={styles.serialNumber}>{serialNo}</div>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconBox}>
                                        <section.icon size={20} color="white" />
                                    </div>
                                    <h3 className={styles.cardTitle}>{section.title}</h3>
                                </div>
                                <div className={styles.mainValueContainer}>
                                    <div className={styles.mainValueLabel}>Day (FTD)</div>
                                    <div className={styles.mainValue}>{formatNumber(section.data.ftd)}</div>
                                </div>
                                <div className={styles.separator}></div>
                                <div className={styles.subValuesGrid}>
                                    <div className={styles.subValueItem}>
                                        <span className={styles.subValueLabel}>Month</span>
                                        <span className={styles.subValue}>{formatNumber(section.data.mtd)}</span>
                                    </div>
                                    <div className={styles.subValueItem}>
                                        <span className={styles.subValueLabel}>Avg</span>
                                        <span className={styles.subValue}>{formatNumber(section.data.avg)}</span>
                                    </div>
                                    <div className={styles.subValueItem}>
                                        <span className={styles.subValueLabel} title={getFinancialYearLabel(dateRange.to)}>
                                            {getFinancialYearLabel(dateRange.to)}
                                        </span>
                                        <span className={styles.subValue}>{formatNumber(section.data.ytd)}</span>
                                    </div>
                                </div>
                                {section.hasDetails && (
                                    <button
                                        className={styles.toggleBtn}
                                        onClick={() => toggleDetail(section.id)}
                                    >
                                        {activeDetail === section.id ? <ChevronDown size={18} /> : <span>+</span>}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Details Section */}
            {activeDetail && (
                <div
                    className={`${styles.detailSection} ${sections.find(s => s.id === activeDetail)?.bgClass || ''}`}
                    onMouseEnter={() => setIsPaused(true)}
                >
                    <div className={styles.detailHeader}>
                        <span>Detailed Breakdown: {sections.find(s => s.id === activeDetail)?.title}</span>
                        <button onClick={() => setActiveDetail(null)} className={styles.closeBtn}>Close</button>
                    </div>

                    {dashboardData.details[activeDetail] && dashboardData.details[activeDetail].length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className={styles.detailTable}>
                                <thead>
                                    <tr>
                                        <th>Category/Location</th>
                                        <th>FTD</th>
                                        <th>MTD</th>
                                        <th>Avg</th>
                                        <th>{getFinancialYearLabel(dateRange.to)}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.details[activeDetail].map((row, idx) => {
                                        const plantNameMap = {
                                            'Plant 1': 'PSS-1',
                                            'Plant 2': 'PSS-2',
                                            'Plant 3': 'PSS-3',
                                            'Plant 4': 'ICP',
                                            'Plant 5': 'WP-3',
                                            '-': 'Others'
                                        };
                                        const displayCategory = plantNameMap[row.Category] || row.Category;

                                        return (
                                            <tr key={idx} style={row.IsTotal ? { fontWeight: 'bold', background: 'var(--card-color-light)', color: 'var(--card-color)' } : {}}>
                                                <td>{displayCategory}</td>
                                                <td>{formatNumber(row.FTD)}</td>
                                                <td>{formatNumber(row.MTD)}</td>
                                                <td>{formatNumber(row.Avg)}</td>
                                                <td>{formatNumber(row.YTD)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                            No detailed data available for this section.
                        </div>
                    )}
                </div>
            )}

            {/* Performance Charts Section */}
            <div className={styles.chartGrid}>
                {/* Hauling Chart */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <div style={{ flex: 1 }}>
                            <div className={styles.chartTitle}>Top 10 Hauling Performance</div>
                            <div className={styles.chartSubtitle}>
                                {haulingMetric === 'prod' ? 'Based on Productivity (Trips/Hr)' : 'Based on Working Duration (Hrs)'}
                            </div>
                        </div>
                        <div className={styles.chartActions} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px' }}>
                            {/* Model Filter */}
                            <Select
                                instanceId="hauling-model-select"
                                options={[{ value: 'All Models', label: 'All Models' }, ...haulingModels.map(m => ({ value: m, label: m }))]}
                                value={{ value: selectedHaulingModel, label: selectedHaulingModel }}
                                onChange={(opt) => setSelectedHaulingModel(opt.value)}
                                isSearchable
                                placeholder="Search Models..."
                                styles={{
                                    container: (base) => ({ ...base, width: '220px' }),
                                    control: (base) => ({ ...base, minHeight: '32px', borderRadius: '20px', fontSize: '12px', border: '1px solid var(--border-color)' }),
                                    menu: (base) => ({ ...base, fontSize: '12px', zIndex: 9999 })
                                }}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Metric Toggle */}
                                <div className={styles.togglePill}>
                                    <button
                                        className={`${styles.pillBtn} ${haulingMetric === 'prod' ? styles.pillActive : ''}`}
                                        onClick={() => setHaulingMetric('prod')}
                                    >
                                        Trip/Hr
                                    </button>
                                    <button
                                        className={`${styles.pillBtn} ${haulingMetric === 'time' ? styles.pillActive : ''}`}
                                        onClick={() => setHaulingMetric('time')}
                                    >
                                        Work Hrs
                                    </button>
                                </div>

                                <div className={styles.chartControls} style={{ alignSelf: 'flex-end' }}>
                                    <button
                                        className={`${styles.controlBtn} ${haulingView === 'best' ? styles.controlBtnActive : ''}`}
                                        onClick={() => setHaulingView('best')}
                                    >
                                        Best
                                    </button>
                                    <button
                                        className={`${styles.controlBtn} ${haulingView === 'worst' ? styles.controlBtnActive : ''}`}
                                        onClick={() => setHaulingView('worst')}
                                    >
                                        Below
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartBody}>
                        {/* Background Grid Lines */}
                        <div className={styles.gridLines}>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                        </div>

                        {getChartData('hauling', haulingView, haulingMetric).map((d, i) => (
                            <div key={`h-${i}`} className={styles.barColumn}>
                                <div className={styles.barWrapper}>
                                    <div
                                        className={`${styles.bar} ${d.colorClass}`}
                                        style={{ height: `${d.heightItems}%` }}
                                    >
                                        <span className={styles.barValue}>{d.displayVal}</span>
                                    </div>
                                    <span className={styles.barLabel}>{d.name}</span>
                                    <div className={styles.tooltip}>
                                        {haulingMetric === 'time'
                                            ? <>{d.hrs} Hrs<br />{d.val} Trips/Hr</>
                                            : <>{d.val} Trips/Hr<br />{d.hrs} Hrs</>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loading Chart */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <div style={{ flex: 1 }}>
                            <div className={styles.chartTitle}>Top 10 Loading Performance</div>
                            <div className={styles.chartSubtitle}>
                                {loadingMetric === 'prod' ? 'Based on Productivity (BCM/Hr)' : 'Based on Working Duration (Hrs)'}
                            </div>
                        </div>
                        <div className={styles.chartActions} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px' }}>
                            {/* Model Filter */}
                            <Select
                                instanceId="loading-model-select"
                                options={[{ value: 'All Models', label: 'All Models' }, ...loadingModels.map(m => ({ value: m, label: m }))]}
                                value={{ value: selectedLoadingModel, label: selectedLoadingModel }}
                                onChange={(opt) => setSelectedLoadingModel(opt.value)}
                                isSearchable
                                placeholder="Search Models..."
                                styles={{
                                    container: (base) => ({ ...base, width: '220px' }),
                                    control: (base) => ({ ...base, minHeight: '32px', borderRadius: '20px', fontSize: '12px', border: '1px solid var(--border-color)' }),
                                    menu: (base) => ({ ...base, fontSize: '12px', zIndex: 9999 })
                                }}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Metric Toggle */}
                                <div className={styles.togglePill}>
                                    <button
                                        className={`${styles.pillBtn} ${loadingMetric === 'prod' ? styles.pillActive : ''}`}
                                        onClick={() => setLoadingMetric('prod')}
                                    >
                                        BCM/Hr
                                    </button>
                                    <button
                                        className={`${styles.pillBtn} ${loadingMetric === 'time' ? styles.pillActive : ''}`}
                                        onClick={() => setLoadingMetric('time')}
                                    >
                                        Work Hrs
                                    </button>
                                </div>

                                <div className={styles.chartControls} style={{ alignSelf: 'flex-end' }}>
                                    <button
                                        className={`${styles.controlBtn} ${loadingView === 'best' ? styles.controlBtnActive : ''}`}
                                        onClick={() => setLoadingView('best')}
                                    >
                                        Best
                                    </button>
                                    <button
                                        className={`${styles.controlBtn} ${loadingView === 'worst' ? styles.controlBtnActive : ''}`}
                                        onClick={() => setLoadingView('worst')}
                                    >
                                        Below
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartBody}>
                        <div className={styles.gridLines}>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                        </div>

                        {getChartData('loading', loadingView, loadingMetric).map((d, i) => (
                            <div key={`l-${i}`} className={styles.barColumn}>
                                <div className={styles.barWrapper}>
                                    <div
                                        className={`${styles.bar} ${d.colorClass}`}
                                        style={{ height: `${d.heightItems}%` }}
                                    >
                                        <span className={styles.barValue}>{d.displayVal}</span>
                                    </div>
                                    <span className={styles.barLabel}>{d.name}</span>
                                    <div className={styles.tooltip}>
                                        {loadingMetric === 'time'
                                            ? <>{d.hrs} Hrs<br />{d.val} BCM/Hr</>
                                            : <>{d.val} BCM/Hr<br />{d.hrs} Hrs</>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
