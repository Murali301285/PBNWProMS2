import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { MASTER_CONFIG } from '@/lib/masterConfig';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        const { slug } = await params;
        const config = MASTER_CONFIG[slug];

        if (!config) {
            return NextResponse.json({ message: 'Invalid Master Type' }, { status: 400 });
        }

        const pool = await getDbConnection();
        // Dynamic Query - Safe because slug is validated against trusted config keys
        const query = `
            SELECT ${config.idField} as id, * 
            FROM ${config.table} 
            WHERE IsDelete = 0 
            ORDER BY ${config.idField} DESC
        `;

        const result = await pool.request().query(query);
        if (slug === 'equipment' && result.recordset.length > 0) {
            console.log('[DEBUG-SERVER] Equipment API PMSCode data type validation for first row:', result.recordset[0].PMSCode);
        }
        return NextResponse.json(result.recordset);

    } catch (error) {
        console.error(`Error fetching ${params.slug}:`, error);
        return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { slug } = await params;
        const config = MASTER_CONFIG[slug];
        if (!config) return NextResponse.json({ message: 'Invalid Master Type' }, { status: 400 });

        const body = await req.json();
        const pool = await getDbConnection();
        const request = pool.request();

        // Dynamically build INSERT fields and values
        const fields = [];
        const values = [];

        console.log(`[API] Processing ${slug} create request`, { bodyKeys: Object.keys(body) });

        config.columns.forEach(colObj => {
            const col = colObj.accessor;
            if (body[col] !== undefined) {
                fields.push(col);
                values.push(`@${col}`);
                if (col === 'CompanyLogo') {
                    // Explicitly handle large strings
                    request.input(col, sql.NVarChar(sql.MAX), body[col]);
                } else {
                    let val = body[col];
                    // Handle boolean toggles appropriately
                    if (typeof val === 'boolean' || val === 'Yes' || val === 'No') {
                        val = (val === true || val === 'Yes' || val === 1) ? 1 : 0;
                        request.input(col, sql.Bit, val);
                    } else {
                        request.input(col, val);
                    }
                }
            }
        });

        // Add Standard Fields
        fields.push('IsDelete', 'CreatedDate', 'CreatedBy');
        values.push('0', 'GETDATE()', '1');

        const query = `
            INSERT INTO ${config.table} (${fields.join(', ')})
            VALUES (${values.join(', ')})
        `;

        await request.query(query);
        return NextResponse.json({ message: 'Created successfully' });

    } catch (error) {
        console.error(`Error creating ${params.slug}:`, error);
        return NextResponse.json({ message: 'Error creating record', error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { slug } = await params;
        const config = MASTER_CONFIG[slug];
        if (!config) return NextResponse.json({ message: 'Invalid Master Type' }, { status: 400 });

        const body = await req.json();
        const pool = await getDbConnection();
        const request = pool.request();

        const id = body.id;
        request.input('Id', id);

        // Dynamically build UPDATE set clause
        const updates = [];

        // Handle Standard Columns
        config.columns.forEach(colObj => {
            const col = colObj.accessor;
            if (body[col] !== undefined) {
                updates.push(`${col} = @${col}`);
                if (col === 'CompanyLogo') {
                    request.input(col, sql.NVarChar(sql.MAX), body[col]);
                } else {
                    let val = body[col];
                    if (typeof val === 'boolean' || val === 'Yes' || val === 'No') {
                        val = (val === true || val === 'Yes' || val === 1) ? 1 : 0;
                        request.input(col, sql.Bit, val);
                    } else {
                        request.input(col, val);
                    }
                }
            }
        });

        updates.push('UpdatedDate = GETDATE()', 'UpdatedBy = 1');

        const query = `
            UPDATE ${config.table} 
            SET ${updates.join(', ')}
            WHERE ${config.idField} = @Id
        `;

        await request.query(query);
        return NextResponse.json({ message: 'Updated successfully' });

    } catch (error) {
        return NextResponse.json({ message: 'Error updating record', error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { slug } = await params;
        const config = MASTER_CONFIG[slug];
        if (!config) return NextResponse.json({ message: 'Invalid Master Type' }, { status: 400 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        const pool = await getDbConnection();
        await pool.request()
            .input('Id', id)
            .query(`
                UPDATE ${config.table} 
                SET IsDelete = 1, UpdatedDate = GETDATE(), UpdatedBy = 1
                WHERE ${config.idField} = @Id
            `);

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting record', error: error.message }, { status: 500 });
    }
}
