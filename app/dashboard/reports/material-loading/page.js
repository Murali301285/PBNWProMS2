'use client';

import { useState } from 'react';
import ReportFilter from '@/components/reports/ReportFilter';
import ReportTable from '@/components/reports/ReportTable';
import MaterialLoadingFilterModal from '@/components/reports/MaterialLoadingFilterModal';
import { toast } from 'sonner';
import { Filter } from 'lucide-react';
import styles from '@/components/reports/ReportFilter.module.css';

/**
 * Material Loading Detailed Report
 */
export default function MaterialLoadingReport() {
    const [filter, setFilter] = useState({
        reportType: 'MaterialLoading',
        fromDate: '',
        toDate: ''
    });
    const [advancedFilters, setAdvancedFilters] = useState({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [filterSummary, setFilterSummary] = useState('');

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    // Columns Configuration (Matched with SQL Aliases)
    const columns = [
        { header: 'Sl.No', accessor: 'SlNo' },
        { header: 'Cost Center Loading', accessor: 'CostCenterLoading' },
        { header: 'Cost Center Hauling', accessor: 'CostCenterHauler' },
        { header: 'Year', accessor: 'Year' },
        { header: 'Month', accessor: 'Month' },
        { header: 'Date', accessor: 'Date' },
        { header: 'Shift', accessor: 'ShiftName' },
        { header: 'Source', accessor: 'SourceName' },
        { header: 'Destination', accessor: 'Destination' },
        { header: 'Hauler', accessor: 'HaulerEquipment' },
        { header: 'Loading Machine', accessor: 'LoadingMachine' },
        { header: 'Material', accessor: 'MaterialName' },
        { header: 'NTPC Qty/Trip', accessor: 'NtpcQtyTrip' },
        { header: 'Manag. Qty/Trip', accessor: 'ManagQtyTrip' },
        { header: 'Trip (NTPC)', accessor: 'TripNtpc' },
        { header: 'Trip (Management)', accessor: 'TripManagement' },
        { header: 'TotalQty', accessor: 'ManagTotalQty' },
        { header: 'Loading Model', accessor: 'LoadingModel' },
        { header: 'Hauling Model', accessor: 'HaulingModel' },
        { header: 'Sector', accessor: 'Sector' },
        { header: 'Patch', accessor: 'Patch' },
        { header: 'Scale', accessor: 'ScaleName' },
        { header: 'Relay', accessor: 'Relay' },
        { header: 'Shift Incharge(Large Scale)', accessor: 'ShiftInchargeLarge' },
        { header: 'Shift Incharge(Mid Scale)', accessor: 'ShiftInchargeMid' }
    ];

    const handleGenerate = async () => {
        if (!filter.fromDate || !filter.toDate) return toast.error('Please select date range');

        setLoading(true);
        setData([]);

        try {
            const payload = {
                fromDate: filter.fromDate,
                toDate: filter.toDate,
                ...advancedFilters // Include selected filters
            };

            const res = await fetch('/api/reports/material-loading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                toast.success(`Loaded ${result.data.length} records`);
            } else {
                toast.error(result.message || 'Failed to fetch report');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error fetching report');
        } finally {
            setLoading(false);
            setGenerated(true);
        }
    };

    // Check if any filter is active for visual indicator
    const activeFilterCount = Object.values(advancedFilters).filter(v => Array.isArray(v) && v.length > 0).length;

    return (
        <div className="p-6 h-screen flex flex-col bg-slate-50">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Material Loading Report</h1>
                <p className="text-slate-500 text-sm">Detailed transaction logs for material movement</p>
            </div>

            <ReportFilter
                reportType={filter.reportType}
                setReportType={(val) => setFilter({ ...filter, reportType: val })}
                fromDate={filter.fromDate}
                setFromDate={(val) => setFilter({ ...filter, fromDate: val })}
                toDate={filter.toDate}
                setToDate={(val) => setFilter({ ...filter, toDate: val })}
                onGenerate={handleGenerate}
                onReset={() => { setData([]); setAdvancedFilters({}); setFilterSummary(''); }}
                loading={loading}
                showReportType={false}
            >
                {/* Custom Filter Button */}
                <div className="flex items-center gap-2">
                    <button
                        className={`${styles.generateBtn} !bg-white !text-slate-700 !border !border-slate-300 hover:!bg-slate-50 relative`}
                        onClick={() => setIsFilterOpen(true)}
                        title="Advanced Filters"
                    >
                        <Filter size={16} /> Filter
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    {filterSummary && (
                        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'blue' }}>
                            {filterSummary}
                        </span>
                    )}
                </div>
            </ReportFilter>

            <MaterialLoadingFilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={(filters, summary) => {
                    setAdvancedFilters(filters);
                    setFilterSummary(summary);
                    // Optionally auto-generate?
                    // handleGenerate(); // Better let user click Generate explicitly
                }}
                initialFilters={advancedFilters}
            />

            <ReportTable
                columns={columns}
                data={data}
                loading={loading}
                reportName="Material Loading"
                fromDate={filter.fromDate}
                toDate={filter.toDate}
                generated={generated}
            />
        </div>
    );
}
