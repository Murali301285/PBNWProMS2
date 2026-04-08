import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const query = `
            WITH CTE AS (
                SELECT Permissionid, 
                       ROW_NUMBER() OVER(PARTITION BY RoleId, PageId ORDER BY Permissionid DESC) as rn
                FROM [Master].[TblRoleAuthorization_New]
                WHERE PageId IN (1079, 1080)
            )
            DELETE FROM [Master].[TblRoleAuthorization_New]
            WHERE Permissionid IN (SELECT Permissionid FROM CTE WHERE rn > 1);
        `;
        const result = await executeQuery(query);
        return NextResponse.json({ success: true, deleted: true });
    } catch (e) {
        return NextResponse.json({ error: e.message });
    }
}
