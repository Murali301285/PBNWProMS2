import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(req) {
    try {
        // 1. Authenticate User
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
        let userId = null;

        try {
            const decoded = jwt.verify(token, SECRET);
            userId = decoded.id;
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID not found' }, { status: 401 });
        }

        // 2. Fetch Reports (Filtered by User & 7 Days Validity)
        // User Requirement: "validity for this report is 7 days... and only users request history should be visible"
        const query = `
            SELECT 
                SlNo, ReportType, Criteria, Status, ArtifactPath, 
                FORMAT(RequestedDate, 'dd-MMM-yyyy HH:mm:ss') as RequestedDate,
                CompletedDate, ErrorMessage
            FROM [Trans].[TblReportRequest]
            WHERE IsDelete = 0
            AND RequestedBy = @UserId
            AND RequestedDate >= DATEADD(day, -7, GETDATE())
            ORDER BY RequestedDate DESC
        `;

        const data = await executeQuery(query, [
            { name: 'UserId', value: userId }
        ]);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Report Status Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
