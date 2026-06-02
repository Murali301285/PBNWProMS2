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

        // 2. Fetch Equipment Group & Unit from TblEquipment
        const eqQuery = `
            SELECT EquipmentGroupId, UnitId 
            FROM [Master].[TblEquipment] 
            WHERE SlNo = @haulerId AND IsDelete = 0 AND IsActive = 1
        `;
        const eqRes = await executeQuery(eqQuery, [{ name: 'haulerId', type: sql.Int, value: haulerId }]);

        if (!eqRes || eqRes.length === 0) {
            return NextResponse.json({ success: false, message: 'Hauler Equipment not found or inactive' });
        }
        const eq = eqRes[0];
        const finalUnitId = fallbackUnitId; // Dynamic: transaction unit must strictly be based on selected material

        // 3. Check Individual Equipment Load Factor Mapping
        const mappingQuery = `
            SELECT ManagementQtyTrip, NTPCQtyTrip 
            FROM [Master].[TblEquipmentLoadFactorMapping] 
            WHERE EquipmentId = @haulerId AND MaterialId = @materialId AND IsDelete = 0 AND IsActive = 1
        `;
        const mappingRes = await executeQuery(mappingQuery, [
            { name: 'haulerId', type: sql.Int, value: haulerId },
            { name: 'materialId', type: sql.Int, value: materialId }
        ]);

        let matchedRow = null;

        if (mappingRes && mappingRes.length > 0) {
            const row = mappingRes[0];
            if (row.ManagementQtyTrip !== null || row.NTPCQtyTrip !== null) {
                matchedRow = row;
            }
        }

        // 4. Fallback to Equipment Group Mapping if no individual mapping
        if (!matchedRow && eq.EquipmentGroupId) {
            const groupMappingQuery = `
                SELECT ManagementQtyTrip, NTPCQtyTrip 
                FROM [Master].[TblQtyTripMapping] 
                WHERE EquipmentGroupId = @groupId AND MaterialId = @materialId AND IsDelete = 0 AND IsActive = 1
            `;
            const groupMappingRes = await executeQuery(groupMappingQuery, [
                { name: 'groupId', type: sql.Int, value: eq.EquipmentGroupId },
                { name: 'materialId', type: sql.Int, value: materialId }
            ]);
            if (groupMappingRes && groupMappingRes.length > 0) {
                const row = groupMappingRes[0];
                if (row.ManagementQtyTrip !== null || row.NTPCQtyTrip !== null) {
                    matchedRow = row;
                }
            }
        }

        // 5. Apply fallbacks and return
        if (matchedRow) {
            let mQty = matchedRow.ManagementQtyTrip;
            let nQty = matchedRow.NTPCQtyTrip;

            // Rule: If ntpc qty not found then -> map the management qty to ntpc qty
            if (nQty === null || nQty === undefined || nQty === '') {
                nQty = mQty;
            }

            // Rule: If management qty not found then -> trigger the modal (by returning data: null)
            if (mQty === null || mQty === undefined || mQty === '') {
                return NextResponse.json({ success: true, data: null });
            }

            return NextResponse.json({
                success: true,
                data: {
                    ManagementQtyTrip: mQty,
                    NTPCQtyTrip: nQty,
                    Qty: mQty,
                    UnitId: finalUnitId
                }
            });
        } else {
            // No mapping found at all -> trigger warning modal
            return NextResponse.json({ success: true, data: null });
        }

    } catch (error) {
        console.error('Error fetching Qty Mapping:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
