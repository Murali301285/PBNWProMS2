import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pool = await getDbConnection();

        // 1. Fetch Locations
        const locationsRes = await pool.request().query(`
            SELECT SlNo as id, LocationName as name 
            FROM [Master].[TblLocation]
            WHERE IsDelete = 0
            ORDER BY LocationName
        `);

        // 2. Fetch Location Types
        const locationTypesRes = await pool.request().query(`
            SELECT SlNo as id, LocationType as name
            FROM [Master].[TblLocationType]
            WHERE IsActive = 1 AND IsDelete = 0
            ORDER BY LocationType
        `);

        // 3. Fetch Mappings (Only Active & Not Deleted)
        const mappingsRes = await pool.request().query(`
            SELECT SlNo as id, LocationId, LocationTypeId
            FROM [Master].[TblLocationTypeMapping]
            WHERE IsActive = 1 AND IsDelete = 0
        `);

        return NextResponse.json({
            locations: locationsRes.recordset,
            locationTypes: locationTypesRes.recordset,
            mappings: mappingsRes.recordset
        });

    } catch (error) {
        console.error("Error fetching location mappings:", error);
        return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { locationId, locationTypeId } = body;

        if (!locationId || !locationTypeId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const pool = await getDbConnection();

        // Check if mapping already exists
        const checkRes = await pool.request()
            .input('locId', locationId)
            .input('typeId', locationTypeId)
            .query(`
                SELECT SlNo, IsDelete 
                FROM [Master].[TblLocationTypeMapping] 
                WHERE LocationId = @locId AND LocationTypeId = @typeId
            `);

        if (checkRes.recordset.length > 0) {
            const existing = checkRes.recordset[0];
            if (existing.IsDelete) {
                // Restore Soft-Deleted Mapping
                await pool.request()
                    .input('id', existing.SlNo)
                    .query(`
                        UPDATE [Master].[TblLocationTypeMapping]
                        SET IsDelete = 0, IsActive = 1, UpdatedDate = GETDATE(), UpdatedBy = 1
                        WHERE SlNo = @id
                    `);
                return NextResponse.json({ message: 'Mapping restored', id: existing.SlNo });
            } else {
                return NextResponse.json({ message: 'Mapping already exists' }, { status: 409 });
            }
        }

        // Insert New Mapping
        const insertRes = await pool.request()
            .input('locId', locationId)
            .input('typeId', locationTypeId)
            .query(`
                INSERT INTO [Master].[TblLocationTypeMapping] 
                (LocationId, LocationTypeId, CreatedDate, CreatedBy, IsDelete, IsActive)
                OUTPUT INSERTED.SlNo
                VALUES (@locId, @typeId, GETDATE(), 1, 0, 1)
            `);

        return NextResponse.json({ message: 'Mapping created', id: insertRes.recordset[0].SlNo }, { status: 201 });

    } catch (error) {
        console.error("Error creating mapping:", error);
        return NextResponse.json({ message: 'Error saving mapping', error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

        const pool = await getDbConnection();
        await pool.request()
            .input('id', id)
            .query(`
                UPDATE [Master].[TblLocationTypeMapping]
                SET IsDelete = 1, UpdatedDate = GETDATE(), UpdatedBy = 1
                WHERE SlNo = @id
            `);

        return NextResponse.json({ message: 'Mapping removed' });
    } catch (error) {
        console.error("Error deleting mapping:", error);
        return NextResponse.json({ message: 'Error deleting mapping', error: error.message }, { status: 500 });
    }
}
