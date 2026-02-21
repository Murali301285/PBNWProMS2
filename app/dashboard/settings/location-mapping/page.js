'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Loader2, Search } from 'lucide-react';
import styles from '@/app/dashboard/settings/Settings.module.css';
import SearchableSelect from '@/components/SearchableSelect';

export default function LocationMappingPage() {
    const [locations, setLocations] = useState([]);
    const [locationTypes, setLocationTypes] = useState([]);
    const [mappings, setMappings] = useState({}); // { locId: [ {mappingId, typeId, name}, ... ] }
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Fetch Initial Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/location-mapping');
            if (res.ok) {
                const data = await res.json();
                setLocations(data.locations || []);
                setLocationTypes(data.locationTypes || []);

                // Transform mappings into lookup: locId -> array of type objects
                const mapLookup = {};
                (data.mappings || []).forEach(m => {
                    if (!mapLookup[m.LocationId]) mapLookup[m.LocationId] = [];
                    // Find type name
                    const t = (data.locationTypes || []).find(type => type.id === m.LocationTypeId);
                    if (t) {
                        mapLookup[m.LocationId].push({
                            mappingId: m.id,
                            typeId: m.LocationTypeId,
                            name: t.name
                        });
                    }
                });
                setMappings(mapLookup);
            } else {
                toast.error('Failed to load data');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (locId, typeId) => {
        if (!typeId) return;

        // Optimistic Update
        const t = locationTypes.find(type => type.id === typeId);
        if (!t) return;

        const newItem = { mappingId: 'temp-' + Date.now(), typeId, name: t.name };
        setMappings(prev => ({
            ...prev,
            [locId]: [...(prev[locId] || []), newItem]
        }));

        try {
            const res = await fetch('/api/settings/location-mapping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locationId: locId, locationTypeId: typeId })
            });

            if (!res.ok) throw new Error('Failed to add');
            // Refresh to get real ID
            fetchData();
            toast.success('Location Type mapped successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save mapping');
            // Revert on error? For now, fetch data handles cleanup
            fetchData();
        }
    };

    const handleRemove = async (locId, mappingId) => {
        // Optimistic Update
        setMappings(prev => ({
            ...prev,
            [locId]: prev[locId].filter(m => m.mappingId !== mappingId)
        }));

        try {
            const res = await fetch('/api/settings/location-mapping', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: mappingId })
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Mapping removed');
        } catch (error) {
            console.error(error);
            toast.error('Failed to remove mapping');
            fetchData();
        }
    };

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Location Mappings</h1>
            </div>

            <div style={{ padding: '0 24px 16px', display: 'flex' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input
                        type="text"
                        placeholder="Search Location Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 40px 8px 40px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            outline: 'none',
                            fontSize: '0.9rem'
                        }}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9ca3af',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0
                            }}
                            title="Clear Search"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.tableContainer} style={{ height: '580px', overflowY: 'auto', position: 'relative' }}>
                <table className={styles.table}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f9fafb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <tr>
                            <th className={styles.th} style={{ width: '50px' }}>Sl No</th>
                            <th className={styles.th} style={{ width: '25%' }}>Location Name</th>
                            <th className={styles.th}>Mapped Types</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLocations.map((loc, index) => {
                            const locMappings = mappings[loc.id] || [];
                            const mappedIds = locMappings.map(m => m.typeId);
                            // Filter available options for this destination
                            const availableTypes = locationTypes.filter(t => !mappedIds.includes(t.id));

                            return (
                                <tr key={loc.id} className={styles.tr}>
                                    <td className={styles.td} style={{ textAlign: 'center' }}>{index + 1}</td>
                                    <td className={styles.td} style={{ fontWeight: 500 }}>{loc.name}</td>
                                    <td className={styles.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {/* Chips Container */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: locMappings.length ? '8px' : '0' }}>
                                                {locMappings.map(mapItem => (
                                                    <div
                                                        key={mapItem.mappingId}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            background: '#007bff', // Match screenshot blue
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        <span>{mapItem.name}</span>
                                                        <button
                                                            onClick={() => handleRemove(loc.id, mapItem.mappingId)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'white',
                                                                marginLeft: '6px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            title="Remove"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add Input */}
                                            <div style={{ width: '300px' }}>
                                                <SearchableSelect
                                                    options={availableTypes}
                                                    placeholder="Add Location Type..."
                                                    onChange={(e) => handleAdd(loc.id, e.target.value)}
                                                    value={null} // Keep it controlled null to reset after selection
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {locations.length === 0 && (
                            <tr>
                                <td colSpan={3} className={styles.td} style={{ textAlign: 'center', padding: '20px' }}>
                                    No active locations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
