const fs = require('fs');
const file = 'app/dashboard/reports/equipment-performance/page.js';
let code = fs.readFileSync(file, 'utf8');

// The user mentioned "fix the heading row (Sl.no, Prodsys Code)"
// It seems maybe the sub-headings are not aligned correctly with their top-level headers.
// The Equipment Performance Report doesn't have a top-level header over Sl.no and Prodsys Code.
// In the current logic, the "empty" title group is merged. Let's see how Sub Headers are rendered.
const subHeaderLogic = `            // Sub Headers
            const rowSub = ws.getRow(currentRowIdx);
            visibleCols.forEach((col, i) => {
                setCell(rowSub.getCell(i + 2), col.header, { bold: true, bg: 'FFBFDBFE' });
            });
            rowSub.height = 22;
            currentRowIdx++;`;

// Instead of always forcing center, we actually do center Sub Headers, but for Sl.No and Prodsys Code it's fine.
// But wait, the top row has merged empty cells. The user probably wants Sl.No, Prodsys Code, Cost Center, Equ Name to merge VERTICALLY across the two header rows!
// Because they don't have a "SHIFT A" parent.

const headerMergeLogic = `            // Sub Headers
            const rowSub = ws.getRow(currentRowIdx);
            visibleCols.forEach((col, i) => {
                const cell = rowSub.getCell(i + 2);
                setCell(cell, col.header, { bold: true, bg: 'FFBFDBFE' });
                
                // If this column belongs to the empty group (no parent header)
                // We should merge it upwards so it looks like one tall header
                const parentGroup = columnGroups.find(g => {
                   if (col.header.includes('FTD')) return g.title === 'FTD';
                   if (col.header.includes('MTD')) return g.title === 'MTD';
                   if (col.accessor.startsWith('Shift A')) return g.title === 'SHIFT A';
                   if (col.accessor.startsWith('Shift B')) return g.title === 'SHIFT B';
                   if (col.accessor.startsWith('Shift C')) return g.title === 'SHIFT C';
                   return g.title === '';
                }) || { title: '' };

                if (parentGroup.title === '') {
                    // It's a top-level standalone column
                    // Let's merge Row (currentRowIdx - 1) and Row (currentRowIdx) for this column
                    const colLetter = ws.getColumn(i + 2).letter;
                    try {
                        ws.mergeCells(\`\${colLetter}\${currentRowIdx - 1}:\${colLetter}\${currentRowIdx}\`);
                        // Set the value in the merged cell
                        setCell(ws.getCell(\`\${colLetter}\${currentRowIdx - 1}\`), col.header, { bold: true, bg: 'FFE5E7EB' }); // Use the parent header color for continuity
                    } catch(e) {}
                }
            });
            rowSub.height = 22;
            currentRowIdx++;`;

code = code.replace(subHeaderLogic, headerMergeLogic);

fs.writeFileSync(file, code);
console.log("Vertically merged top-level headers in Equipment Performance!");
