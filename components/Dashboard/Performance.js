'use client';
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import styles from '../../app/dashboard/page.module.css';

// Tabs
import HighestProduction from './PerformanceTabs/HighestProduction';
import CrusherWise from './PerformanceTabs/CrusherWise';
import SectorWise from './PerformanceTabs/SectorWise';
import OperatorPerformance from './PerformanceTabs/OperatorPerformance';
import LoadingPerformance from './PerformanceTabs/LoadingPerformance';

export default function Performance() {
    const [activeTab, setActiveTab] = useState('highest');
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const [dashboardData, setDashboardData] = useState({
        highestProduction: [],
        crusherWise: [],
        sectorWise: [],
        operatorPerformance: [],
        loadingPerformance: []
    });
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/performance?fromDate=${dateRange.from}&toDate=${dateRange.to}`);
            const json = await res.json();
            if (json.success) {
                setDashboardData({
                    highestProduction: json.highestProduction,
                    crusherWise: json.crusherWise,
                    sectorWise: json.sectorWise,
                    operatorPerformance: json.operatorPerformance,
                    loadingPerformance: json.loadingPerformance
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const handleFetch = () => {
        fetchData();
    };

    const renderTab = () => {
        if (loading && !dashboardData.highestProduction.length) return <div>Loading...</div>;

        switch (activeTab) {
            case 'highest': return <HighestProduction data={dashboardData.highestProduction} />;
            case 'crusher': return <CrusherWise data={dashboardData.crusherWise} />;
            case 'sector': return <SectorWise data={dashboardData.sectorWise} />;
            case 'operator': return <OperatorPerformance data={dashboardData.operatorPerformance} />;
            case 'loading': return <LoadingPerformance data={dashboardData.loadingPerformance} />;
            default: return <HighestProduction data={dashboardData.highestProduction} />;
        }
    };

    const tabs = [
        { id: 'highest', label: 'Highest Production' },
        { id: 'crusher', label: 'Crusher Wise' },
        { id: 'sector', label: 'Sector Wise' },
        { id: 'operator', label: 'Operator Performance' },
        { id: 'loading', label: 'Loading Performance' },
    ];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.pageHeader} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <h1>Performance Dashboard</h1>

                    {/* Date Controls */}
                    <div className={styles.controls} style={{ alignSelf: 'flex-end' }}>
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
                        <button onClick={handleFetch} className={`${styles.iconButton} ${styles.btnBlue}`}>
                            <RefreshCw size={18} /> Show
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', width: '100%', paddingBottom: '0.5rem' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--muted-foreground)',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Content - Recreating container logic to avoid nested padding issues */}
            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                {renderTab()}
            </div>
        </div>
    );
}
