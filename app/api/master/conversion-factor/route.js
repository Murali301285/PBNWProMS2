import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { MASTER_CONFIG } from '@/lib/masterConfig';

export const dynamic = 'force-dynamic';

const TABLE_NAME = '[Master].[TblConversionFactor]';
const ID_FIELD = 'SlNo';

export async function GET() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request().query(`
            SELECT ${ID_FIELD} as id, * 
            FROM ${TABLE_NAME} 
            WHERE IsDelete = 0 
            ORDER BY ${ID_FIELD} DESC
        `);
        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Error fetching conversion factor:', error);
        return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const pool = await getDbConnection();

        // CHECK UNIQUENESS: Ensure only one active record exists
        const checkResult = await pool.request().query(`
            SELECT TOP 1 1 
            FROM ${TABLE_NAME} 
            WHERE IsDelete = 0
        `);

        if (checkResult.recordset.length > 0) {
            return NextResponse.json({
                message: 'An active Conversion Factor already exists. Please delete or deactivate the existing one before adding a new entry.'
            }, { status: 400 });
        }

        const request = pool.request();

        request.input('FromDate', sql.Date, body.FromDate);
        request.input('ToDate', sql.Date, body.ToDate);
        request.input('Factor', sql.Decimal(18, 2), body.Factor);
        request.input('Remarks', sql.NVarChar(sql.MAX), body.Remarks || null);
        request.input('IsActive', sql.Bit, body.IsActive !== undefined ? body.IsActive : 1);

        await request.query(`
            INSERT INTO ${TABLE_NAME} (FromDate, ToDate, Factor, Remarks, IsActive, IsDelete, CreatedBy, CreatedDate)
            VALUES (@FromDate, @ToDate, @Factor, @Remarks, @IsActive, 0, 1, GETDATE())
        `);

        return NextResponse.json({ message: 'Created successfully' });

    } catch (error) {
        console.error('Error creating conversion factor:', error);
        return NextResponse.json({ message: 'Error creating record', error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const pool = await getDbConnection();
        const request = pool.request();

        const id = body.id;
        if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

        request.input('Id', id);

        // Dynamic updates
        const updates = [];
        if (body.FromDate !== undefined) {
            request.input('FromDate', sql.Date, body.FromDate);
            updates.push('FromDate = @FromDate');
        }
        if (body.ToDate !== undefined) {
            request.input('ToDate', sql.Date, body.ToDate);
            updates.push('ToDate = @ToDate');
        }
        if (body.Factor !== undefined) {
            request.input('Factor', sql.Decimal(18, 2), body.Factor);
            updates.push('Factor = @Factor');
        }
        if (body.Remarks !== undefined) {
            request.input('Remarks', sql.NVarChar(sql.MAX), body.Remarks);
            updates.push('Remarks = @Remarks');
        }
        if (body.IsActive !== undefined) { // Handle boolean or 'Yes'/'No' if coming from UI that sends strings
            const activeBit = (body.IsActive === 'Yes' || body.IsActive === true || body.IsActive === 1) ? 1 : 0;
            request.input('IsActive', sql.Bit, activeBit);
            updates.push('IsActive = @IsActive');
        }

        updates.push('UpdatedDate = GETDATE()', 'UpdatedBy = 1');

        if (updates.length > 2) { // More than just audit fields
            await request.query(`
                UPDATE ${TABLE_NAME} 
                SET ${updates.join(', ')} 
                WHERE ${ID_FIELD} = @Id
            `);
        }

        return NextResponse.json({ message: 'Updated successfully' });

    } catch (error) {
        return NextResponse.json({ message: 'Error updating record', error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

        const pool = await getDbConnection();
        await pool.request()
            .input('Id', id)
            .query(`
                UPDATE ${TABLE_NAME} 
                SET IsDelete = 1, UpdatedDate = GETDATE(), UpdatedBy = 1
                WHERE ${ID_FIELD} = @Id
            `);

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting record', error: error.message }, { status: 500 });
    }
}
