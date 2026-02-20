'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

export default function SearchableSelect({ options = [], value, onChange, placeholder = "Select...", disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={containerRef} style={{ width: '100%', minWidth: '150px', position: 'relative' }}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    border: '1px solid #cbd5e1',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: disabled ? '#f1f5f9' : 'white',
                    fontSize: '0.9rem',
                    color: value ? 'black' : '#64748b'
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {value || placeholder}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {value && !disabled && (
                        <div onClick={handleClear} style={{ cursor: 'pointer', color: '#94a3b8' }}>
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={14} color="#64748b" />
                </div>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    marginTop: '4px',
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    maxHeight: '250px',
                    overflowY: 'auto'
                }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: 'white' }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.85rem',
                                outline: 'none'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt, i) => (
                            <div
                                key={i}
                                onClick={() => handleSelect(opt)}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    background: value === opt ? '#f1f5f9' : 'white',
                                    transition: 'background 0.1s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.target.style.background = value === opt ? '#f1f5f9' : 'white'}
                            >
                                {opt}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                            No options found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
