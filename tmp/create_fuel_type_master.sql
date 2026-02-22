-- 1. Create Master.TblFuelType Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblFuelType')
BEGIN
    CREATE TABLE Master.TblFuelType (
        SlNo INT IDENTITY(1,1) PRIMARY KEY,
        FuelType NVARCHAR(100) NOT NULL UNIQUE,
        Remarks NVARCHAR(MAX) NULL,
        IsActive BIT DEFAULT 1,
        IsDelete BIT DEFAULT 0,
        CreatedBy NVARCHAR(100) DEFAULT 'System',
        CreatedDate DATETIME DEFAULT GETDATE(),
        UpdatedBy NVARCHAR(100) NULL,
        UpdatedDate DATETIME NULL
    );
    PRINT 'Table Master.TblFuelType created successfully.';
END
ELSE
BEGIN
    PRINT 'Table Master.TblFuelType already exists.';
END
GO

-- 2. Insert Default Data
INSERT INTO Master.TblFuelType (FuelType, Remarks)
SELECT 'Electrical', 'Default' WHERE NOT EXISTS (SELECT 1 FROM Master.TblFuelType WHERE FuelType = 'Electrical')
UNION ALL
SELECT 'Diesel', 'Default' WHERE NOT EXISTS (SELECT 1 FROM Master.TblFuelType WHERE FuelType = 'Diesel')
UNION ALL
SELECT 'CNG', 'Default' WHERE NOT EXISTS (SELECT 1 FROM Master.TblFuelType WHERE FuelType = 'CNG')
UNION ALL
SELECT 'Petrol', 'Default' WHERE NOT EXISTS (SELECT 1 FROM Master.TblFuelType WHERE FuelType = 'Petrol');
PRINT 'Default data inserted into Master.TblFuelType.';
GO

-- 3. Insert into Page and Menu Configuration
DECLARE @PageName NVARCHAR(100) = 'Fuel Type';
DECLARE @PagePath NVARCHAR(100) = '/dashboard/master/fuel-type';
DECLARE @MenuName NVARCHAR(100) = 'Fuel Type';
DECLARE @ParentMenuId INT = 2; -- 'Master' Menu ID which we found earlier
DECLARE @RoleId INT = 1; -- 'Admin' Role ID
DECLARE @PageId INT;
DECLARE @MenuId INT;

-- A. Insert into Master.TblPage
IF NOT EXISTS (SELECT 1 FROM Master.TblPage WHERE PagePath = @PagePath)
BEGIN
    INSERT INTO Master.TblPage (PageName, PagePath, IsActive, IsDelete, CreatedBy, CreatedDate)
    VALUES (@PageName, @PagePath, 1, 0, 'System', GETDATE());
    SET @PageId = SCOPE_IDENTITY();
    PRINT 'Page inserted into Master.TblPage. ID: ' + CAST(@PageId AS VARCHAR);
END
ELSE
BEGIN
    SELECT @PageId = SlNo FROM Master.TblPage WHERE PagePath = @PagePath;
    PRINT 'Page already exists in Master.TblPage. ID: ' + CAST(@PageId AS VARCHAR);
END

-- B. Insert into Master.TblMenuMaster
IF NOT EXISTS (SELECT 1 FROM Master.TblMenuMaster WHERE Menuname = @MenuName AND Parentid = @ParentMenuId)
BEGIN
    INSERT INTO Master.TblMenuMaster (Menuname, Url, Parentid, Ismenu, Sortby, Createdate, IsDelete, IsActive)
    VALUES (@MenuName, @PagePath, @ParentMenuId, 1, 100, GETDATE(), 0, 1); -- Adjusted Sortby, check if needed
    SET @MenuId = SCOPE_IDENTITY();
    PRINT 'Menu inserted into Master.TblMenuMaster. ID: ' + CAST(@MenuId AS VARCHAR);
END
ELSE
BEGIN
    SELECT @MenuId = MenuId FROM Master.TblMenuMaster WHERE Menuname = @MenuName AND Parentid = @ParentMenuId;
    PRINT 'Menu already exists in Master.TblMenuMaster. ID: ' + CAST(@MenuId AS VARCHAR);
END

-- C. Insert Authorization for Admin
IF NOT EXISTS (SELECT 1 FROM Master.TblRoleAuthorization_New WHERE RoleId = @RoleId AND MenuId = @MenuId)
BEGIN
    INSERT INTO Master.TblRoleAuthorization_New (RoleId, MenuId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate)
    VALUES (@RoleId, @MenuId, @PageId, 1, 1, 1, 1, 1, 0, GETDATE());
    PRINT 'Authorization granted to Admin.';
END
ELSE
BEGIN
    PRINT 'Authorization already exists for Admin.';
END
GO
