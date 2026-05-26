/**
 * Robust utility to parse and format date strings to premium 'dd - MMM - yyyy' format.
 * Examples:
 * - '09/04/2026' -> '09 - Apr - 2026'
 * - '09-Apr-26' -> '09 - Apr - 2026'
 * - '2026-04-09' -> '09 - Apr - 2026'
 * 
 * @param {string|Date} dateStr - The raw date value to format
 * @returns {string} The standardized 'dd - MMM - yyyy' formatted string
 */
export const formatReportDate = (dateStr) => {
    if (!dateStr) return '';
    const cleanStr = String(dateStr).trim();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Case 1: dd/mm/yyyy or dd/mm/yy (e.g. 09/04/2026)
    if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const monthIdx = parseInt(parts[1], 10) - 1;
            let year = parts[2];
            if (year.length === 2) year = '20' + year;
            if (monthIdx >= 0 && monthIdx < 12) {
                return `${day} - ${months[monthIdx]} - ${year}`;
            }
        }
    }
    
    // Case 2: yyyy-mm-dd (ISO date, e.g. 2026-04-09)
    if (cleanStr.includes('-') && cleanStr.split('-')[0].length === 4) {
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const year = parts[0];
            const monthIdx = parseInt(parts[1], 10) - 1;
            const day = parts[2].substring(0, 2).padStart(2, '0');
            if (monthIdx >= 0 && monthIdx < 12) {
                return `${day} - ${months[monthIdx]} - ${year}`;
            }
        }
    }
    
    // Case 3: dd-MMM-yy or dd-MMM-yyyy (e.g. 09-Apr-26 or 09-Apr-2026)
    if (cleanStr.includes('-')) {
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const day = parts[0].trim().padStart(2, '0');
            let mName = parts[1].trim();
            mName = mName.charAt(0).toUpperCase() + mName.slice(1).toLowerCase();
            let year = parts[2].trim();
            if (year.length === 2) year = '20' + year;
            return `${day} - ${mName} - ${year}`;
        }
    }
    
    // Fallback: standard JS Date parsing
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = months[d.getMonth()];
            const year = d.getFullYear();
            return `${day} - ${month} - ${year}`;
        }
    } catch (e) {}
    
    return dateStr;
};

/**
 * Safe helper to sort a list of report rows chronologically by Date and sequentially by Shift.
 * 
 * @param {Array} arr - The data array to sort
 * @param {string} dateKey - The key for the date field (default: 'Date')
 * @param {string} shiftKey - The key for the shift field (default: 'ShiftName')
 * @returns {Array} The sorted array
 */
export const sortReportData = (arr, dateKey = 'Date', shiftKey = 'ShiftName') => {
    if (!Array.isArray(arr) || arr.length === 0) return arr;
    
    // Find dynamic keys case-insensitively if exact key not found
    const firstRow = arr[0];
    let actualDateKey = dateKey;
    let actualShiftKey = shiftKey;
    
    Object.keys(firstRow).forEach(k => {
        if (k.toLowerCase() === dateKey.toLowerCase()) actualDateKey = k;
        if (k.toLowerCase() === shiftKey.toLowerCase() || (shiftKey === 'ShiftName' && k.toLowerCase() === 'shift')) actualShiftKey = k;
    });
    
    return [...arr].sort((a, b) => {
        // Date parsing helper
        const parseDateVal = (val) => {
            if (!val) return 0;
            // If already formatted as 'dd - MMM - yyyy', parse it
            if (typeof val === 'string' && val.includes(' - ')) {
                const parts = val.split(' - ');
                if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthIdx = months.indexOf(parts[1]);
                    const year = parseInt(parts[2], 10);
                    if (day && monthIdx !== -1 && year) {
                        return new Date(year, monthIdx, day).getTime();
                    }
                }
            }
            const d = new Date(val);
            return isNaN(d.getTime()) ? 0 : d.getTime();
        };
        
        const timeA = parseDateVal(a[actualDateKey]);
        const timeB = parseDateVal(b[actualDateKey]);
        
        if (timeA !== timeB) return timeA - timeB;
        
        const shiftA = String(a[actualShiftKey] || '').trim().toUpperCase();
        const shiftB = String(b[actualShiftKey] || '').trim().toUpperCase();
        
        return shiftA.localeCompare(shiftB);
    });
};
