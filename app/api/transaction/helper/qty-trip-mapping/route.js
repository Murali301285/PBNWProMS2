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

        // 1. Fetch Equipment load factors and Material Name
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

        const matQuery = `
            SELECT MaterialName, UnitId 
            FROM [Master].[TblMaterial] 
            WHERE SlNo = @materialId AND IsDelete = 0 AND IsActive = 1
        `;

        const [eqRes, matRes] = await Promise.all([
            executeQuery(eqQuery, [{ name: 'haulerId', type: sql.Int, value: haulerId }]),
            executeQuery(matQuery, [{ name: 'materialId', type: sql.Int, value: materialId }])
        ]);

        if (!eqRes || eqRes.length === 0) {
            return NextResponse.json({ success: false, message: 'Hauler Equipment not found or inactive' });
        }

        if (!matRes || matRes.length === 0) {
            return NextResponse.json({ success: false, message: 'Material not found or inactive' });
        }

        const eq = eqRes[0];
        const mat = matRes[0];
        const matName = (mat.MaterialName || '').trim().toUpperCase();
        const fallbackUnitId = mat.UnitId;

        // 2. Match the Material Name to determine the corresponding load factor & unit from Equipment table
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
            // No explicit load factor mapped for this material
            factor = null;
            unitId = null;
        }

        // Fallback to material's own default UnitId if equipment-specific field is NULL/0
        if (!unitId || unitId === 0) {
            unitId = fallbackUnitId;
        }

        // 3. Return the matched factor for both management and ntpc trip quantities
        if (factor !== null && factor !== undefined) {
            return NextResponse.json({
                success: true,
                data: {
                    ManagementQtyTrip: factor,
                    NTPCQtyTrip: factor,
                    Qty: factor, // Generic fallback for InternalTransfer Form
                    UnitId: unitId
                }
            });
        } else {
            // No load factor configured or is NULL
            return NextResponse.json({ success: true, data: null });
        }

    } catch (error) {
        console.error('Error fetching Qty Mapping:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
