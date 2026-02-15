import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req) {
    try {
        const { roleId, permissions } = await req.json();

        if (!roleId || !Array.isArray(permissions)) {
            return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
        }

        // We will process updates in a loop or bulk. 
        // For MSSQL, bulk merge is better, but loop is simpler for now.
        // We will utilize a transaction if possible, or just sequential updates.
        // Since we are using simple executeQuery, we'll do sequential upserts.

        for (const p of permissions) {
            // Robust UPSERT logic to prevent duplicates
            // Check if active record exists for RoleId + PageId
            // If yes -> Update
            // If no -> Insert

            const upsertQuery = `
                IF EXISTS (SELECT 1 FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = @RoleId AND PageId = @PageId AND IsDeleted = 0)
                BEGIN
                    UPDATE [Master].[TblRoleAuthorization_New]
                    SET IsView = @IsView, IsAdd = @IsAdd, IsEdit = @IsEdit, IsDelete = @IsDelete, UpdatedDate = GETDATE()
                    WHERE RoleId = @RoleId AND PageId = @PageId AND IsDeleted = 0
                END
                ELSE
                BEGIN
                    INSERT INTO [Master].[TblRoleAuthorization_New] 
                    (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate)
                    VALUES 
                    (@RoleId, @PageId, @IsView, @IsAdd, @IsEdit, @IsDelete, 1, 0, GETDATE())
                END
            `;

            await executeQuery(upsertQuery, [
                { name: 'RoleId', value: roleId },
                { name: 'PageId', value: p.PageId },
                { name: 'IsView', value: p.IsView },
                { name: 'IsAdd', value: p.IsAdd },
                { name: 'IsEdit', value: p.IsEdit },
                { name: 'IsDelete', value: p.IsDelete }
            ]);
        }

        return NextResponse.json({ success: true, message: 'Permissions updated successfully' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
