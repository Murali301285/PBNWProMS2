'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { MASTER_CONFIG } from '@/lib/masterConfig';
import MasterTable from '@/components/MasterTable';
import { toast } from 'sonner';
import { Search, Loader2, Save, X, Trash2, Sliders, Settings, Sparkles } from 'lucide-react';

export default function QtyTripMappingPage() {
    const [activeTab, setActiveTab] = useState('equipment'); // Default to the new Equipment mapping
    const [equipments, setEquipments] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [mgmtQty, setMgmtQty] = useState('');
    const [ntpcQty, setNtpcQty] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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

                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                            Showing <b>{filteredEquipments.length}</b> of <b>{equipments.length}</b> Equipments
                        </span>
                    </div>

                    {/* Table View */}
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
                            overflow: 'auto',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.02)'
                        }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'separate',
                                borderSpacing: 0,
                                textAlign: 'left',
                                fontSize: '0.875rem'
                            }}>
                                <thead style={{
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10,
                                    background: '#f8fafc',
                                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                                }}>
                                    {/* First Header Row: Material Names */}
                                    <tr>
                                        <th rowSpan={2} style={{
                                            padding: '12px 16px',
                                            fontWeight: '700',
                                            background: '#f8fafc',
                                            borderBottom: '2px solid #cbd5e1',
                                            borderRight: '1px solid #e2e8f0',
                                            width: '60px',
                                            color: '#334155',
                                            textAlign: 'center'
                                        }}>SI No</th>
                                        <th rowSpan={2} style={{
                                            padding: '12px 16px',
                                            fontWeight: '700',
                                            background: '#f8fafc',
                                            borderBottom: '2px solid #cbd5e1',
                                            borderRight: '2px solid #cbd5e1',
                                            minWidth: '220px',
                                            color: '#334155'
                                        }}>Equipment Short & Long Text</th>
                                        
                                        {materials.map(mat => (
                                            <th key={mat.SlNo} colSpan={2} style={{
                                                padding: '8px 12px',
                                                fontWeight: '700',
                                                background: '#eff6ff',
                                                borderBottom: '1px solid #bfdbfe',
                                                borderRight: '1px solid #cbd5e1',
                                                color: '#1e40af',
                                                textAlign: 'center',
                                                fontSize: '0.8rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.025em'
                                            }}>
                                                {mat.MaterialName}
                                            </th>
                                        ))}
                                    </tr>
                                    {/* Second Header Row: Mgmt & NTPC */}
                                    <tr>
                                        {materials.map(mat => (
                                            <Fragment key={mat.SlNo}>
                                                <th key={`${mat.SlNo}_mgmt`} style={{
                                                    padding: '6px 12px',
                                                    fontWeight: '600',
                                                    background: '#f0fdf4',
                                                    borderBottom: '2px solid #cbd5e1',
                                                    borderRight: '1px solid #e2e8f0',
                                                    color: '#166534',
                                                    textAlign: 'center',
                                                    fontSize: '0.75rem',
                                                    width: '90px'
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
                                                    width: '90px'
                                                }}>NTPC</th>
                                            </Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEquipments.length === 0 ? (
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
                                        filteredEquipments.map((eq, index) => (
                                            <tr key={eq.SlNo} style={{
                                                transition: 'background 0.15s ease',
                                                background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                                                borderBottom: '1px solid #cbd5e1'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseOut={e => e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f8fafc'}
                                            >
                                                {/* SI No */}
                                                <td style={{
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid #cbd5e1',
                                                    borderRight: '1px solid #cbd5e1',
                                                    color: '#64748b',
                                                    fontWeight: '600',
                                                    textAlign: 'center'
                                                }}>{index + 1}</td>
                                                {/* Equipment Name */}
                                                <td style={{
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid #cbd5e1',
                                                    borderRight: '2px solid #cbd5e1',
                                                    color: '#0f172a',
                                                    fontWeight: '600'
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
                                                                    backgroundColor: mgmt !== null ? '#f0fdf4' : 'transparent'
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
                                                                    backgroundColor: ntpc !== null ? '#fffbeb' : 'transparent'
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
                                        ))
                                    )}
                                </tbody>
                            </table>
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
