'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { MASTER_CONFIG } from '@/lib/masterConfig';
import MasterTable from '@/components/MasterTable';
import { toast } from 'sonner';
import { 
    Search, Loader2, Save, X, Trash2, Sliders, Settings, Sparkles,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Tag 
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import tableStyles from '@/components/DataTable.module.css';

export default function QtyTripMappingPage() {
    const [activeTab, setActiveTab] = useState('equipment'); // Default to the new Equipment mapping
    const [equipments, setEquipments] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination states
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [hoveredRowId, setHoveredRowId] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [mgmtQty, setMgmtQty] = useState('');
    const [ntpcQty, setNtpcQty] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Unit Modal state & fetcher
    const [units, setUnits] = useState([]);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [selectedMaterialForUnit, setSelectedMaterialForUnit] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState('');
    const [isSavingUnit, setIsSavingUnit] = useState(false);

    const fetchUnits = async () => {
        try {
            const res = await fetch('/api/settings/ddl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: 'unit',
                    nameField: 'Name',
                    valueField: 'SlNo'
                })
            });
            if (res.ok) {
                const data = await res.json();
                setUnits(data || []);
            }
        } catch (error) {
            console.error('Fetch units DDL error:', error);
        }
    };

    // Fetch master mappings data
    const fetchMatrixData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/equipment-load-factor');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setEquipments(data.equipments || []);
                    setMaterials(data.materials || []);
                    setMappings(data.mappings || []);
                } else {
                    toast.error(data.message || 'Failed to load mappings');
                }
            } else {
                toast.error('HTTP Error loading mappings');
            }
        } catch (error) {
            console.error('Fetch matrix mapping error:', error);
            toast.error('Network error loading load factor matrix');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'equipment') {
            fetchMatrixData();
            fetchUnits();
        }
    }, [activeTab]);

    // Create lookup index for mappings for O(1) cell lookup
    // Key format: "EquipmentId_MaterialId"
    const mappingIndex = useMemo(() => {
        const index = {};
        mappings.forEach(m => {
            index[`${m.EquipmentId}_${m.MaterialId}`] = {
                ManagementQtyTrip: m.ManagementQtyTrip,
                NTPCQtyTrip: m.NTPCQtyTrip
            };
        });
        return index;
    }, [mappings]);

    // Filtered equipment list based on search bar
    const filteredEquipments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return equipments;
        return equipments.filter(eq => 
            (eq.EuipmentID && eq.EuipmentID.toLowerCase().includes(query)) ||
            (eq.EquipmentName && eq.EquipmentName.toLowerCase().includes(query))
        );
    }, [equipments, searchQuery]);

    // Reset pagination to first page when search or page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, pageSize]);

    // Pagination calculations
    const totalItems = filteredEquipments.length;
    const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalItems / pageSize);

    const paginatedEquipments = useMemo(() => {
        if (pageSize === 'ALL') return filteredEquipments;
        const start = (currentPage - 1) * pageSize;
        return filteredEquipments.slice(start, start + pageSize);
    }, [filteredEquipments, currentPage, pageSize]);

    // Handle opening edit modal for a specific cell
    const handleCellClick = (eq, mat) => {
        setSelectedEquipment(eq);
        setSelectedMaterial(mat);

        // Fetch existing mapping values
        const existing = mappingIndex[`${eq.SlNo}_${mat.SlNo}`];
        if (existing) {
            setMgmtQty(existing.ManagementQtyTrip !== null ? existing.ManagementQtyTrip.toString() : '');
            setNtpcQty(existing.NTPCQtyTrip !== null ? existing.NTPCQtyTrip.toString() : '');
        } else {
            setMgmtQty('');
            setNtpcQty('');
        }

        setIsModalOpen(true);
    };

    // Safe input filter: only decimals with up to 2 decimal places allowed
    const handleDecimalInputChange = (value, setter) => {
        // Enforce: Empty, or valid positive decimal number with up to 2 decimal places
        if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
            setter(value);
        }
    };

    // Save mapping cell values
    const handleSaveMapping = async () => {
        if (!selectedEquipment || !selectedMaterial) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/settings/equipment-load-factor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    EquipmentId: selectedEquipment.SlNo,
                    MaterialId: selectedMaterial.SlNo,
                    ManagementQtyTrip: mgmtQty === '' ? null : mgmtQty,
                    NTPCQtyTrip: ntpcQty === '' ? null : ntpcQty
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success(`Updated mapping for ${selectedEquipment.EuipmentID} & ${selectedMaterial.MaterialName}`);
                    setIsModalOpen(false);
                    // Refresh data in background
                    fetchMatrixData();
                } else {
                    toast.error(data.message || 'Failed to save mapping');
                }
            } else {
                toast.error('HTTP Error saving mapping configuration');
            }
        } catch (error) {
            console.error('Save mapping error:', error);
            toast.error('Network error saving load factors');
        } finally {
            setIsSaving(false);
        }
    };

    // Clear mapping cell values (sets to deleted/null)
    const handleClearMapping = async () => {
        if (!selectedEquipment || !selectedMaterial) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/settings/equipment-load-factor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    EquipmentId: selectedEquipment.SlNo,
                    MaterialId: selectedMaterial.SlNo,
                    ManagementQtyTrip: null,
                    NTPCQtyTrip: null
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success('Mapping cleared successfully');
                    setIsModalOpen(false);
                    fetchMatrixData();
                } else {
                    toast.error(data.message || 'Failed to clear mapping');
                }
            } else {
                toast.error('HTTP Error clearing mapping');
            }
        } catch (error) {
            console.error('Clear mapping error:', error);
            toast.error('Network error clearing load factors');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle material header click to open unit change modal
    const handleMaterialHeaderClick = (mat) => {
        setSelectedMaterialForUnit(mat);
        setSelectedUnitId(mat.UnitId !== null && mat.UnitId !== undefined ? mat.UnitId.toString() : '');
        setIsUnitModalOpen(true);
    };

    // Save material unit assignment
    const handleSaveMaterialUnit = async () => {
        if (!selectedMaterialForUnit) return;
        setIsSavingUnit(true);
        try {
            const res = await fetch('/api/settings/crud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: 'TblMaterial',
                    action: 'update',
                    id: selectedMaterialForUnit.SlNo,
                    data: {
                        UnitId: selectedUnitId === '' ? null : Number(selectedUnitId)
                    }
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success || !data.error) {
                    toast.success(`Updated unit for ${selectedMaterialForUnit.MaterialName}`);
                    setIsUnitModalOpen(false);
                    fetchMatrixData();
                } else {
                    toast.error(data.error || 'Failed to update material unit');
                }
            } else {
                toast.error('HTTP Error updating material unit');
            }
        } catch (error) {
            console.error('Update material unit error:', error);
            toast.error('Network error updating material unit');
        } finally {
            setIsSavingUnit(false);
        }
    };

    // Export Load Factor Matrix to Excel with Multi-Level Merged Headers
    const handleExportExcel = () => {
        try {
            // Define top level headers
            const headerRow1 = ['Sl No', 'Equipment ID', 'Equipment Name'];
            const headerRow2 = ['', '', ''];

            materials.forEach(mat => {
                headerRow1.push(mat.MaterialName, ''); // Span 2 columns for each material
                headerRow2.push('Mgmt', 'NTPC');
            });

            // Map all rows
            const rows = filteredEquipments.map((eq, idx) => {
                const row = [
                    idx + 1,
                    eq.EuipmentID || '',
                    eq.EquipmentName || ''
                ];

                materials.forEach(mat => {
                    const mapVal = mappingIndex[`${eq.SlNo}_${mat.SlNo}`];
                    const mgmt = mapVal && mapVal.ManagementQtyTrip !== null ? mapVal.ManagementQtyTrip : '';
                    const ntpc = mapVal && mapVal.NTPCQtyTrip !== null ? mapVal.NTPCQtyTrip : '';
                    row.push(mgmt, ntpc);
                });

                return row;
            });

            const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...rows]);

            // Add merges for Material columns in header row 1
            if (!ws['!merges']) ws['!merges'] = [];
            
            // Merge Sl No, Equipment ID, Equipment Name vertically (Row 0 to 1)
            ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
            ws['!merges'].push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });
            ws['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 1, c: 2 } });

            // Merge each Material Name horizontally (col to col + 1)
            materials.forEach((mat, idx) => {
                const colIndex = 3 + idx * 2;
                ws['!merges'].push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 1 } });
            });

            // Style headers
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cell1 = ws[XLSX.utils.encode_cell({ r: 0, c })];
                if (cell1) {
                    cell1.s = {
                        fill: { fgColor: { rgb: 'EFF6FF' } },
                        font: { bold: true, color: { rgb: '1E40AF' }, sz: 10 },
                        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                        border: {
                            top: { style: 'thin', color: { rgb: 'CBD5E1' } },
                            bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
                            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
                            right: { style: 'thin', color: { rgb: 'CBD5E1' } }
                        }
                    };
                }
                const cell2 = ws[XLSX.utils.encode_cell({ r: 1, c })];
                if (cell2) {
                    cell2.s = {
                        fill: { fgColor: { rgb: 'F8FAFC' } },
                        font: { bold: true, color: { rgb: '475569' }, sz: 9 },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: {
                            top: { style: 'thin', color: { rgb: 'CBD5E1' } },
                            bottom: { style: 'medium', color: { rgb: '94A3B8' } },
                            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
                            right: { style: 'thin', color: { rgb: 'CBD5E1' } }
                        }
                    };
                }
            }

            // Set column widths dynamically
            const colWidths = [
                { wch: 8 },  // Sl No
                { wch: 18 }, // Equipment ID
                { wch: 28 }  // Equipment Name
            ];
            materials.forEach(() => {
                colWidths.push({ wch: 10 }, { wch: 10 });
            });
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Load Factor Overrides');
            
            XLSX.writeFile(wb, 'Equipment_Load_Factor_Mapping.xlsx');
            toast.success('Excel Export completed successfully!');
        } catch (error) {
            console.error('Export Excel failed:', error);
            toast.error('Failed to export load factor matrix to Excel');
        }
    };

    return (
        <div style={{
            padding: '1.5rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            background: 'var(--background)',
            color: 'var(--foreground)'
        }}>
            {/* Header Title */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '800',
                    color: 'var(--foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    letterSpacing: '-0.025em'
                }}>
                    <Sliders style={{ color: '#2563eb' }} size={28} />
                    Qty Trip Mapping
                </h1>

                {/* Tabs bar */}
                <div style={{
                    display: 'flex',
                    background: '#f1f5f9',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
                }}>
                    <button
                        onClick={() => setActiveTab('equipment')}
                        style={{
                            padding: '8px 16px',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeTab === 'equipment' ? '#ffffff' : 'transparent',
                            color: activeTab === 'equipment' ? '#2563eb' : '#64748b',
                            boxShadow: activeTab === 'equipment' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' : 'none'
                        }}
                    >
                        <Sparkles size={16} />
                        Equipment Load Factor Mapping
                    </button>
                    <button
                        onClick={() => setActiveTab('group')}
                        style={{
                            padding: '8px 16px',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: activeTab === 'group' ? '#ffffff' : 'transparent',
                            color: activeTab === 'group' ? '#2563eb' : '#64748b',
                            boxShadow: activeTab === 'group' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' : 'none'
                        }}
                    >
                        <Settings size={16} />
                        Equipment Group Mapping
                    </button>
                </div>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'group' ? (
                <div style={{ flex: 1, height: '100%' }}>
                    <MasterTable config={MASTER_CONFIG['qty-trip-mapping']} title="Equipment Group Qty Trip Mapping" />
                </div>
            ) : (
                <div style={{
                    flex: 1,
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Search and Filters area */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.25rem',
                        gap: '1rem'
                    }}>
                        <div style={{ position: 'relative', width: '380px' }}>
                            <span style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Search size={18} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search Equipment ID or Long Text..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 38px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.875rem',
                                    outline: 'none',
                                    background: '#f8fafc',
                                    color: '#0f172a',
                                    transition: 'all 0.2s ease'
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#2563eb';
                                    e.target.style.background = '#ffffff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#cbd5e1';
                                    e.target.style.background = '#f8fafc';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        padding: 0
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
                            Showing <b>{paginatedEquipments.length}</b> of <b>{totalItems}</b> Equipments
                        </span>
                    </div>

                    {/* Table View with Sticky Columns */}
                    {loading ? (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            color: '#64748b'
                        }}>
                            <Loader2 className="animate-spin" size={32} style={{ color: '#2563eb' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading mappings matrix grid...</span>
                        </div>
                    ) : (
                        <div style={{
                            flex: 1,
                            width: '100%',
                            maxWidth: '100%',
                            overflowX: 'auto',
                            overflowY: 'auto',
                            border: '1px solid #cbd5e1',
                            borderRadius: '12px',
                            boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
                            background: '#ffffff',
                            position: 'relative',
                            minHeight: 0
                        }}>
                            <table style={{
                                width: 'max-content',
                                minWidth: '100%',
                                borderCollapse: 'separate',
                                borderSpacing: 0,
                                textAlign: 'left',
                                fontSize: '0.875rem'
                            }}>
                                <thead style={{
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 20,
                                    background: '#f8fafc',
                                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                                }}>
                                    {/* First Header Row: Material Names */}
                                    <tr>
                                        <th rowSpan={2} style={{
                                            padding: '12px 10px',
                                            fontWeight: '700',
                                            background: '#f8fafc',
                                            borderBottom: '2px solid #cbd5e1',
                                            borderRight: '1px solid #cbd5e1',
                                            width: '60px',
                                            minWidth: '60px',
                                            maxWidth: '60px',
                                            boxSizing: 'border-box',
                                            color: '#334155',
                                            textAlign: 'center',
                                            position: 'sticky',
                                            left: 0,
                                            top: 0,
                                            zIndex: 30
                                        }}>SI No</th>
                                        <th rowSpan={2} style={{
                                            padding: '12px 16px',
                                            fontWeight: '700',
                                            background: '#f8fafc',
                                            borderBottom: '2px solid #cbd5e1',
                                            borderRight: '2px solid #cbd5e1',
                                            width: '220px',
                                            minWidth: '220px',
                                            maxWidth: '220px',
                                            boxSizing: 'border-box',
                                            color: '#334155',
                                            position: 'sticky',
                                            left: '60px',
                                            top: 0,
                                            zIndex: 30,
                                            boxShadow: '4px 0 6px -4px rgba(0,0,0,0.15)'
                                        }}>Equipment Short & Long Text</th>
                                        
                                        {materials.map(mat => (
                                            <th 
                                                key={mat.SlNo} 
                                                colSpan={2} 
                                                onClick={() => handleMaterialHeaderClick(mat)}
                                                title="Click to assign/update Material Unit"
                                                style={{
                                                    padding: '8px 12px',
                                                    fontWeight: '700',
                                                    background: '#eff6ff',
                                                    borderBottom: '1px solid #bfdbfe',
                                                    borderRight: '1px solid #cbd5e1',
                                                    color: '#1e40af',
                                                    textAlign: 'center',
                                                    fontSize: '0.8rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.025em',
                                                    width: '180px',
                                                    minWidth: '180px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseOver={e => {
                                                    e.currentTarget.style.backgroundColor = '#dbeafe';
                                                    e.currentTarget.style.color = '#1d4ed8';
                                                }}
                                                onMouseOut={e => {
                                                    e.currentTarget.style.backgroundColor = '#eff6ff';
                                                    e.currentTarget.style.color = '#1e40af';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                    {mat.MaterialName}{mat.UnitName ? `(${mat.UnitName})` : ''}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                    {/* Second Header Row: Mgmt & NTPC */}
                                    <tr>
                                        {materials.map(mat => (
                                            <Fragment key={`${mat.SlNo}_second_header`}>
                                                <th key={`${mat.SlNo}_mgmt`} style={{
                                                    padding: '6px 12px',
                                                    fontWeight: '600',
                                                    background: '#f0fdf4',
                                                    borderBottom: '2px solid #cbd5e1',
                                                    borderRight: '1px solid #e2e8f0',
                                                    color: '#166534',
                                                    textAlign: 'center',
                                                    fontSize: '0.75rem',
                                                    width: '90px',
                                                    minWidth: '90px'
                                                }}>Mgmt</th>
                                                <th key={`${mat.SlNo}_ntpc`} style={{
                                                    padding: '6px 12px',
                                                    fontWeight: '600',
                                                    background: '#fffbeb',
                                                    borderBottom: '2px solid #cbd5e1',
                                                    borderRight: '1px solid #cbd5e1',
                                                    color: '#9a3412',
                                                    textAlign: 'center',
                                                    fontSize: '0.75rem',
                                                    width: '90px',
                                                    minWidth: '90px'
                                                }}>NTPC</th>
                                            </Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEquipments.length === 0 ? (
                                        <tr>
                                            <td colSpan={2 + materials.length * 2} style={{
                                                padding: '3rem',
                                                textAlign: 'center',
                                                color: '#94a3b8',
                                                fontWeight: '500'
                                            }}>
                                                No equipment matched your search term.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedEquipments.map((eq, index) => {
                                            const globalIndex = pageSize === 'ALL' ? index + 1 : (currentPage - 1) * pageSize + index + 1;
                                            const isHovered = hoveredRowId === eq.SlNo;
                                            const rowBg = isHovered ? '#f1f5f9' : (index % 2 === 0 ? '#ffffff' : '#f8fafc');

                                            return (
                                                <tr 
                                                    key={eq.SlNo} 
                                                    onMouseEnter={() => setHoveredRowId(eq.SlNo)}
                                                    onMouseLeave={() => setHoveredRowId(null)}
                                                    style={{
                                                        background: rowBg,
                                                        borderBottom: '1px solid #cbd5e1',
                                                        transition: 'background 0.15s ease'
                                                    }}
                                                >
                                                    {/* SI No - Sticky Column 1 */}
                                                    <td style={{
                                                        padding: '12px 10px',
                                                        borderBottom: '1px solid #cbd5e1',
                                                        borderRight: '1px solid #cbd5e1',
                                                        color: '#64748b',
                                                        fontWeight: '600',
                                                        textAlign: 'center',
                                                        position: 'sticky',
                                                        left: 0,
                                                        zIndex: 2,
                                                        background: rowBg,
                                                        transition: 'background 0.15s ease',
                                                        width: '60px',
                                                        minWidth: '60px',
                                                        maxWidth: '60px',
                                                        boxSizing: 'border-box'
                                                    }}>{globalIndex}</td>
                                                    {/* Equipment Name - Sticky Column 2 */}
                                                    <td style={{
                                                        padding: '12px 16px',
                                                        borderBottom: '1px solid #cbd5e1',
                                                        borderRight: '2px solid #cbd5e1',
                                                        color: '#0f172a',
                                                        fontWeight: '600',
                                                        position: 'sticky',
                                                        left: '60px',
                                                        zIndex: 2,
                                                        background: rowBg,
                                                        transition: 'background 0.15s ease',
                                                        boxShadow: '4px 0 6px -4px rgba(0,0,0,0.15)',
                                                        width: '220px',
                                                        minWidth: '220px',
                                                        maxWidth: '220px',
                                                        boxSizing: 'border-box'
                                                    }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>{eq.EuipmentID}</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '400', marginTop: '2px' }}>{eq.EquipmentName}</span>
                                                        </div>
                                                    </td>

                                                    {/* Materials Load Factors */}
                                                    {materials.map(mat => {
                                                        const mapVal = mappingIndex[`${eq.SlNo}_${mat.SlNo}`];
                                                        const mgmt = mapVal && mapVal.ManagementQtyTrip !== null ? mapVal.ManagementQtyTrip : null;
                                                        const ntpc = mapVal && mapVal.NTPCQtyTrip !== null ? mapVal.NTPCQtyTrip : null;

                                                        return (
                                                            <Fragment key={`${eq.SlNo}_${mat.SlNo}`}>
                                                                {/* Mgmt cell */}
                                                                <td 
                                                                    onClick={() => handleCellClick(eq, mat)}
                                                                    style={{
                                                                        padding: '12px 6px',
                                                                        borderBottom: '1px solid #cbd5e1',
                                                                        borderRight: '1px solid #e2e8f0',
                                                                        textAlign: 'center',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '700',
                                                                        color: '#15803d',
                                                                        fontSize: '0.875rem',
                                                                        transition: 'all 0.15s ease',
                                                                        backgroundColor: mgmt !== null ? '#f0fdf4' : 'transparent',
                                                                        width: '90px',
                                                                        minWidth: '90px'
                                                                    }}
                                                                    onMouseOver={e => {
                                                                        e.currentTarget.style.backgroundColor = '#dcfce7';
                                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                                                                        e.currentTarget.style.zIndex = 5;
                                                                    }}
                                                                    onMouseOut={e => {
                                                                        e.currentTarget.style.backgroundColor = mgmt !== null ? '#f0fdf4' : 'transparent';
                                                                        e.currentTarget.style.transform = 'none';
                                                                        e.currentTarget.style.boxShadow = 'none';
                                                                    }}
                                                                >
                                                                    {mgmt !== null ? mgmt.toFixed(2) : ''}
                                                                </td>
                                                                {/* NTPC cell */}
                                                                <td 
                                                                    onClick={() => handleCellClick(eq, mat)}
                                                                    style={{
                                                                        padding: '12px 6px',
                                                                        borderBottom: '1px solid #cbd5e1',
                                                                        borderRight: '1px solid #cbd5e1',
                                                                        textAlign: 'center',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '700',
                                                                        color: '#c2410c',
                                                                        fontSize: '0.875rem',
                                                                        transition: 'all 0.15s ease',
                                                                        backgroundColor: ntpc !== null ? '#fffbeb' : 'transparent',
                                                                        width: '90px',
                                                                        minWidth: '90px'
                                                                    }}
                                                                    onMouseOver={e => {
                                                                        e.currentTarget.style.backgroundColor = '#fef3c7';
                                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                                                                        e.currentTarget.style.zIndex = 5;
                                                                    }}
                                                                    onMouseOut={e => {
                                                                        e.currentTarget.style.backgroundColor = ntpc !== null ? '#fffbeb' : 'transparent';
                                                                        e.currentTarget.style.transform = 'none';
                                                                        e.currentTarget.style.boxShadow = 'none';
                                                                    }}
                                                                >
                                                                    {ntpc !== null ? ntpc.toFixed(2) : ''}
                                                                </td>
                                                            </Fragment>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Toolbar */}
                    {!loading && filteredEquipments.length > 0 && (
                        <div className={tableStyles.toolbar} style={{ 
                            marginTop: '1rem', 
                            border: '1px solid #cbd5e1', 
                            borderRadius: '10px', 
                            background: '#f8fafc',
                            padding: '10px 12px',
                            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                        }}>
                            <div className={tableStyles.leftTools}>
                                <div className={tableStyles.limitBox}>
                                    <span>Rows per page:</span>
                                    <select 
                                        value={pageSize} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            setPageSize(val === 'ALL' ? 'ALL' : Number(val));
                                        }}
                                        className={tableStyles.limitSelect}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value="ALL">All</option>
                                    </select>
                                </div>
                            </div>

                            <div className={tableStyles.stats}>
                                <span>Showing <b>{paginatedEquipments.length}</b> of <b>{totalItems}</b> (Total: {equipments.length}) Equipments</span>
                            </div>

                            <div className={tableStyles.rightTools}>
                                <button 
                                    onClick={() => setCurrentPage(1)} 
                                    disabled={currentPage === 1 || pageSize === 'ALL'} 
                                    className={tableStyles.navBtn} 
                                    title="First Page"
                                >
                                    <ChevronsLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={currentPage === 1 || pageSize === 'ALL'} 
                                    className={tableStyles.navBtn} 
                                    title="Previous Page"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ fontSize: '13px', fontWeight: '600', margin: '0 8px', color: '#475569' }}>
                                    Page {currentPage} / {totalPages || 1}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={currentPage === totalPages || pageSize === 'ALL'} 
                                    className={tableStyles.navBtn} 
                                    title="Next Page"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(totalPages)} 
                                    disabled={currentPage === totalPages || pageSize === 'ALL'} 
                                    className={tableStyles.navBtn} 
                                    title="Last Page"
                                >
                                    <ChevronsRight size={16} />
                                </button>
                                
                                {/* Export Button */}
                                <button onClick={handleExportExcel} className={tableStyles.exportBtn} style={{ marginLeft: '8px', cursor: 'pointer' }}>
                                    <Download size={14} /> Export
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PRESET MODAL POPUP */}
            {isModalOpen && selectedEquipment && selectedMaterial && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(6px)'
                }}>
                    <div style={{
                        width: '450px',
                        background: '#ffffff',
                        borderRadius: '20px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                            padding: '1.25rem 1.5rem',
                            color: '#ffffff',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Update Load Factors</h3>
                                <span style={{ opacity: 0.8, fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Individual Mapping Override</span>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    color: '#ffffff',
                                    borderRadius: '50%',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Details summary */}
                        <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Equipment</span>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e3a8a', marginTop: '2px' }}>{selectedEquipment.EuipmentID}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedEquipment.EquipmentName}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Material</span>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a', marginTop: '2px' }}>{selectedMaterial.MaterialName}</div>
                                </div>
                            </div>
                        </div>

                        {/* Input Fields Form */}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                                    Management Load Factor
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter qty (e.g. 15.50)"
                                    value={mgmtQty}
                                    onChange={e => handleDecimalInputChange(e.target.value, setMgmtQty)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                                    NTPC Load Factor
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter qty (e.g. 12.00)"
                                    value={ntpcQty}
                                    onChange={e => handleDecimalInputChange(e.target.value, setNtpcQty)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                                />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '-4px' }}>
                                * Only decimal numbers with up to 2 decimal places are accepted.
                            </span>
                        </div>

                        {/* Modal Footer Controls */}
                        <div style={{
                            padding: '1rem 1.5rem 1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid #f1f5f9',
                            background: '#f8fafc'
                        }}>
                            {/* Delete/Clear Button */}
                            <button
                                onClick={handleClearMapping}
                                disabled={isSaving}
                                style={{
                                    padding: '10px 14px',
                                    background: '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'opacity 0.2s',
                                    opacity: isSaving ? 0.6 : 1
                                }}
                            >
                                <Trash2 size={16} />
                                Clear
                            </button>

                            {/* Save/Cancel Group */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSaving}
                                    style={{
                                        padding: '10px 16px',
                                        background: '#e2e8f0',
                                        color: '#475569',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveMapping}
                                    disabled={isSaving}
                                    style={{
                                        padding: '10px 18px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'none'}
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Save Mapping
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MATERIAL UNIT SELECTION MODAL */}
            {isUnitModalOpen && selectedMaterialForUnit && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(6px)'
                }}>
                    <div style={{
                        width: '420px',
                        background: '#ffffff',
                        borderRadius: '20px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        animation: 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        {/* Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
                            padding: '1.25rem 1.5rem',
                            color: '#ffffff',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Set Material Unit</h3>
                                <span style={{ opacity: 0.8, fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Update Material Master default unit</span>
                            </div>
                            <button
                                onClick={() => setIsUnitModalOpen(false)}
                                style={{
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                    color: '#ffffff',
                                    borderRadius: '50%',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Details summary */}
                        <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Selected Material</span>
                                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#312e81', marginTop: '2px' }}>{selectedMaterialForUnit.MaterialName}</div>
                            </div>
                        </div>

                        {/* Form area */}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                    Select Master Unit
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        pointerEvents: 'none'
                                    }}>
                                        <Tag size={16} />
                                    </span>
                                    <select
                                        value={selectedUnitId}
                                        onChange={e => setSelectedUnitId(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px 10px 38px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                            background: '#f8fafc',
                                            color: '#0f172a',
                                            transition: 'all 0.2s',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={e => {
                                            e.target.style.borderColor = '#4338ca';
                                            e.target.style.background = '#ffffff';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(67, 56, 202, 0.1)';
                                        }}
                                        onBlur={e => {
                                            e.target.style.borderColor = '#cbd5e1';
                                            e.target.style.background = '#f8fafc';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        <option value="">-- Select Unit --</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <span style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#64748b',
                                        pointerEvents: 'none',
                                        fontSize: '0.75rem'
                                    }}>▼</span>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
                                * Changing this unit will automatically sync headers here and dynamically assign standard units during mining entries.
                            </span>
                        </div>

                        {/* Modal Footer Controls */}
                        <div style={{
                            padding: '1rem 1.5rem 1.5rem',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            borderTop: '1px solid #f1f5f9',
                            background: '#f8fafc'
                        }}>
                            <button
                                onClick={() => setIsUnitModalOpen(false)}
                                disabled={isSavingUnit}
                                style={{
                                    padding: '10px 16px',
                                    background: '#e2e8f0',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveMaterialUnit}
                                disabled={isSavingUnit}
                                style={{
                                    padding: '10px 18px',
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'none'}
                            >
                                {isSavingUnit ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                Save Unit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Inline CSS animation definition */}
            <style jsx global>{`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
