-- =================================================================================
-- 📊 T-SQL TEMPLATE: ONE-BY-ONE SAFE TRANSACTIONAL EQUIPMENT LOAD FACTOR IMPORT SCRIPT
-- =================================================================================
-- Description:
--   This script provides a highly robust, transactional row-by-row staging import 
--   template targeting [Master].[TblEquipmentLoadFactorMapping].
--   It translates lookup values, handles errors without failing the batch, 
--   logs precise error messages into a staging 'Remarks' column, and reports a 
--   final execution count metrics summary.
-- =================================================================================

SET NOCOUNT ON;

-- =================================================================================
-- STEP 1: SETUP DEMONSTRATION STAGING TABLE
-- =================================================================================

IF OBJECT_ID('tempdb..#Staging_LoadFactors') IS NOT NULL DROP TABLE #Staging_LoadFactors;
CREATE TABLE #Staging_LoadFactors (
    RowId INT IDENTITY(1,1) PRIMARY KEY,
    EquipmentID NVARCHAR(50),      -- E.g. 'EXC-01', 'DMP-02' (Lookup Key)
    MaterialName NVARCHAR(100),    -- E.g. 'OVER BURDEN', 'ROM COAL' (Lookup Key)
    ManagementQtyTrip DECIMAL(18,2),
    NTPCQtyTrip DECIMAL(18,2),
    
    -- Processing Columns
    ImportStatus VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, SUCCESS, FAILED
    ImportRemarks NVARCHAR(500) NULL              -- Error logs / Target remarks
);

-- Populating the Staging Table with diverse test cases
-- Assumes equipment IDs and material names from active masters
INSERT INTO #Staging_LoadFactors (EquipmentID, MaterialName, ManagementQtyTrip, NTPCQtyTrip)
VALUES 
('EXC-01', 'OVER BURDEN', 15.50, 15.50),   -- Test Case 1: Valid mapping override
('DMP-02', 'ROM COAL', 12.00, 11.50),      -- Test Case 2: Valid mapping override
('EXC-01', 'OVER BURDEN', 18.00, 18.00),   -- Test Case 3: Duplicate combination in batch (Will trigger UNIQUE Constraint error or run Upsert)
('EXC-INVALID', 'OVER BURDEN', 10.00, 10.00), -- Test Case 4: Invalid Equipment ID (Will trigger lookup failure)
('EXC-01', 'MATERIAL-INVALID', 10.00, 10.00);-- Test Case 5: Invalid Material Name (Will trigger lookup failure)

-- =================================================================================
-- STEP 2: DECLARE WORK VARIABLES
-- =================================================================================

DECLARE @RowId INT;
DECLARE @StagingEqID NVARCHAR(50);
DECLARE @StagingMatName NVARCHAR(100);
DECLARE @MgmtQty DECIMAL(18,2);
DECLARE @NtpcQty DECIMAL(18,2);

DECLARE @TargetEqId INT;
DECLARE @TargetMatId INT;

-- Counter variables for metrics report
DECLARE @TotalCount INT = 0;
DECLARE @SuccessCount INT = 0;
DECLARE @FailedCount INT = 0;

-- Let's check for a mock user session ID (E.g. SlNo of Administrator user)
DECLARE @UserId INT = 1;

-- =================================================================================
-- STEP 3: TRANSACTIONAL LOOP WITH SAFE EXCEPTION HANDLING
-- =================================================================================

-- Declare cursor to process staging rows one-by-one
DECLARE ImportCursor CURSOR FOR 
SELECT 
    RowId, EquipmentID, MaterialName, ManagementQtyTrip, NTPCQtyTrip
FROM #Staging_LoadFactors
WHERE ImportStatus = 'PENDING';

OPEN ImportCursor;
FETCH NEXT FROM ImportCursor INTO @RowId, @StagingEqID, @StagingMatName, @MgmtQty, @NtpcQty;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @TotalCount = @TotalCount + 1;
    SET @TargetEqId = NULL;
    SET @TargetMatId = NULL;

    BEGIN TRY
        -- Start nested transaction for single row mapping
        BEGIN TRANSACTION;

        -- 1. Translate Equipment ID to Equipment SlNo (Master lookup)
        -- In production, replace with: SELECT @TargetEqId = SlNo FROM [Master].[TblEquipment] WHERE EuipmentID = @StagingEqID AND IsDelete = 0
        -- We will dynamically fallback to the first active equipment if test values don't exist
        SELECT TOP 1 @TargetEqId = SlNo 
        FROM [Master].[TblEquipment] 
        WHERE EuipmentID = @StagingEqID AND IsDelete = 0 AND IsActive = 1;

        IF @TargetEqId IS NULL
        BEGIN
            THROW 50001, 'Equipment ID lookup failed. Active equipment does not exist.', 1;
        END

        -- 2. Translate Material Name to Material SlNo (Master lookup)
        SELECT TOP 1 @TargetMatId = SlNo 
        FROM [Master].[TblMaterial] 
        WHERE MaterialName = @StagingMatName AND IsDelete = 0 AND IsActive = 1;

        IF @TargetMatId IS NULL
        BEGIN
            THROW 50002, 'Material Name lookup failed. Active material does not exist.', 1;
        END

        -- 3. Upsert into [Master].[TblEquipmentLoadFactorMapping]
        -- This logic handles duplicate keys safely by updating the existing configuration
        DECLARE @MappingSlNo INT = NULL;

        SELECT @MappingSlNo = SlNo 
        FROM [Master].[TblEquipmentLoadFactorMapping]
        WHERE EquipmentId = @TargetEqId AND MaterialId = @TargetMatId;

        IF @MappingSlNo IS NOT NULL
        BEGIN
            -- Update existing active override mapping
            UPDATE [Master].[TblEquipmentLoadFactorMapping]
            SET ManagementQtyTrip = @MgmtQty,
                NTPCQtyTrip = @NtpcQty,
                IsDelete = 0,
                IsActive = 1,
                UpdatedBy = @UserId,
                UpdatedDate = GETDATE()
            WHERE SlNo = @MappingSlNo;
        END
        ELSE
        BEGIN
            -- Insert brand new mapping override
            INSERT INTO [Master].[TblEquipmentLoadFactorMapping] (
                EquipmentId, MaterialId, ManagementQtyTrip, NTPCQtyTrip, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate, IsDelete, IsActive
            ) VALUES (
                @TargetEqId, @TargetMatId, @MgmtQty, @NtpcQty, @UserId, GETDATE(), @UserId, GETDATE(), 0, 1
            );

            -- Bypass SCOPE_IDENTITY() to prevent scope mismatch bugs by fetching using composite UNIQUE constraint:
            SELECT @MappingSlNo = SlNo 
            FROM [Master].[TblEquipmentLoadFactorMapping]
            WHERE EquipmentId = @TargetEqId AND MaterialId = @TargetMatId;
        END

        -- Commit single row transaction
        COMMIT TRANSACTION;

        -- Update staging status with successful SlNo
        UPDATE #Staging_LoadFactors
        SET ImportStatus = 'SUCCESS',
            ImportRemarks = 'Imported successfully. Target Mapping SlNo: ' + CAST(@MappingSlNo AS VARCHAR(10))
        WHERE RowId = @RowId;

        SET @SuccessCount = @SuccessCount + 1;

    END TRY
    BEGIN CATCH
        -- Rollback row transaction on failure
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Extract exact error remarks
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();

        -- Mark as failed in staging with exact error description
        UPDATE #Staging_LoadFactors
        SET ImportStatus = 'FAILED',
            ImportRemarks = SUBSTRING(@ErrorMessage, 1, 500)
        WHERE RowId = @RowId;

        SET @FailedCount = @FailedCount + 1;
    END CATCH;

    FETCH NEXT FROM ImportCursor INTO @RowId, @StagingEqID, @StagingMatName, @MgmtQty, @NtpcQty;
END;

CLOSE ImportCursor;
DEALLOCATE ImportCursor;

-- =================================================================================
-- STEP 4: GENERATE DETAILED IMPORT SUMMARY AND REPORTS
-- =================================================================================

PRINT '=================================================================================';
PRINT '📝 EQUIPMENT LOAD FACTOR IMPORT EXECUTION SUMMARY';
PRINT '=================================================================================';
PRINT 'Total Mappings Processed : ' + CAST(@TotalCount AS VARCHAR(10));
PRINT 'Successful Imports       : ' + CAST(@SuccessCount AS VARCHAR(10));
PRINT 'Failed Imports           : ' + CAST(@FailedCount AS VARCHAR(10));
PRINT 'Success Rate             : ' + CAST(ROUND((CAST(@SuccessCount AS FLOAT) / NULLIF(@TotalCount, 0)) * 100, 2) AS VARCHAR(10)) + '%';
PRINT '=================================================================================';

-- 1. Display Metrics Summary Matrix
SELECT 
    @TotalCount AS [Total Attempted],
    @SuccessCount AS [Succeeded (Active)],
    @FailedCount AS [Failed (Check Remarks)];

-- 2. Display Detailed Staging Mappings Execution Table
SELECT 
    RowId AS [Row No],
    EquipmentID AS [Staging Equipment ID],
    MaterialName AS [Staging Material Name],
    ManagementQtyTrip AS [Mgmt Qty],
    NTPCQtyTrip AS [NTPC Qty],
    ImportStatus AS [Import Status],
    ImportRemarks AS [Execution Remarks & Error Logs]
FROM #Staging_LoadFactors
ORDER BY RowId ASC;

-- Clean up staging temp table
DROP TABLE #Staging_LoadFactors;
