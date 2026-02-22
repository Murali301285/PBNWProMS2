const fs = require('fs');
const file = 'app/dashboard/reports/equipment-performance/page.js';
let code = fs.readFileSync(file, 'utf8');

const widthLogicToReplace = `            // Custom width assignment based on column index and visibleCols
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
            });`;

const newWidthLogic = `            // 1. Calculate max widths for dynamic columns
            const maxColWidths = {};
            visibleCols.forEach(col => {
                if (col.accessor === 'Equipment' || col.accessor === 'Operator') {
                    // Start with header length
                    let maxLen = col.header.length;
                    
                    // Scan data rows for max length
                    sortedData.forEach((row, rIdx) => {
                        let val = row[col.accessor];
                        if (col.render) {
                            const res = col.render(row, rIdx);
                            if (res !== null && typeof res !== 'object') val = res;
                        }
                        if (val !== null && val !== undefined) {
                            const len = String(val).length;
                            if (len > maxLen) maxLen = len;
                        }
                    });
                    
                    // Add padding to max length (approx. 1.2 Excel units per character for Calibri 10)
                    // Cap at 60 so it doesn't get ridiculously wide
                    maxColWidths[col.accessor] = Math.min(Math.max((maxLen * 1.2) + 2, 20), 80);
                }
            });

            // 2. Custom width assignment based on column index and visibleCols
            ws.columns = Array(maxColSpan + 1).fill(0).map((_, i) => {
                if (i === 0) return { width: 3 }; // Padding
                
                // Map i-1 to visibleCols array index
                const colDef = visibleCols[i - 1]; 
                let w = 15;
                if (colDef) {
                     if (colDef.accessor === 'SlNo') w = 8;
                     else if (colDef.accessor === 'Activity') w = 20;
                     else if (colDef.accessor === 'PMS Code') w = 15; 
                     else if (maxColWidths[colDef.accessor]) {
                         w = maxColWidths[colDef.accessor];
                     }
                }
                return { width: w };
            });`;

code = code.replace(widthLogicToReplace, newWidthLogic);

fs.writeFileSync(file, code);
console.log("Dynamically calculated column widths injected!");
