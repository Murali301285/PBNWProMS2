'use client';

import { useState, useEffect } from 'react';
import { X, Search, RotateCcw } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import styles from './MaterialLoadingFilterModal.module.css';

export default function MaterialLoadingFilterModal({
    isOpen,
    onClose,
    onApply,
    initialFilters = {}
}) {
    const [options, setOptions] = useState({
        shifts: [],
        sources: [],
        destinations: [],
        haulers: [],
        loaders: [],
        materials: [],
        relays: [],
        scales: [],
        sectors: [],
        patches: [],
        incharges: []
    });

    const [filters, setFilters] = useState({
        shiftIds: [],
        sourceIds: [],
        destinationIds: [],
        haulerIds: [],
        loadingMachineIds: [],
        materialIds: [],
        relayIds: [],
        scaleIds: [],
        sectorIds: [],
        patchIds: [],
        shiftInchargeIds: [],   // New
        midScaleInchargeIds: [] // New
    });

    const [loading, setLoading] = useState(false);

    // Fetch Options on Mount
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch('/api/reports/material-loading/helpers')
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
            sourceIds: [],
            destinationIds: [],
            haulerIds: [],
            loadingMachineIds: [],
            materialIds: [],
            relayIds: [],
            scaleIds: [],
            sectorIds: [],
            patchIds: [],
            shiftInchargeIds: [],
            midScaleInchargeIds: []
        });
    };

    const handleApply = () => {
        // Generate Summary
        const summaryParts = [];

        const map = [
            { key: 'shiftIds', label: 'Shift', options: options.shifts },
            { key: 'sourceIds', label: 'Source', options: options.sources },
            { key: 'destinationIds', label: 'Destination', options: options.destinations },
            { key: 'materialIds', label: 'Material', options: options.materials },
            { key: 'loadingMachineIds', label: 'Loading Machine', options: options.loaders },
            { key: 'haulerIds', label: 'Hauler', options: options.haulers },
            { key: 'sectorIds', label: 'Sector', options: options.sectors },
            { key: 'patchIds', label: 'Patch', options: options.patches },
            { key: 'relayIds', label: 'Relay', options: options.relays },
            { key: 'scaleIds', label: 'Scale', options: options.scales },
            { key: 'shiftInchargeIds', label: 'Incharge (Large)', options: options.incharges },
            { key: 'midScaleInchargeIds', label: 'Incharge (Mid)', options: options.incharges }
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
                    <h2 className={styles.modalTitle}>Material Loading Report Filters</h2>
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

                            {/* Source */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Source</label>
                                <SearchableSelect
                                    multiple
                                    name="sourceIds"
                                    value={filters.sourceIds}
                                    options={options.sources}
                                    onChange={handleChange}
                                    placeholder="Select Sources..."
                                />
                            </div>

                            {/* Destination */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Destination</label>
                                <SearchableSelect
                                    multiple
                                    name="destinationIds"
                                    value={filters.destinationIds}
                                    options={options.destinations}
                                    onChange={handleChange}
                                    placeholder="Select Destinations..."
                                />
                            </div>

                            {/* Material */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Material</label>
                                <SearchableSelect
                                    multiple
                                    name="materialIds"
                                    value={filters.materialIds}
                                    options={options.materials}
                                    onChange={handleChange}
                                    placeholder="Select Materials..."
                                />
                            </div>

                            {/* Loading Machine */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Loading Machine</label>
                                <SearchableSelect
                                    multiple
                                    name="loadingMachineIds"
                                    value={filters.loadingMachineIds}
                                    options={options.loaders}
                                    onChange={handleChange}
                                    placeholder="Select Loaders..."
                                />
                            </div>

                            {/* Hauler */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Hauler</label>
                                <SearchableSelect
                                    multiple
                                    name="haulerIds"
                                    value={filters.haulerIds}
                                    options={options.haulers}
                                    onChange={handleChange}
                                    placeholder="Select Haulers..."
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

                            {/* Scale */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Scale</label>
                                <SearchableSelect
                                    multiple
                                    name="scaleIds"
                                    value={filters.scaleIds}
                                    options={options.scales}
                                    onChange={handleChange}
                                    placeholder="Select Scales..."
                                />
                            </div>

                            {/* Shift Incharge - Large Scale */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Shift Incharge - Large Scale</label>
                                <SearchableSelect
                                    multiple
                                    name="shiftInchargeIds"
                                    value={filters.shiftInchargeIds}
                                    options={options.incharges}
                                    onChange={handleChange}
                                    placeholder="Select Large Scale Incharges..."
                                />
                            </div>

                            {/* Shift Incharge - Mid Scale */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Shift Incharge - Mid Scale</label>
                                <SearchableSelect
                                    multiple
                                    name="midScaleInchargeIds"
                                    value={filters.midScaleInchargeIds}
                                    options={options.incharges}
                                    onChange={handleChange}
                                    placeholder="Select Mid Scale Incharges..."
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
