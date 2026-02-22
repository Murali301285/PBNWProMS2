const fs = require('fs');
let content = fs.readFileSync('app/dashboard/reports/daily-production/page.js', 'utf8');

const targetStart = '// SECTION 3. COAL CRUSHING DETAILS';
const targetEnd = '// SECTION 9. DUMPER-LOADER TRIP DETAILS';

const split1 = content.split(targetStart);
const split2 = split1[1].split(targetEnd);

const newLogic = `// SECTION 3. COAL CRUSHING DETAILS
            ws.mergeCells('B'+currentRowIdx+':S'+currentRowIdx);
            setCell(ws.getCell('B'+currentRowIdx), "3. COAL CRUSHING DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            const coalCrushingPivotMap = {};
            coalCrushing.forEach(r => {
                const key = r.PlantName;
                if (!coalCrushingPivotMap[key]) coalCrushingPivotMap[key] = { PlantName: key, ShiftA: {}, ShiftB: {}, ShiftC: {}, Total: {} };
                const shift = r.ShiftName?.toUpperCase().replace('-', '').trim();
                let target = null;
                if (shift === 'SHIFTA') target = coalCrushingPivotMap[key].ShiftA;
                else if (shift === 'SHIFTB') target = coalCrushingPivotMap[key].ShiftB;
                else if (shift === 'SHIFTC') target = coalCrushingPivotMap[key].ShiftC;
                if (target) {
                    target.Hr = (target.Hr || 0) + Number(r.WrkHours || 0);
                    target.Qty = (target.Qty || 0) + Number(r.CrushQty || 0);
                }
            });
            Object.values(coalCrushingPivotMap).forEach(row => {
                row.Total.Hr = (row.ShiftA.Hr || 0) + (row.ShiftB.Hr || 0) + (row.ShiftC.Hr || 0);
                row.Total.Qty = (row.ShiftA.Qty || 0) + (row.ShiftB.Qty || 0) + (row.ShiftC.Qty || 0);
            });
            const coalCrushingPivot = {
                rows: Object.values(coalCrushingPivotMap),
                grandTotal: {
                    ShiftA: { Hr: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftA.Hr || 0), 0), Qty: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftA.Qty || 0), 0) },
                    ShiftB: { Hr: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftB.Hr || 0), 0), Qty: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftB.Qty || 0), 0) },
                    ShiftC: { Hr: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftC.Hr || 0), 0), Qty: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.ShiftC.Qty || 0), 0) },
                    Total: { Hr: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.Total.Hr || 0), 0), Qty: Object.values(coalCrushingPivotMap).reduce((s, r) => s + (r.Total.Qty || 0), 0) }
                }
            };

            addHeaderRow(["Plant / Crusher", null, null, null, "SHIFT-A", null, null, null, "SHIFT-B", null, null, null, "SHIFT-C", null, null, null, "TOTAL", null], 'FFBFDBFE', [4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 2, 0], { color: 'FFDC2626' });
            addHeaderRow([null, null, null, null, "Hr.", null, "Est.Qty", null, "Hr.", null, "Est.Qty", null, "Hr.", null, "Est.Qty", null, "Hr.", "Est.Qty"], 'FFBFDBFE', [4, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1, 1]);

            ws.mergeCells('B'+(currentRowIdx - 2)+':E'+(currentRowIdx - 1));
            coalCrushingPivot.rows.forEach(r => {
                addDataRow([r.PlantName, null, null, null, fmt(r.ShiftA.Hr), null, fmt(r.ShiftA.Qty), null, fmt(r.ShiftB.Hr), null, fmt(r.ShiftB.Qty), null, fmt(r.ShiftC.Hr), null, fmt(r.ShiftC.Qty), null, fmt(r.Total.Hr), fmt(r.Total.Qty)], {}, [4, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1, 1]);
            });

            addDataRow(["Total", null, null, null,
                fmt(coalCrushingPivot.grandTotal.ShiftA.Hr), null, fmt(coalCrushingPivot.grandTotal.ShiftA.Qty), null,
                fmt(coalCrushingPivot.grandTotal.ShiftB.Hr), null, fmt(coalCrushingPivot.grandTotal.ShiftB.Qty), null,
                fmt(coalCrushingPivot.grandTotal.ShiftC.Hr), null, fmt(coalCrushingPivot.grandTotal.ShiftC.Qty), null,
                fmt(coalCrushingPivot.grandTotal.Total.Hr), fmt(coalCrushingPivot.grandTotal.Total.Qty)
            ], { bold: true, align: 'right', bg: 'FFCBD5E1' }, [4, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1, 1]);

            currentRowIdx += 2;

            // SECTION 4 & 5
            ws.mergeCells('B'+currentRowIdx+':J'+currentRowIdx);
            setCell(ws.getCell('B'+currentRowIdx), "4. BLASTING DETAILS", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });

            ws.mergeCells('K'+currentRowIdx+':S'+currentRowIdx);
            setCell(ws.getCell('K'+currentRowIdx), "5. CRUSHER COAL QTY.", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;

            addHeaderRow(
                ["Parameters", null, null, null, "Value", null, null, null, null, "QTY.", null, "FTD", null, "MTD", null, "YTD", null, null], 
                'FFBFDBFE', 
                [4, 0, 0, 0, 5, 0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0], 
                { color: 'FFDC2626' }
            );

            const blastingRowsArr = [];
            blasting.forEach(r => {
                blastingRowsArr.push({ k: 'No. of Holes', v: r.Noofholesblasted });
                blastingRowsArr.push({ k: 'Explosive (kg)', v: fmt(r.ExplosiveCosumed) });
                blastingRowsArr.push({ k: 'Drilling (Mtr)', v: fmt(r.TotalMetersDrilled) });
            });

            const maxRows1 = Math.max(blastingRowsArr.length, crushedCoal.length === 0 ? 1 : crushedCoal.length);
            for (let i = 0; i < maxRows1; i++) {
                let col1a = "", col1b = "";
                if (i < blastingRowsArr.length) {
                    col1a = blastingRowsArr[i].k;
                    col1b = blastingRowsArr[i].v;
                }

                let col2a = "", col2b = "", col2c = "", col2d = "";
                if (crushedCoal.length === 0 && i === 0) {
                    col2a = "No Data";
                } else if (i < crushedCoal.length) {
                    col2a = "QTY."; 
                    col2b = fmt(crushedCoal[i].Qty_FTD);
                    col2c = fmt(crushedCoal[i].Qty_MTD);
                    col2d = fmt(crushedCoal[i].Qty_YTD);
                }

                if (crushedCoal.length === 0 && i === 0) {
                   addDataRow([col1a, null, null, null, col1b, null, null, null, null, col2a, null, null, null, null, null, null, null, null], {}, [4, 0, 0, 0, 5, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0]);
                } else {
                   addDataRow([col1a, null, null, null, col1b, null, null, null, null, col2a, null, col2b, null, col2c, null, col2d, null, null], {}, [4, 0, 0, 0, 5, 0, 0, 0, 0, 2, 0, 2, 0, 2, 0, 3, 0, 0]);
                }
            }
            currentRowIdx += 2;

            // SECTION 6 , 7, 8 horizontally
            const smaslQuantity = data[10] || [];
            const inpitDumping = data[11] || [];
            const wp3Excavation = data[12] || [];
            
            const smaslAggregated = {
                WasteQty: smaslQuantity.filter(r => r.Type === 'OB' || r.Type === 'WASTE' || r.Type === 'OVER BURDEN').reduce((s, r) => s + (r.Quantity || 0), 0),
                CoalQty: smaslQuantity.filter(r => r.Type === 'COAL').reduce((s, r) => s + (r.Quantity || 0), 0)
            };
            const inpitAggregated = (() => {
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
            })();
            const wp3Aggregated = (() => {
                const agg = { OB: { FTD: 0, MTD: 0, YTD: 0 }, Coal: { FTD: 0, MTD: 0, YTD: 0 } };
                if (!wp3Excavation || wp3Excavation.length === 0) return agg;
                wp3Excavation.forEach(r => {
                    if (r.Type === 'COAL') {
                        agg.Coal.FTD += Number(r.Qty_FTD || 0); agg.Coal.MTD += Number(r.Qty_MTD || 0); agg.Coal.YTD += Number(r.Qty_YTD || 0);
                    } else if (r.Type === 'OB' || r.Type === 'OVER BURDEN') {
                        agg.OB.FTD += Number(r.Qty_FTD || 0); agg.OB.MTD += Number(r.Qty_MTD || 0); agg.OB.YTD += Number(r.Qty_YTD || 0);
                    }
                });
                return agg;
            })();

            ws.mergeCells('B'+currentRowIdx+':F'+currentRowIdx);
            setCell(ws.getCell('B'+currentRowIdx), "6. SMASL Quantity (FTD)", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            
            ws.mergeCells('G'+currentRowIdx+':L'+currentRowIdx);
            setCell(ws.getCell('G'+currentRowIdx), "7. INPIT DUMPING", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            
            ws.mergeCells('M'+currentRowIdx+':S'+currentRowIdx);
            setCell(ws.getCell('M'+currentRowIdx), "8. WP-3 EXCAVATION DETAIL", { bold: true, align: 'left', bg: 'FFE5E7EB', border: false, fontSize: 11 });
            ws.getRow(currentRowIdx).height = 20;
            currentRowIdx++;
            
            addHeaderRow(
                ["", null, "Quantity", null, null,   
                 "", null, "FTD", null, "MTD", null, 
                 "", null, "FTD", "MTD", "YTD", null, null], 
                'FFBFDBFE', 
                [2, 0, 3, 0, 0,       2, 0, 2, 0, 2, 0,      2, 0, 1, 1, 3, 0, 0], 
                { color: 'FFDC2626' }
            );

            const s6_final = [{ k: 'OB (BCM)', v: fmt(smaslAggregated.WasteQty) }, { k: 'Coal(MT)', v: fmt(smaslAggregated.CoalQty) }];
            const maxRows2_final = Math.max(s6_final.length, inpitAggregated.length === 0 ? 1 : inpitAggregated.length, 2);
            
            for (let i = 0; i < maxRows2_final; i++) {
                const s6r = s6_final[i] || {k:'', v:''};
                let s7type = "", s7ftd = "", s7mtd = "", s7ytd = "";
                if (inpitAggregated.length === 0 && i === 0) {
                    s7type = "No Data";
                } else if (i < inpitAggregated.length) {
                    s7type = inpitAggregated[i].Type; s7ftd = fmt(inpitAggregated[i].FTD); s7mtd = fmt(inpitAggregated[i].MTD); s7ytd = fmt(inpitAggregated[i].YTD);
                }

                let s8type = "", s8ftd = "", s8mtd = "", s8ytd = "";
                if (i === 0) {
                    s8type = "OB"; s8ftd = fmt(wp3Aggregated.OB.FTD); s8mtd = fmt(wp3Aggregated.OB.MTD); s8ytd = fmt(wp3Aggregated.OB.YTD);
                } else if (i === 1) {
                    s8type = "COAL"; s8ftd = fmt(wp3Aggregated.Coal.FTD); s8mtd = fmt(wp3Aggregated.Coal.MTD); s8ytd = fmt(wp3Aggregated.Coal.YTD);
                }

                if (inpitAggregated.length === 0 && i === 0) {
                   addDataRow([s6r.k, null, s6r.v, null, null,    s7type, null, null, null, null, null,   s8type, null, s8ftd, s8mtd, s8ytd, null, null], {}, [2, 0, 3, 0, 0,   6, 0, 0, 0, 0, 0,   2, 0, 1, 1, 3, 0, 0]);
                } else {
                   addDataRow([
                       s6r.k, null, s6r.v, null, null,    
                       s7type, null, s7ftd, null, s7mtd, null, 
                       s8type, null, s8ftd, s8mtd, s8ytd, null, null], 
                   {}, [2, 0, 3, 0, 0,   2, 0, 2, 0, 2, 0,   2, 0, 1, 1, 3, 0, 0]);
                }
            }
            currentRowIdx += 2;
\n// SECTION 9. DUMPER-LOADER TRIP DETAILS`;

fs.writeFileSync('app/dashboard/reports/daily-production/page.js', split1[0] + newLogic + split2[1]);
console.log('Fixed Sections 3 through 8 Layout at index B:S!');
