
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SearchableSelect from '@/components/SearchableSelect';
import ReportTable from '@/components/reports/ReportTable';
import styles from './OperatorHauling.module.css';

export default function OperatorPerformanceHaulingReport() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Filters
    const [allOperators, setAllOperators] = useState([]);
    const [allEquipment, setAllEquipment] = useState([]);
    const [allRelays, setAllRelays] = useState([]);
    const [shifts, setShifts] = useState([]);

    const [selectedOperators, setSelectedOperators] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState([]);
    const [selectedRelay, setSelectedRelay] = useState([]);
    const [selectedShift, setSelectedShift] = useState([]);

    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchHelpers = async () => {
            try {
                // Fetch Helpers
                const resHelpers = await fetch('/api/reports/operator-performance-hauling/helpers');
                const dataHelpers = await resHelpers.json();
                if (dataHelpers.operators) setAllOperators(dataHelpers.operators);
                if (dataHelpers.equipment) setAllEquipment(dataHelpers.equipment);
                if (dataHelpers.relays) setAllRelays(dataHelpers.relays);

                // Fetch Shifts
                const resShifts = await fetch('/api/master/shift');
                const dataShifts = await resShifts.json();
                if (Array.isArray(dataShifts)) setShifts(dataShifts);
                else if (dataShifts.success && dataShifts.data) setShifts(dataShifts.data);

            } catch (error) {
                console.error("Error fetching helpers:", error);
                toast.error("Failed to load filters");
            }
        };
        fetchHelpers();
    }, []);

    const handleGenerate = async () => {
        if (!date) {
            toast.error("Please select a date");
            return;
        }

        setIsLoading(true);
        setIsGenerated(true);
        setReportData([]);

        try {
            const payload = {
                date,
                operatorIds: selectedOperators,
                haulingMachineIds: selectedEquipment,
                relayIds: selectedRelay,
                shiftIds: selectedShift
            };

            const res = await fetch('/api/reports/operator-performance-hauling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to fetch report");

            const data = await res.json();
            setReportData(data);
            if (data.length === 0) toast.info("No records found for selected criteria");

        } catch (error) {
            console.error("Error generating report:", error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Format options for SearchableSelect
    const operatorOptions = useMemo(() => allOperators.map(op => ({ id: op.id, name: op.name })), [allOperators]);
    const equipmentOptions = useMemo(() => allEquipment.map(eq => ({ id: eq.id, name: eq.name })), [allEquipment]);
    const relayOptions = useMemo(() => allRelays.map(r => ({ id: r.id, name: r.name })), [allRelays]);
    const shiftOptions = useMemo(() => shifts.map(s => ({ id: s.SlNo, name: s.ShiftName })), [shifts]);

    // Define table columns
    const columns = useMemo(() => [
        { header: 'Sl No', accessor: 'SlNo', width: '60px' },
        { header: 'Date', accessor: 'Date', width: '100px', render: r => new Date(r.Date).toLocaleDateString('en-GB') },
        { header: "Operator's Name", accessor: "OPERATOR'S NAME", width: '200px' },
        { header: 'Shift', accessor: 'SHIFT', width: '80px' },
        { header: 'Hauling Equipment', accessor: 'Hauling Equipment.', width: '150px' },
        { header: 'Model', accessor: 'Equipment.MODEL', width: '150px' },
        { header: 'Relay', accessor: 'RELAY', width: '120px' },
        { header: 'Open HMR', accessor: 'Open HMR', width: '100px' },
        { header: 'Close HMR', accessor: 'CLOSE HMR', width: '100px' },
        { header: 'Net HMR', accessor: 'Net HMR', width: '100px' },

        { header: 'OB Trips', accessor: 'OB TRIPS', width: '100px' },
        { header: 'Quantity (BCM)', accessor: 'QUANTITY (BCM)', width: '120px' },
        { header: 'Coal Trips', accessor: 'COAL TRIPS', width: '100px' },
        { header: 'Quantity (MT)', accessor: 'QUANTITY (MT)', width: '120px' },

        { header: 'OKMR', accessor: 'OKMR', width: '100px' },
        { header: 'CKMR', accessor: 'CKMR', width: '100px' },
        { header: 'Net KMR', accessor: 'Net KMR', width: '100px' },

        { header: 'Trip/Hrs', accessor: 'TRIP/HRS', width: '100px' },
        { header: 'BCM/Hrs', accessor: 'BCM/HRS', width: '100px' },
        { header: 'Total Trip', accessor: 'Total Trip', width: '100px' },

        { header: 'Mapio Name', accessor: 'Mapio Name', width: '150px' },
        { header: 'Model (Dup)', accessor: 'Model', width: '150px' }, // As requested
        { header: 'Speed', accessor: 'Speed', width: '100px' },
        { header: 'Lead', accessor: 'Lead', width: '100px' },

        { header: 'Shift Incharge (Large Scale)', accessor: 'Shift Incharge(Large Scale)', width: '200px' },
        { header: 'Shift Incharge - Mid Scale', accessor: 'Shift Incharge - Mid Scale', width: '200px' },
    ], []);

    return (
        <div className={styles.container}>
            <div className={styles.headingWrapper}>
                <h1 className={styles.title}>Operator Performance Report - Hauling</h1>
                <p className={styles.subtitle}>
                    Detailed performance metrics per operator (Hauling Machines)
                </p>
            </div>

            <div className={styles.filterContainer}>
                {/* Date Filter */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>
                        Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={styles.input}
                    />
                </div>

                {/* Shift Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '150px' }}>
                    <label className={styles.label}>
                        Shift
                    </label>
                    <SearchableSelect
                        options={shiftOptions}
                        value={selectedShift}
                        onChange={(e) => setSelectedShift(e.target.value)}
                        multiple
                        placeholder="All Shifts"
                    />
                </div>

                {/* Operator Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>
                        Operator
                    </label>
                    <SearchableSelect
                        options={operatorOptions}
                        value={selectedOperators}
                        onChange={(e) => setSelectedOperators(e.target.value)}
                        multiple
                        placeholder="All Operators"
                    />
                </div>

                {/* Equipment Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '200px' }}>
                    <label className={styles.label}>
                        Hauler
                    </label>
                    <SearchableSelect
                        options={equipmentOptions}
                        value={selectedEquipment}
                        onChange={(e) => setSelectedEquipment(e.target.value)}
                        multiple
                        placeholder="All Haulers"
                    />
                </div>

                {/* Relay Filter */}
                <div className={styles.inputGroup} style={{ minWidth: '150px' }}>
                    <label className={styles.label}>
                        Relay
                    </label>
                    <SearchableSelect
                        options={relayOptions}
                        value={selectedRelay}
                        onChange={(e) => setSelectedRelay(e.target.value)}
                        multiple
                        placeholder="All Relays"
                    />
                </div>


                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className={styles.generateBtn}
                    style={{ marginTop: 'auto', marginBottom: '2px' }}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Search size={16} />
                            Generate View
                        </>
                    )}
                </button>
            </div>

            <ReportTable
                columns={columns}
                data={reportData}
                loading={isLoading}
                generated={isGenerated}
                reportName="Operator Performance - Hauling"
                fromDate={date}
                toDate={date}
            />
        </div>
    );
}
