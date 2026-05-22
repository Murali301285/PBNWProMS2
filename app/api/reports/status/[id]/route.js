import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        // Authenticate User from Cookie JWT
        const user = await authenticateUser(request);
        if (!user) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        // Soft delete the report request, matching the report ID and the logged-in user ID
        const result = await executeQuery(`
            UPDATE [Trans].[TblReportRequest]
            SET IsDelete = 1
            OUTPUT INSERTED.SlNo
            WHERE SlNo = @id AND RequestedBy = @userId AND IsDelete = 0
        `, [
            { name: 'id', value: id },
            { name: 'userId', value: user.id }
        ]);

        if (result && result.length > 0) {
            return NextResponse.json({ success: true, message: 'Record cleared successfully' });
        } else {
            return NextResponse.json({ success: false, message: 'Record not found or access denied' }, { status: 404 });
        }
    } catch (error) {
        console.error("Delete Report Request Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
