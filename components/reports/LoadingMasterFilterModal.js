'use client';

import { useState, useEffect } from 'react';
import { X, Search, RotateCcw } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import styles from './LoadingMasterFilterModal.module.css';

export default function LoadingMasterFilterModal({
    isOpen,
    onClose,
    onApply,
    initialFilters = {}
}) {
    const [options, setOptions] = useState({
        shifts: [],
        operators: [],
        loadingMachines: [],
        loadingModels: [],
        relays: [],
        sectors: [],
        patches: [],
        methods: []
    });

    const [filters, setFilters] = useState({
        shiftIds: [],
        operatorIds: [],
        loadingMachineIds: [],
        loadingModelIds: [],
        relayIds: [],
        sectorIds: [],
        patchIds: [],
        methodIds: []
    });

    const [loading, setLoading] = useState(false);

    // Fetch Options on Mount
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch('/api/reports/loading-master/helpers')
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        setOptions(res.data);
                    }
                })
                .catch(err => console.error("Failed to load filter options", err))
                .finally(() => setLoading(false));

            // Load Initial State
            if (initialFilters) {
                setFilters(prev => ({ ...prev, ...initialFilters }));
            }
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        setFilters({
            shiftIds: [],
            operatorIds: [],
            loadingMachineIds: [],
            loadingModelIds: [],
            relayIds: [],
            sectorIds: [],
            patchIds: [],
            methodIds: []
        });
    };

    const handleApply = () => {
        // Generate Summary
        const summaryParts = [];

        const map = [
            { key: 'shiftIds', label: 'Shift', options: options.shifts },
            { key: 'operatorIds', label: 'Operator', options: options.operators },
            { key: 'loadingMachineIds', label: 'Loading Machine', options: options.loadingMachines },
            { key: 'loadingModelIds', label: 'Loading Model', options: options.loadingModels },
            { key: 'relayIds', label: 'Relay', options: options.relays },
            { key: 'sectorIds', label: 'Sector', options: options.sectors },
            { key: 'patchIds', label: 'Patch', options: options.patches },
            { key: 'methodIds', label: 'Method', options: options.methods }
        ];

        map.forEach(({ key, label, options: opts }) => {
            const selectedIds = filters[key];
            if (selectedIds && selectedIds.length > 0) {
                // Find names for selected IDs
                const names = opts
                    .filter(opt => selectedIds.includes(opt.id.toString()))
                    .map(opt => opt.name)
                    .join(', ');
                if (names) {
                    summaryParts.push(`${label}: ${names}`);
                }
            }
        });

        const summary = summaryParts.length > 0 ? `Applied filters -> ${summaryParts.join(' | ')}` : '';

        onApply(filters, summary);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Loading Master Report Filters</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className={styles.modalBody}>
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                            Loading options...
                        </div>
                    ) : (
                        <>
                            {/* Shift */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Shift</label>
                                <SearchableSelect
                                    multiple
                                    name="shiftIds"
                                    value={filters.shiftIds}
                                    options={options.shifts}
                                    onChange={handleChange}
                                    placeholder="Select Shifts..."
                                />
                            </div>

                            {/* Operator */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Operator</label>
                                <SearchableSelect
                                    multiple
                                    name="operatorIds"
                                    value={filters.operatorIds}
                                    options={options.operators}
                                    onChange={handleChange}
                                    placeholder="Select Operators..."
                                />
                            </div>

                            {/* Loading Machine */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Loading Machine</label>
                                <SearchableSelect
                                    multiple
                                    name="loadingMachineIds"
                                    value={filters.loadingMachineIds}
                                    options={options.loadingMachines}
                                    onChange={handleChange}
                                    placeholder="Select Loading Machines..."
                                />
                            </div>

                            {/* Loading Model */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Loading Model</label>
                                <SearchableSelect
                                    multiple
                                    name="loadingModelIds"
                                    value={filters.loadingModelIds}
                                    options={options.loadingModels}
                                    onChange={handleChange}
                                    placeholder="Select Loading Models..."
                                />
                            </div>

                            {/* Relay */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Relay</label>
                                <SearchableSelect
                                    multiple
                                    name="relayIds"
                                    value={filters.relayIds}
                                    options={options.relays}
                                    onChange={handleChange}
                                    placeholder="Select Relays..."
                                />
                            </div>

                            {/* Sector */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Sector</label>
                                <SearchableSelect
                                    multiple
                                    name="sectorIds"
                                    value={filters.sectorIds}
                                    options={options.sectors}
                                    onChange={handleChange}
                                    placeholder="Select Sectors..."
                                />
                            </div>

                            {/* Patch */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Patch</label>
                                <SearchableSelect
                                    multiple
                                    name="patchIds"
                                    value={filters.patchIds}
                                    options={options.patches}
                                    onChange={handleChange}
                                    placeholder="Select Patches..."
                                />
                            </div>

                            {/* Method */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Method</label>
                                <SearchableSelect
                                    multiple
                                    name="methodIds"
                                    value={filters.methodIds}
                                    options={options.methods}
                                    onChange={handleChange}
                                    placeholder="Select Methods..."
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button
                        onClick={handleReset}
                        className={styles.resetBtn}
                    >
                        <RotateCcw size={16} /> Reset All
                    </button>
                    <button
                        onClick={handleApply}
                        className={styles.applyBtn}
                    >
                        <Search size={16} /> Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
