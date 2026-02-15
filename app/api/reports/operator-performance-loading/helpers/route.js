
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Fetching Operators...");
        // Use a simpler query first to avoid potential multi-line issues if that was problem
        const operators = await executeQuery(
            "SELECT SlNo as id, OperatorName as name FROM [Master].[TblOperator] WHERE IsDelete = 0 AND IsActive = 1 ORDER BY OperatorName"
        );
        console.log(`Fetched ${operators?.length} operators`);

        return NextResponse.json({
            operators
        });

    } catch (error) {
        console.error("Operator Helper API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
