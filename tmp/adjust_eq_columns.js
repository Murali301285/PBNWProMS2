const fs = require('fs');
const file = 'app/dashboard/reports/equipment-performance/page.js';
let code = fs.readFileSync(file, 'utf8');

// 1. Update widths and freeze panes
const oldWidthLogic = `            // Simple width assignment
            ws.columns = Array(maxColSpan + 1).fill(0).map((_, i) => ({ 
                width: i === 0 ? 3 : (i === 4 ? 25 : 15) // A is padding, equipment name is wider
            }));`;

const newWidthLogic = `            // Custom width assignment based on column index and visibleCols
            ws.columns = Array(maxColSpan + 1).fill(0).map((_, i) => {
                if (i === 0) return { width: 3 }; // Padding
                
                // Map i-1 to visibleCols array index
                const colDef = visibleCols[i - 1]; 
                let w = 15;
                if (colDef) {
                     if (colDef.accessor === 'Equipment') w = 30;
                     if (colDef.accessor === 'Operator') w = 25;
                     if (colDef.accessor === 'Activity') w = 20;
                }
                return { width: w };
            });

            // Freeze columns up to Equ. Name (which is typically column 4 in visibleCols -> E in Excel)
            // Let's find the logical index of 'Equipment'
            let freezeCol = 4; // Default to D if not found
            const eqIdx = visibleCols.findIndex(c => c.accessor === 'Equipment');
            if (eqIdx !== -1) {
                freezeCol = eqIdx + 2; // +1 for 1-based, +1 for padding column A
            }
            
            ws.views = [
                { state: 'frozen', xSplit: freezeCol, ySplit: 7 } // Freeze up to Equ Name, and freeze headers (row 7)
            ];`;


code = code.replace(oldWidthLogic, newWidthLogic);


// 2. Remove commas from CostCenter and PMS Code
const oldDataLogic = `                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null) {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';
                    }`;

const newDataLogic = `                    let nFmt = undefined;
                    const num = Number(val);
                    if (!isNaN(num) && val !== '' && val !== null) {
                        val = num;
                        nFmt = '#,##0.00';
                        if (val % 1 === 0) nFmt = '#,##0';
                        if (val === 0) nFmt = '0';
                        
                        // Remove comma formatting for Cost Center and Prodsys Code
                        if (col.accessor === 'CostCenter' || col.accessor === 'PMS Code') {
                            nFmt = '0'; 
                        }
                    }`;

code = code.replace(oldDataLogic, newDataLogic);

fs.writeFileSync(file, code);
console.log("Equipment Performance Excel modifications applied!");
