import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const haulerId = searchParams.get('haulerId');
        const materialId = searchParams.get('materialId');

        if (!haulerId || !materialId) {
            return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        // 1. Fetch Material Info first to have the fallback UnitId ready
        const matQuery = `
            SELECT MaterialName, UnitId 
            FROM [Master].[TblMaterial] 
            WHERE SlNo = @materialId AND IsDelete = 0 AND IsActive = 1
        `;
        const matRes = await executeQuery(matQuery, [{ name: 'materialId', type: sql.Int, value: materialId }]);

        if (!matRes || matRes.length === 0) {
            return NextResponse.json({ success: false, message: 'Material not found or inactive' });
        }
        const mat = matRes[0];
        const fallbackUnitId = mat.UnitId;

        // 2. HIGHEST PRIORITY: Check Individual Equipment Load Factor Override Mapping
        const mappingQuery = `
            SELECT ManagementQtyTrip, NTPCQtyTrip 
            FROM [Master].[TblEquipmentLoadFactorMapping] 
            WHERE EquipmentId = @haulerId AND MaterialId = @materialId AND IsDelete = 0 AND IsActive = 1
        `;
        const mappingRes = await executeQuery(mappingQuery, [
            { name: 'haulerId', type: sql.Int, value: haulerId },
            { name: 'materialId', type: sql.Int, value: materialId }
        ]);

        if (mappingRes && mappingRes.length > 0) {
            const row = mappingRes[0];
            if (row.ManagementQtyTrip !== null || row.NTPCQtyTrip !== null) {
                return NextResponse.json({
                    success: true,
                    data: {
                        ManagementQtyTrip: row.ManagementQtyTrip,
                        NTPCQtyTrip: row.NTPCQtyTrip,
                        Qty: row.ManagementQtyTrip, // Generic fallback
                        UnitId: fallbackUnitId
                    }
                });
            }
        }

        // 3. SECOND PRIORITY: Fallback to dynamic column matching on TblEquipment based on Material name
        const eqQuery = `
            SELECT 
                OBUnitId, OBLoadFactor, 
                TopSoilUnitId, TopSoilLoadFactor, 
                CoalUnitId, CoalLoadFactor, 
                ROMCoalUnitId, ROMCoalLoadFactor, 
                CrushedCoalUnitId, CrushedCoalLoadFactor,
                TripQty
            FROM [Master].[TblEquipment] 
            WHERE SlNo = @haulerId AND IsDelete = 0 AND IsActive = 1
        `;
        const eqRes = await executeQuery(eqQuery, [{ name: 'haulerId', type: sql.Int, value: haulerId }]);

        if (!eqRes || eqRes.length === 0) {
            return NextResponse.json({ success: false, message: 'Hauler Equipment not found or inactive' });
        }

        const eq = eqRes[0];
        const matName = (mat.MaterialName || '').trim().toUpperCase();

        let factor = null;
        let unitId = null;

        if (matName.includes('OB') || matName.includes('BURDEN')) {
            factor = eq.OBLoadFactor;
            unitId = eq.OBUnitId;
        } else if (matName.includes('SOIL')) {
            factor = eq.TopSoilLoadFactor;
            unitId = eq.TopSoilUnitId;
        } else if (matName === 'ROM COAL') {
            factor = eq.ROMCoalLoadFactor;
            unitId = eq.ROMCoalUnitId;
        } else if (matName === 'CRUSHED COAL') {
            factor = eq.CrushedCoalLoadFactor;
            unitId = eq.CrushedCoalUnitId;
        } else if (matName.includes('COAL')) {
            factor = eq.CoalLoadFactor;
            unitId = eq.CoalUnitId;
        } else {
            factor = null;
            unitId = null;
        }

        if (!unitId || unitId === 0) {
            unitId = fallbackUnitId;
        }

        if (factor !== null && factor !== undefined) {
            return NextResponse.json({
                success: true,
                data: {
                    ManagementQtyTrip: factor,
                    NTPCQtyTrip: factor,
                    Qty: factor,
                    UnitId: unitId
                }
            });
        } else {
            return NextResponse.json({ success: true, data: null });
        }

    } catch (error) {
        console.error('Error fetching Qty Mapping:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
