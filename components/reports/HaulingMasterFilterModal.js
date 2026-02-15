'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';
import styles from './HaulingMasterFilterModal.module.css';
import { toast } from 'sonner';

export default function HaulingMasterFilterModal({ isOpen, onClose, onApply, initialFilters }) {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState({
        shifts: [],
        operators: [],
        haulers: [],
        haulerModels: []
    });

    const [filters, setFilters] = useState({
        shiftIds: [],
        operatorIds: [],
        haulerIds: [],
        haulerModelIds: []
    });

    // Load initial filters when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialFilters) {
                setFilters(prev => ({ ...prev, ...initialFilters }));
            }
            fetchOptions();
        }
    }, [isOpen, initialFilters]);

    const fetchOptions = async () => {
        // Prevent refetching if already loaded (optional optimization, but data might change)
        if (options.shifts.length > 0) return;

        setLoading(true);
        try {
            const res = await fetch('/api/reports/hauling-master/helpers');
            const data = await res.json();
            if (res.ok) {
                setOptions({
                    shifts: data.shifts || [],
                    operators: data.operators || [],
                    haulers: data.haulers || [],
                    haulerModels: data.haulerModels || []
                });
            } else {
                toast.error("Failed to load filter options");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error loading filter options");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleApply = () => {
        // Generate summary text
        const activeFilters = [];
        if (filters.shiftIds?.length) activeFilters.push(`${filters.shiftIds.length} Shifts`);
        if (filters.operatorIds?.length) activeFilters.push(`${filters.operatorIds.length} Operators`);
        if (filters.haulerIds?.length) activeFilters.push(`${filters.haulerIds.length} Haulers`);
        if (filters.haulerModelIds?.length) activeFilters.push(`${filters.haulerModelIds.length} Models`);

        const summary = activeFilters.length > 0 ? activeFilters.join(', ') : '';

        onApply(filters, summary);
        onClose();
    };

    const handleReset = () => {
        setFilters({
            shiftIds: [],
            operatorIds: [],
            haulerIds: [],
            haulerModelIds: []
        });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Hauling Master Report Filters</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {loading ? (
                        <div className="col-span-2 text-center py-8 text-gray-500">Loading options...</div>
                    ) : (
                        <>
                            {/* Shift */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Shift</label>
                                <SearchableSelect
                                    options={options.shifts}
                                    value={filters.shiftIds}
                                    onChange={(e) => handleFilterChange('shiftIds', e.target.value)}
                                    placeholder="Select Shifts..."
                                    multiple={true}
                                />
                            </div>

                            {/* Operator */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Operator</label>
                                <SearchableSelect
                                    options={options.operators}
                                    value={filters.operatorIds}
                                    onChange={(e) => handleFilterChange('operatorIds', e.target.value)}
                                    placeholder="Select Operators..."
                                    multiple={true}
                                />
                            </div>

                            {/* Hauler */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Hauler</label>
                                <SearchableSelect
                                    options={options.haulers}
                                    value={filters.haulerIds}
                                    onChange={(e) => handleFilterChange('haulerIds', e.target.value)}
                                    placeholder="Select Haulers..."
                                    multiple={true}
                                />
                            </div>

                            {/* Hauler Model */}
                            <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Hauler Model</label>
                                <SearchableSelect
                                    options={options.haulerModels}
                                    value={filters.haulerModelIds}
                                    onChange={(e) => handleFilterChange('haulerModelIds', e.target.value)}
                                    placeholder="Select Hauler Models..."
                                    multiple={true}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.resetBtn} onClick={handleReset}>
                        <RefreshCw size={16} />
                        Reset All
                    </button>
                    <button className={styles.applyBtn} onClick={handleApply}>
                        <Check size={16} />
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
