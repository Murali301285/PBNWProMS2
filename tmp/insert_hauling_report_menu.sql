IF NOT EXISTS (SELECT 1 FROM [Master].TblMenuMaster WHERE Url = '/dashboard/reports/operator-performance-hauling')
BEGIN
    INSERT INTO [Master].TblMenuMaster (Menuname, Url, Parentid, Ismenu, Sortby, Createdate, IsDelete, IsActive, Icon, Module, Controller, Method, IsMobile)
    VALUES ('Operator Performance - Hauling', '/dashboard/reports/operator-performance-hauling', 61, 1, 6, GETDATE(), 0, 1, 'FileText', 'Reports', NULL, NULL, 0);
    PRINT 'Operator Performance - Hauling menu added successfully.';
END
ELSE
BEGIN
    PRINT 'Operator Performance - Hauling menu already exists.';
END

IF NOT EXISTS (SELECT 1 FROM [Master].TblMenuMaster WHERE Url = '/dashboard/reports/operator-performance-loading')
BEGIN
    INSERT INTO [Master].TblMenuMaster (Menuname, Url, Parentid, Ismenu, Sortby, Createdate, IsDelete, IsActive, Icon, Module, Controller, Method, IsMobile)
    VALUES ('Operator Performance - Loading', '/dashboard/reports/operator-performance-loading', 61, 1, 7, GETDATE(), 0, 1, 'FileText', 'Reports', NULL, NULL, 0);
    PRINT 'Operator Performance - Loading menu added successfully.';
END
ELSE
BEGIN
     PRINT 'Operator Performance - Loading menu already exists.';
END
