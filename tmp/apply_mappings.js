const fs = require('fs');
let code = fs.readFileSync('app/dashboard/reports/daily-production/page.js', 'utf8');

code = code.replace(
    /target\.Hr = \(target\.Hr \|\| 0\) \+ Number\(r\.WrkHours \|\| 0\);\s*target\.Qty = \(target\.Qty \|\| 0\) \+ Number\(r\.CrushQty \|\| 0\);/g,
    'target.Hr = (target.Hr || 0) + Number(r.Hr || 0);\n                    target.Qty = (target.Qty || 0) + Number(r.EstQty || 0);'
);

const oldInpit = `const inpitAggregated = (() => {
                const agg = { Coal: { FTD: 0, MTD: 0, YTD: 0 }, OB: { FTD: 0, MTD: 0, YTD: 0 } };
                if (!inpitDumping || inpitDumping.length === 0) return [];
                inpitDumping.forEach(r => {
                    if (r.Material === 'COAL') {
                        agg.Coal.FTD += Number(r.FTD || 0); agg.Coal.MTD += Number(r.MTD || 0); agg.Coal.YTD += Number(r.YTD || 0);
                    } else if (r.Material === 'OB' || r.Material === 'OVER BURDEN') {
                        agg.OB.FTD += Number(r.FTD || 0); agg.OB.MTD += Number(r.MTD || 0); agg.OB.YTD += Number(r.YTD || 0);
                    }
                });
                const totalRow = { Type: 'Total', FTD: 0, MTD: 0, YTD: 0 };
                const rowValues = [];
                if (agg.OB.FTD > 0 || agg.OB.MTD > 0 || agg.OB.YTD > 0) rowValues.push({ Type: 'OVER BURDEN', FTD: agg.OB.FTD, MTD: agg.OB.MTD, YTD: agg.OB.YTD });
                if (agg.Coal.FTD > 0 || agg.Coal.MTD > 0 || agg.Coal.YTD > 0) rowValues.push({ Type: 'COAL', FTD: agg.Coal.FTD, MTD: agg.Coal.MTD, YTD: agg.Coal.YTD });
                rowValues.forEach(r => { totalRow.FTD += r.FTD; totalRow.MTD += r.MTD; totalRow.YTD += r.YTD; });
                if (rowValues.length > 0) rowValues.push(totalRow);
                return rowValues;
            })();`;

const newInpit = `const inpitAggregated = (() => {
                const rows = {}; 
                if (!inpitDumping || inpitDumping.length === 0) return [];
                inpitDumping.forEach(r => {
                    const key = r.Type || 'Unknown';
                    if (!rows[key]) rows[key] = { Type: key, FTD: 0, MTD: 0, YTD: 0 };
                    rows[key].FTD += Number(r.Qty_FTD || 0);
                    rows[key].MTD += Number(r.Qty_MTD || 0);
                    rows[key].YTD += Number(r.Qty_YTD || 0);
                });
                const rowValues = Object.values(rows);
                const totalRow = { Type: 'Total', FTD: 0, MTD: 0, YTD: 0 };
                rowValues.forEach(r => { totalRow.FTD += r.FTD; totalRow.MTD += r.MTD; totalRow.YTD += r.YTD; });
                if (rowValues.length > 0) rowValues.push(totalRow);
                return rowValues;
            })();`;
code = code.replace(oldInpit, newInpit);

code = code.replace(
    /WasteQty: smaslQuantity\.filter\(r => r\.Type === 'OB' \|\| r\.Type === 'WASTE' \|\| r\.Type === 'OVER BURDEN'\)\.reduce\(\(s, r\) => s \+ \(r\.Quantity \|\| 0\), 0\)/g,
    'WasteQty: smaslQuantity.reduce((s, r) => s + Number(r.WasteQty || 0), 0)'
);
code = code.replace(
    /CoalQty: smaslQuantity\.filter\(r => r\.Type === 'COAL'\)\.reduce\(\(s, r\) => s \+ \(r\.Quantity \|\| 0\), 0\)/g,
    'CoalQty: smaslQuantity.reduce((s, r) => s + Number(r.CoalQty || 0), 0)'
);

code = code.replace(/const dumper = r\.EquipmentName \|\| '';/g, "const dumper = r.Dumper || '';");
code = code.replace(/const factor = r\.TripFactor \|\| '';/g, "const factor = r.FACTOR || '';");
code = code.replace(/const loader = r\.LoaderName \|\| '';/g, "const loader = r.Loader || '';");


const headerOld = `addHeaderRow(
                ["", null, "Quantity", null, null,   
                 "", null, "FTD", null, "MTD", null, 
                 "", null, "FTD", "MTD", "YTD", null, null], 
                'FFBFDBFE', 
                [2, 0, 3, 0, 0,       2, 0, 2, 0, 2, 0,      2, 0, 1, 1, 3, 0, 0], 
                { color: 'FFDC2626' }
            );`;
const headerNew = `addHeaderRow(
                ["", null, "Quantity", null, null,   
                 "", "FTD", "MTD", null, "YTD", null, 
                 "", null, "FTD", "MTD", "YTD", null, null], 
                'FFBFDBFE', 
                [2, 0, 3, 0, 0,       1, 1, 2, 0, 2, 0,      2, 0, 1, 1, 3, 0, 0], 
                { color: 'FFDC2626' }
            );`;
code = code.replace(headerOld, headerNew);


const rowOld2 = `addDataRow([
                       s6r.k, null, s6r.v, null, null,    
                       s7type, null, s7ftd, null, s7mtd, null, 
                       s8type, null, s8ftd, s8mtd, s8ytd, null, null], 
                   {}, [2, 0, 3, 0, 0,   2, 0, 2, 0, 2, 0,   2, 0, 1, 1, 3, 0, 0]);`;
const rowNew2 = `addDataRow([
                       s6r.k, null, s6r.v, null, null,    
                       s7type, s7ftd, s7mtd, null, s7ytd, null, 
                       s8type, null, s8ftd, s8mtd, s8ytd, null, null], 
                   {}, [2, 0, 3, 0, 0,   1, 1, 2, 0, 2, 0,   2, 0, 1, 1, 3, 0, 0]);`;
code = code.replace(rowOld2, rowNew2);

fs.writeFileSync('app/dashboard/reports/daily-production/page.js', code);
console.log('Fixed page.js mappings!');
