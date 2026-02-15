IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Report')
BEGIN
    SELECT 'Report schema does NOT exist' as Result;
END
ELSE
BEGIN
    SELECT 'Report schema EXISTS' as Result;
END
