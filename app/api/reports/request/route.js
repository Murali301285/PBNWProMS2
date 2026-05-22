import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { generateReportBackground } from '@/lib/report-generator';
import { cookies } from 'next/headers';
import { authenticateUser } from '@/lib/auth';

export async function POST(req) {
    try {
        const { reportType, fromDate, toDate, requestedBy } = await req.json();

        // 1. Authenticate User from Cookie JWT
        const user = await authenticateUser(req);
        const userId = user ? user.id : (requestedBy || 1);

        // 2. Insert Request
        const result = await executeQuery(`
            INSERT INTO [Trans].[TblReportRequest] (ReportType, Criteria, Status, RequestedBy, RequestedDate)
            OUTPUT INSERTED.SlNo
            VALUES (@ReportType, @Criteria, 'PROCESSING', @RequestedBy, GETDATE())
        `, [
            { name: 'ReportType', value: reportType },
            { name: 'Criteria', value: JSON.stringify({ fromDate, toDate }) },
            { name: 'RequestedBy', value: userId },
        ]);

        const requestId = result[0].SlNo;

        // Get DB Name from cookies to pass to background worker
        const cookieStore = await cookies();
        const dbName = cookieStore.get('current_db')?.value;

        // 2. Trigger Background Task (Fire and Forget)
        // We do NOT await this.
        generateReportBackground(requestId, reportType, fromDate, toDate, dbName);

        return NextResponse.json({
            success: true,
            message: 'Request Queued',
            requestId
        });

    } catch (error) {
        console.error("Report Request Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
