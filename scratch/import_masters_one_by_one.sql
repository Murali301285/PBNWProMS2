-- =================================================================================
-- 📊 T-SQL TEMPLATE: ONE-BY-ONE SAFE TRANSACTIONAL MASTER IMPORT SCRIPT
-- =================================================================================
-- Description:
--   This script provides a highly robust, enterprise-grade pattern for importing 
--   master records from a Staging Import Table into a Target Master Table.
--   It processes records one-by-one, handles constraint violations (e.g. duplicate keys,
--   missing foreign key mappings) without failing the entire batch, updates the staging 
--   table with the exact status and error details, and outputs a detailed execution summary.
--
-- Features:
--   1. Dynamic Identity Insert handling (SET IDENTITY_INSERT ON/OFF).
--   2. Bypasses reliance on SCOPE_IDENTITY() to prevent scope mismatch bugs.
--   3. Strict row-by-row Try-Catch block to log specific database errors in a 'Remarks' field.
--   4. Execution metrics summary reporting total attempted, succeeded, and failed rows.
-- =================================================================================

-- =================================================================================
-- STEP 1: SETUP DEMONSTRATION STAGING AND TARGET MASTER TABLES
-- (In your production environment, replace these names with your real staging/master tables)
-- =================================================================================

SET NOCOUNT ON;

-- Let's check and create a demonstration schema if needed, or work within the temporary database
IF OBJECT_ID('tempdb..#Staging_Equipment') IS NOT NULL DROP TABLE #Staging_Equipment;
CREATE TABLE #Staging_Equipment (
    RowId INT IDENTITY(1,1) PRIMARY KEY,
    PMSCode VARCHAR(50),
    EquipmentName VARCHAR(100),
    Model VARCHAR(100),
    EuipmentID VARCHAR(50),
    CostCenter VARCHAR(50),
    EquipmentGroupId INT,
    OwnerTypeId INT,
    IsActive BIT,
    
    -- Processing Columns
    ImportStatus VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, SUCCESS, FAILED
    ImportRemarks NVARCHAR(500) NULL              -- Logs database errors
);

-- Populating the Staging Table with test cases (some good, some bad to test error logging)
INSERT INTO #Staging_Equipment (PMSCode, EquipmentName, Model, EuipmentID, CostCenter, EquipmentGroupId, OwnerTypeId, IsActive)
VALUES 
('PMS-001', 'CATERPILLAR EXCAVATOR 320', 'CAT 320', 'EXC-01', 'CC-101', 1, 1, 1), -- Good Row
('PMS-002', 'KOMATSU DUMP TRUCK HD785', 'HD785', 'DMP-02', 'CC-102', 2, 1, 1),    -- Good Row
('PMS-001', 'DUPLICATE PMS CODE MACHINE', 'CAT 320', 'EXC-02', 'CC-101', 1, 1, 1), -- Bad Row: Duplicate PMSCode (Unique Constraint)
('PMS-003', 'INVALID GROUP ID LOADER', 'VOLVO L220', 'LDR-03', 'CC-103', 999, 1, 1); -- Bad Row: Fails Foreign Key check in real target DB

-- =================================================================================
-- STEP 2: DEFINE VARIABLES & PREPARE TARGET INSERT ENVIRONMENT
-- =================================================================================

-- Declare variables to hold values from the staging table cursor
DECLARE @PMSCode VARCHAR(50);
DECLARE @EquipmentName VARCHAR(100);
DECLARE @Model VARCHAR(100);
DECLARE @EuipmentID VARCHAR(50);
DECLARE @CostCenter VARCHAR(50);
DECLARE @EquipmentGroupId INT;
DECLARE @OwnerTypeId INT;
DECLARE @IsActive BIT;
DECLARE @RowId INT;

-- Counter variables for the execution summary
DECLARE @TotalCount INT = 0;
DECLARE @SuccessCount INT = 0;
DECLARE @FailedCount INT = 0;

-- Define a temporary table to simulate the target master (if it doesn't already exist)
-- In production, you would target [Master].[TblEquipment], etc.
IF OBJECT_ID('tempdb..#Target_TblEquipment') IS NOT NULL DROP TABLE #Target_TblEquipment;
CREATE TABLE #Target_TblEquipment (
    SlNo INT IDENTITY(1,1) PRIMARY KEY,
    PMSCode VARCHAR(50) UNIQUE, -- Unique Constraint
    EquipmentName VARCHAR(100),
    Model VARCHAR(100),
    EuipmentID VARCHAR(50),
    CostCenter VARCHAR(50),
    EquipmentGroupId INT,
    OwnerTypeId INT,
    IsActive BIT,
    UploadRemark VARCHAR(250)
);

-- =================================================================================
-- STEP 3: TRANSACTIONAL ONE-BY-ONE PROCESSING LOOP (USING CURSOR)
-- =================================================================================

-- Declare cursor to fetch one staging row at a time
DECLARE ImportCursor CURSOR FOR 
SELECT 
    RowId, PMSCode, EquipmentName, Model, EuipmentID, CostCenter, EquipmentGroupId, OwnerTypeId, IsActive
FROM #Staging_Equipment
WHERE ImportStatus = 'PENDING';

OPEN ImportCursor;
FETCH NEXT FROM ImportCursor INTO @RowId, @PMSCode, @EquipmentName, @Model, @EuipmentID, @CostCenter, @EquipmentGroupId, @OwnerTypeId, @IsActive;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @TotalCount = @TotalCount + 1;
    
    -- In production: If inserting explicit SlNo/Ids from staging, enable identity insert
    -- SET IDENTITY_INSERT [Master].[TblEquipment] ON;

    BEGIN TRY
        -- Start a nested transaction for this specific row insertion
        BEGIN TRANSACTION;
        
        -- Custom validation: Simulating foreign key mapping check
        -- In production, you would match against real master tables [Master].[TblEquipmentGroup]
        IF @EquipmentGroupId NOT IN (1, 2, 3) 
        BEGIN
            -- Throw user-defined error if lookup value is missing/invalid
            THROW 50001, 'Invalid EquipmentGroupId. Lookup value does not exist in Equipment Groups.', 1;
        END

        -- Insert record into target table
        INSERT INTO #Target_TblEquipment (
            PMSCode, EquipmentName, Model, EuipmentID, CostCenter, EquipmentGroupId, OwnerTypeId, IsActive, UploadRemark
        ) VALUES (
            @PMSCode, @EquipmentName, @Model, @EuipmentID, @CostCenter, @EquipmentGroupId, @OwnerTypeId, @IsActive, 'Bulk Import Script'
        );

        -- If target table has an auto-incrementing ID and we need it elsewhere in the transaction:
        -- Bypassing SCOPE_IDENTITY() safely by querying the record we just inserted using the unique key:
        DECLARE @NewSlNo INT;
        SELECT @NewSlNo = SlNo FROM #Target_TblEquipment WHERE PMSCode = @PMSCode;

        -- Commit the transaction if the insert is successful
        COMMIT TRANSACTION;
        
        -- Mark as Success in the staging table
        UPDATE #Staging_Equipment
        SET 
            ImportStatus = 'SUCCESS',
            ImportRemarks = 'Imported successfully. Target SlNo: ' + CAST(@NewSlNo AS VARCHAR(10))
        WHERE RowId = @RowId;

        SET @SuccessCount = @SuccessCount + 1;

    END TRY
    BEGIN CATCH
        -- Rollback current row transaction if it failed
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Extract exact SQL Server database error details
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        -- Mark as Failed in the staging table and log exact error remarks
        UPDATE #Staging_Equipment
        SET 
            ImportStatus = 'FAILED',
            ImportRemarks = SUBSTRING(@ErrorMessage, 1, 500)
        WHERE RowId = @RowId;

        SET @FailedCount = @FailedCount + 1;
    END CATCH;

    -- In production: Disable identity insert
    -- SET IDENTITY_INSERT [Master].[TblEquipment] OFF;

    FETCH NEXT FROM ImportCursor INTO @RowId, @PMSCode, @EquipmentName, @Model, @EuipmentID, @CostCenter, @EquipmentGroupId, @OwnerTypeId, @IsActive;
END;

CLOSE ImportCursor;
DEALLOCATE ImportCursor;

-- =================================================================================
-- STEP 4: GENERATE DETAILED IMPORT SUMMARY AND REPORTS
-- =================================================================================

PRINT '=================================================================================';
PRINT '📝 MASTER BULK IMPORT EXECUTION SUMMARY';
PRINT '=================================================================================';
PRINT 'Total Rows Processed : ' + CAST(@TotalCount AS VARCHAR(10));
PRINT 'Successful Imports   : ' + CAST(@SuccessCount AS VARCHAR(10));
PRINT 'Failed Imports       : ' + CAST(@FailedCount AS VARCHAR(10));
PRINT 'Success Rate         : ' + CAST(ROUND((CAST(@SuccessCount AS FLOAT) / NULLIF(@TotalCount, 0)) * 100, 2) AS VARCHAR(10)) + '%';
PRINT '=================================================================================';

-- 1. Display Grid Metrics Summary
SELECT 
    @TotalCount AS [Total Processed],
    @SuccessCount AS [Succeeded (Active)],
    @FailedCount AS [Failed (Inactive/Remarks Logged)];

-- 2. Display Detailed Staging Table Status Matrix
SELECT 
    RowId AS [Row No],
    PMSCode AS [PMS Code],
    EquipmentName AS [Equipment Name],
    ImportStatus AS [Import Status],
    ImportRemarks AS [Execution Remarks & Error Logs]
FROM #Staging_Equipment
ORDER BY RowId ASC;

-- 3. Display Successfully Created Master Records
SELECT 
    SlNo AS [Target SlNo],
    PMSCode AS [PMS Code],
    EquipmentName AS [Equipment Name],
    CostCenter AS [Cost Center],
    UploadRemark AS [Upload Source]
FROM #Target_TblEquipment;

-- Clean up demonstration temp tables
DROP TABLE #Staging_Equipment;
DROP TABLE #Target_TblEquipment;
