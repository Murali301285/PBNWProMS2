import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'tmp', 'check_fks.sql');
        const sqlScript = fs.readFileSync(filePath, 'utf8');

        const pool = await getDbConnection();
        const result = await pool.request().query(sqlScript);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Error executing script:', error);
        return NextResponse.json({ message: 'Error executing script', error: error.message }, { status: 500 });
    }
}
