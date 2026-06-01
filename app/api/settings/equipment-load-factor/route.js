import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const user = await authenticateUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Fetch active non-deleted equipment
        const eqQuery = `
            SELECT SlNo, EuipmentID, EquipmentName 
            FROM [Master].[TblEquipment] 
            WHERE IsDelete = 0 AND IsActive = 1 
            ORDER BY EuipmentID ASC
        `;

        // Fetch active non-deleted materials with unit details
        const matQuery = `
            SELECT m.SlNo, m.MaterialName, m.UnitId, u.Name as UnitName
            FROM [Master].[TblMaterial] m
            LEFT JOIN [Master].[TblUnit] u ON m.UnitId = u.SlNo
            WHERE m.IsDelete = 0 AND m.IsActive = 1 
            ORDER BY m.[Order] ASC, m.MaterialName ASC
        `;

        // Fetch active mapping configurations
        const mappingQuery = `
            SELECT SlNo, EquipmentId, MaterialId, ManagementQtyTrip, NTPCQtyTrip 
            FROM [Master].[TblEquipmentLoadFactorMapping] 
            WHERE IsDelete = 0 AND IsActive = 1
        `;

        const [equipments, materials, mappings] = await Promise.all([
            executeQuery(eqQuery),
            executeQuery(matQuery),
            executeQuery(mappingQuery)
        ]);

        return NextResponse.json({
            success: true,
            equipments: equipments || [],
            materials: materials || [],
            mappings: mappings || []
        });

    } catch (error) {
        console.error('Error fetching load factor mappings:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await authenticateUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { EquipmentId, MaterialId, ManagementQtyTrip, NTPCQtyTrip } = body;

        if (!EquipmentId || !MaterialId) {
            return NextResponse.json({ success: false, message: 'EquipmentId and MaterialId are required' }, { status: 400 });
        }

        const userId = user.id;

        // Parse to decimal or null
        const mgmtQty = (ManagementQtyTrip === '' || ManagementQtyTrip === null || ManagementQtyTrip === undefined) 
            ? null 
            : parseFloat(ManagementQtyTrip);

        const ntpcQty = (NTPCQtyTrip === '' || NTPCQtyTrip === null || NTPCQtyTrip === undefined) 
            ? null 
            : parseFloat(NTPCQtyTrip);

        // Check if a mapping record already exists for this equipment + material
        const checkQuery = `
            SELECT SlNo, IsDelete 
            FROM [Master].[TblEquipmentLoadFactorMapping] 
            WHERE EquipmentId = @EquipmentId AND MaterialId = @MaterialId
        `;

        const checkRes = await executeQuery(checkQuery, [
            { name: 'EquipmentId', type: sql.Int, value: EquipmentId },
            { name: 'MaterialId', type: sql.Int, value: MaterialId }
        ]);

        if (checkRes && checkRes.length > 0) {
            const existing = checkRes[0];

            if (mgmtQty === null && ntpcQty === null) {
                // If both are cleared/null, soft delete the row
                const deleteQuery = `
                    UPDATE [Master].[TblEquipmentLoadFactorMapping]
                    SET IsDelete = 1,
                        IsActive = 0,
                        UpdatedBy = @UserId,
                        UpdatedDate = GETDATE()
                    WHERE SlNo = @SlNo
                `;
                await executeQuery(deleteQuery, [
                    { name: 'SlNo', type: sql.Int, value: existing.SlNo },
                    { name: 'UserId', type: sql.Int, value: userId }
                ]);
            } else {
                // Otherwise, update the existing row
                const updateQuery = `
                    UPDATE [Master].[TblEquipmentLoadFactorMapping]
                    SET ManagementQtyTrip = @ManagementQty,
                        NTPCQtyTrip = @NTPCQty,
                        IsDelete = 0,
                        IsActive = 1,
                        UpdatedBy = @UserId,
                        UpdatedDate = GETDATE()
                    WHERE SlNo = @SlNo
                `;
                await executeQuery(updateQuery, [
                    { name: 'SlNo', type: sql.Int, value: existing.SlNo },
                    { name: 'ManagementQty', type: sql.Decimal(18, 2), value: mgmtQty },
                    { name: 'NTPCQty', type: sql.Decimal(18, 2), value: ntpcQty },
                    { name: 'UserId', type: sql.Int, value: userId }
                ]);
            }
        } else {
            // Only insert if at least one value is provided
            if (mgmtQty !== null || ntpcQty !== null) {
                const insertQuery = `
                    INSERT INTO [Master].[TblEquipmentLoadFactorMapping] (
                        EquipmentId, MaterialId, ManagementQtyTrip, NTPCQtyTrip, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate, IsDelete, IsActive
                    ) VALUES (
                        @EquipmentId, @MaterialId, @ManagementQty, @NTPCQty, @UserId, GETDATE(), @UserId, GETDATE(), 0, 1
                    )
                `;
                await executeQuery(insertQuery, [
                    { name: 'EquipmentId', type: sql.Int, value: EquipmentId },
                    { name: 'MaterialId', type: sql.Int, value: MaterialId },
                    { name: 'ManagementQty', type: sql.Decimal(18, 2), value: mgmtQty },
                    { name: 'NTPCQty', type: sql.Decimal(18, 2), value: ntpcQty },
                    { name: 'UserId', type: sql.Int, value: userId }
                ]);
            }
        }

        return NextResponse.json({ success: true, message: 'Mapping updated successfully' });

    } catch (error) {
        console.error('Error saving load factor mapping:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
