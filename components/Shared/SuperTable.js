'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Download, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx'; // Standard xlsx
import styles from './SuperTable.module.css';

/**
 * SuperTable - A reusable table component with "Excel-like" filtering, full borders, and pagination.
 * 
 * @param {Array} columns - Config for columns [{ header: 'Name', accessor: 'name', type: 'string' | 'number' | 'date' }]
 * @param {Array} data - Array of data objects
 * @param {number} pageSizeDefault - Initial page size
 * @param {boolean} showPagination - Toggle pagination
 * @param {boolean} showSearch - Toggle global search
 * @param {string} title - Table Title for Export
 */
export default function SuperTable({
    columns = [],
    data = [],
    pageSizeDefault = 10,
    showPagination = true,
    showSearch = true,
    title = 'Data Export'
}) {
    // State
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [columnFilters, setColumnFilters] = useState({}); // { accessor: Set(values) }
    const [activeFilterCol, setActiveFilterCol] = useState(null); // accessor of currently open filter dropdown
    const [activeFilterSearch, setActiveFilterSearch] = useState(''); // Search within filter dropdown

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(pageSizeDefault);

    // --- Derived Data: Unique Values for Filters ---
    const uniqueValues = useMemo(() => {
        const values = {};
        columns.forEach(col => {
            const distinct = new Set(data.map(row => row[col.accessor]));
            // Filter out null/undefined/empty
            values[col.accessor] = Array.from(distinct)
                .filter(v => v !== null && v !== undefined && v !== '')
                .sort();
        });
        return values;
    }, [data, columns]);

    // --- Derived Data: Filtered & Sorted ---
    const processedData = useMemo(() => {
        let result = [...data];

        // 1. Global Search
        if (globalSearch) {
            const lowerQuery = globalSearch.toLowerCase();
            result = result.filter(row =>
                columns.some(col =>
                    String(row[col.accessor] || '').toLowerCase().includes(lowerQuery)
                )
            );
        }

        // 2. Column Filters
        Object.keys(columnFilters).forEach(key => {
            const selectedSet = columnFilters[key];
            if (selectedSet && selectedSet.size > 0) {
                result = result.filter(row => selectedSet.has(row[key]));
            }
        });

        // 3. Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, globalSearch, columnFilters, sortConfig, columns]);

    // --- Derived Data: Pagination ---
    const isAll = pageSize === 'All';
    const totalItems = processedData.length;
    const totalPages = isAll ? 1 : Math.ceil(totalItems / pageSize);
    const paginatedData = isAll
        ? processedData
        : processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // --- Handlers ---

    // Sort
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    // Filter Logic
    const toggleFilter = (colKey, value) => {
        setColumnFilters(prev => {
            const prevSet = prev[colKey] || new Set();
            const newSet = new Set(prevSet);
            if (newSet.has(value)) newSet.delete(value);
            else newSet.add(value);

            // If empty, remove key to speed up filtering
            if (newSet.size === 0) {
                const { [colKey]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [colKey]: newSet };
        });
        setCurrentPage(1);
    };

    const handleSelectAll = (colKey) => {
        const allVals = uniqueValues[colKey];
        setColumnFilters(prev => ({ ...prev, [colKey]: new Set(allVals) }));
        setCurrentPage(1);
    };

    const handleClearFilter = (colKey) => {
        setColumnFilters(prev => {
            const { [colKey]: _, ...rest } = prev;
            return rest;
        });
        setCurrentPage(1);
    };

    // Export
    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(processedData); // Export filtered data
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
    };

    // Click Outside to Close Filter
    useEffect(() => {
        const handleClickOutside = () => setActiveFilterCol(null);
        if (activeFilterCol) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeFilterCol]);


    return (
        <div className={styles.wrapper}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.leftTools}>
                    {showSearch && (
                        <div className={styles.searchBox}>
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={globalSearch}
                                onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
                                className={styles.searchInput}
                            />
                        </div>
                    )}

                    {showPagination && (
                        <div className={styles.limitBox} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Show</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value)); setCurrentPage(1); }}
                                className={styles.limitSelect}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value="All">All</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className={styles.rightTools}>
                    <button onClick={handleExport} className={styles.exportBtn}>
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.map((col, idx) => {
                                const isFiltered = columnFilters[col.accessor]?.size > 0;

                                // Preparing Filter Options
                                let filterOptions = uniqueValues[col.accessor] || [];
                                if (activeFilterSearch && activeFilterCol === col.accessor) {
                                    filterOptions = filterOptions.filter(v =>
                                        String(v).toLowerCase().includes(activeFilterSearch.toLowerCase())
                                    );
                                }
                                const selectedSet = columnFilters[col.accessor] || new Set();

                                return (
                                    <th key={col.accessor} className={styles.th} style={{ minWidth: col.width || 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span
                                                onClick={() => handleSort(col.accessor)}
                                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {col.header}
                                                {sortConfig.key === col.accessor && (
                                                    <span style={{ fontSize: '10px' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                                )}
                                            </span>

                                            {/* Filter Icon */}
                                            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                                                <Filter
                                                    size={12}
                                                    className={isFiltered ? 'text-blue-600 fill-blue-600' : 'text-gray-400 hover:text-gray-600'}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => {
                                                        if (activeFilterCol === col.accessor) setActiveFilterCol(null);
                                                        else {
                                                            setActiveFilterCol(col.accessor);
                                                            setActiveFilterSearch('');
                                                        }
                                                    }}
                                                />

                                                {/* Filter Dropdown */}
                                                {activeFilterCol === col.accessor && (
                                                    <div className={styles.filterDropdown}>
                                                        {/* Header */}
                                                        <div className={styles.filterHeader}>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <span onClick={() => handleSelectAll(col.accessor)} style={{ cursor: 'pointer', color: '#2563eb', fontSize: '11px', textDecoration: 'underline' }}>All</span>
                                                                <span onClick={() => handleClearFilter(col.accessor)} style={{ cursor: 'pointer', color: '#ef4444', fontSize: '11px', textDecoration: 'underline' }}>Clear</span>
                                                            </div>
                                                            <X size={12} style={{ cursor: 'pointer' }} onClick={() => setActiveFilterCol(null)} />
                                                        </div>

                                                        {/* Search */}
                                                        <div style={{ padding: '6px' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Search..."
                                                                value={activeFilterSearch}
                                                                onChange={e => setActiveFilterSearch(e.target.value)}
                                                                style={{ width: '100%', fontSize: '11px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                                                            />
                                                        </div>

                                                        {/* List */}
                                                        <div className={styles.filterList}>
                                                            {filterOptions.length > 0 ? filterOptions.map(val => (
                                                                <label key={val} className={styles.filterItem}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={columnFilters[col.accessor]?.has(val) || false}
                                                                        onChange={() => toggleFilter(col.accessor, val)}
                                                                    />
                                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={val}>{val}</span>
                                                                </label>
                                                            )) : (
                                                                <div style={{ padding: '8px', color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>No matches</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, idx) => {
                                const globalIndex = (currentPage - 1) * (pageSize === 'All' ? 0 : pageSize) + idx + 1;
                                return (
                                    <tr key={idx} className={styles.tr}>
                                        {columns.map(col => (
                                            <td key={col.accessor} className={styles.td} style={{ textAlign: col.align || 'left' }}>
                                                {col.render ? col.render(row[col.accessor], row, globalIndex) : row[col.accessor]}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                                    No records found matching filters
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {showPagination && !isAll && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div className={styles.stats}>
                        Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={styles.navBtn}>
                            <ChevronsLeft size={16} />
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={styles.navBtn}>
                            <ChevronLeft size={16} />
                        </button>

                        <span style={{ fontSize: '13px', fontWeight: 500, padding: '0 8px' }}>
                            Page {currentPage} of {totalPages}
                        </span>

                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={styles.navBtn}>
                            <ChevronRight size={16} />
                        </button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={styles.navBtn}>
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
