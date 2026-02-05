'use client';

import { useState } from 'react';
import ReportFilter from '@/components/reports/ReportFilter';
import ReportTable from '@/components/reports/ReportTable';
import { toast } from 'sonner';

/**
 * Material Rehandling Detailed Report
 */
export default function MaterialRehandlingReport() {
    const [filter, setFilter] = useState({
        reportType: 'MaterialRehandling',
        fromDate: '',
        toDate: ''
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    // Columns Configuration (Matched with SQL Aliases)
    const columns = [
        { header: 'Sl.No', accessor: 'SlNo' },
        { header: 'Cost Center Loading', accessor: 'CostCenterLoading' },
        { header: 'PMS Code Loading', accessor: 'ProdsysCodeLoading' },
        { header: 'Cost Center Hauling', accessor: 'CostCenterHauler' },
        { header: 'PMS Code Hauling', accessor: 'ProdsysCodeHauling' },
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
        { header: 'TotalQty', accessor: 'ManagTotalQty' }, // Displaying Management Total Qty as TotalQty per request context implies this is the main qty.
        { header: 'Loading Model', accessor: 'LoadingModel' },
        { header: 'Hauling Model', accessor: 'HaulingModel' },
        { header: 'Scale', accessor: 'ScaleName' },
        { header: 'Sector', accessor: 'Sector' },
        { header: 'Patch', accessor: 'Patch' },
        { header: 'Relay', accessor: 'Relay' },
        { header: 'Shift Incharge (Large Scale)', accessor: 'ShiftInchargeLarge' },
        { header: 'Shift Incharge (Mid Scale)', accessor: 'ShiftInchargeMid' },
        { header: 'Remarks', accessor: 'Remarks' }
    ];

    const handleGenerate = async () => {
        if (!filter.fromDate || !filter.toDate) return toast.error('Please select date range');

        setLoading(true);
        setData([]);

        try {
            const res = await fetch('/api/reports/material-rehandling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromDate: filter.fromDate, toDate: filter.toDate })
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

    return (
        <div className="p-6 h-screen flex flex-col bg-slate-50">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Material Rehandling Report</h1>
                <p className="text-slate-500 text-sm">Transaction logs for material rehandling</p>
            </div>

            <ReportFilter
                reportType={filter.reportType}
                setReportType={(val) => setFilter({ ...filter, reportType: val })}
                fromDate={filter.fromDate}
                setFromDate={(val) => setFilter({ ...filter, fromDate: val })}
                toDate={filter.toDate}
                setToDate={(val) => setFilter({ ...filter, toDate: val })}
                onGenerate={handleGenerate}
                onReset={() => setData([])}
                loading={loading}
                showReportType={false}
            />

            <ReportTable
                columns={columns}
                data={data}
                loading={loading}
                reportName="Material Rehandling"
                fromDate={filter.fromDate}
                toDate={filter.toDate}
                generated={generated}
            />
        </div>
    );
}
