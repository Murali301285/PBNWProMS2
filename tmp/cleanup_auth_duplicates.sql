
-- Cleanup duplicates in TblRoleAuthorization_New
-- Keep the row with the MAX Permissionid for each RoleId + PageId combination
-- Mark others as IsDeleted = 1 (or hard delete if preferred, but soft delete is safer)

WITH CTE AS (
    SELECT 
        Permissionid, 
        RoleId, 
        PageId, 
        ROW_NUMBER() OVER(PARTITION BY RoleId, PageId ORDER BY Permissionid DESC) as RowNum
    FROM [Master].[TblRoleAuthorization_New]
    WHERE IsActive = 1 AND IsDeleted = 0
)
UPDATE [Master].[TblRoleAuthorization_New]
SET IsDeleted = 1, IsActive = 0, UpdatedDate = GETDATE()
WHERE Permissionid IN (
    SELECT Permissionid 
    FROM CTE 
    WHERE RowNum > 1
);
