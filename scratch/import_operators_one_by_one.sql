-- =================================================================================
-- 📊 T-SQL TEMPLATE: ONE-BY-ONE SAFE TRANSACTIONAL OPERATOR INGESTION MIGRATION SCRIPT
-- =================================================================================
-- Description:
--   This script provides a highly robust, row-by-row staging import query targeting 
--   [Master].[TblOperator]. It resolves category and subcategory lookups, inserts 
--   dynamic lookup values if not found, updates existing operator records if found 
--   by OperatorId, inserts new operator records if not found, bypasses SCOPE_IDENTITY(), 
--   captures individual execution errors, logs failures to staging, and prints metrics.
-- =================================================================================

SET NOCOUNT ON;

-- =================================================================================
-- STEP 1: SETUP STAGING TEMPORARY TABLE WITH MOCK DIVERSE DATA
-- =================================================================================

IF OBJECT_ID('tempdb..#Staging_Operators') IS NOT NULL DROP TABLE #Staging_Operators;
CREATE TABLE #Staging_Operators (
    RowId INT IDENTITY(1,1) PRIMARY KEY,
    OperatorID NVARCHAR(50),        -- Matching key in target [TblOperator]
    OperatorName NVARCHAR(100),
    MobileNo NVARCHAR(20) NULL,
    CategoryName NVARCHAR(100),     -- E.g. 'Operator', 'Shift Incharge'
    SubCategoryName NVARCHAR(100),  -- E.g. 'Bharat Benz Operator', 'Engineer-Mines'
    Remarks NVARCHAR(500) NULL,
    
    -- Processing Audit Columns
    ImportStatus VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, SUCCESS, FAILED
    ImportRemarks NVARCHAR(500) NULL              -- Targets detailed error trace
);

-- Populating staging with test rows
INSERT INTO #Staging_Operators (OperatorID, OperatorName, MobileNo, CategoryName, SubCategoryName, Remarks)
VALUES 
('90000026', 'Mukesh Kumar', '9934573630', 'Operator', 'Bharat Benz Operator', 'Relay-A'),  -- Existing record to update
('61000085', 'Pankaj Kumar Mahto', '7070696805', 'Shift Incharge', 'Assistant Manager-Mining', 'L-1'), -- Existing record to update
('90099999', 'New Test Operator', '9876543210', 'Operator', 'Excavator Operator', 'New Hire'),      -- New operator to insert
('90088888', 'Category Insert Test', '1122334455', 'New Category', 'New Subcategory', 'Mock'),      -- Tests dynamic lookups insert
('OP-INVALID', 'Error Match Test', NULL, NULL, NULL, 'Missing mandatory details');                -- Intentionally fails lookups validation

-- =================================================================================
-- STEP 2: DECLARE WORK & LOOKUP VARIABLES
-- =================================================================================

DECLARE @RowId INT;
DECLARE @StagingOpID NVARCHAR(50);
DECLARE @StagingName NVARCHAR(100);
DECLARE @StagingMobile NVARCHAR(20);
DECLARE @StagingCatName NVARCHAR(100);
DECLARE @StagingSubCatName NVARCHAR(100);
DECLARE @StagingRemarks NVARCHAR(500);

DECLARE @ResolvedCatId INT;
DECLARE @ResolvedSubCatId INT;

-- Metrics Counters
DECLARE @TotalCount INT = 0;
DECLARE @SuccessCount INT = 0;
DECLARE @FailedCount INT = 0;

-- Audit Session User SlNo (Defaults to dynamic first active user in the database)
DECLARE @UserId INT = 1;
SELECT TOP 1 @UserId = SlNo FROM [Master].[TblUser] ORDER BY SlNo ASC;
IF @UserId IS NULL SELECT TOP 1 @UserId = SlNo FROM [Master].[TblUser_New] ORDER BY SlNo ASC;
IF @UserId IS NULL SET @UserId = 1;

-- =================================================================================
-- STEP 3: TRANSACTIONAL MIGRATION CURSOR LOOP
-- =================================================================================

DECLARE OpCursor CURSOR FOR 
SELECT 
    RowId, OperatorID, OperatorName, MobileNo, CategoryName, SubCategoryName, Remarks
FROM #Staging_Operators
WHERE ImportStatus = 'PENDING';

OPEN OpCursor;
FETCH NEXT FROM OpCursor INTO @RowId, @StagingOpID, @StagingName, @StagingMobile, @StagingCatName, @StagingSubCatName, @StagingRemarks;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @TotalCount = @TotalCount + 1;
    SET @ResolvedCatId = NULL;
    SET @ResolvedSubCatId = NULL;

    BEGIN TRY
        -- Start transaction boundary for safe single-row ingestion
        BEGIN TRANSACTION;

        -- 1. Validate mandatory staging inputs
        IF @StagingOpID IS NULL OR @StagingName IS NULL
        BEGIN
            THROW 60001, 'Operator ID and Name are mandatory fields.', 1;
        END

        -- 2. Resolve or Insert Category Lookup
        IF @StagingCatName IS NOT NULL
        BEGIN
            SELECT TOP 1 @ResolvedCatId = SlNo 
            FROM [Master].[TblOperatorCategory] 
            WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@StagingCatName))) AND IsDelete = 0;

            IF @ResolvedCatId IS NULL
            BEGIN
                -- Insert category dynamically
                INSERT INTO [Master].[TblOperatorCategory] (Name, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate, IsDelete, IsActive)
                VALUES (@StagingCatName, @UserId, GETDATE(), @UserId, GETDATE(), 0, 1);

                -- Bypass SCOPE_IDENTITY() to prevent trigger discrepancies
                SELECT TOP 1 @ResolvedCatId = SlNo 
                FROM [Master].[TblOperatorCategory] 
                WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@StagingCatName))) AND IsDelete = 0;
            END
        END

        -- 3. Resolve or Insert Subcategory Lookup
        IF @StagingSubCatName IS NOT NULL AND @ResolvedCatId IS NOT NULL
        BEGIN
            SELECT TOP 1 @ResolvedSubCatId = SlNo 
            FROM [Master].[TblOperatorSubCategory] 
            WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@StagingSubCatName))) AND CategoryId = @ResolvedCatId AND IsDelete = 0;

            IF @ResolvedSubCatId IS NULL
            BEGIN
                -- Insert subcategory dynamically
                INSERT INTO [Master].[TblOperatorSubCategory] (CategoryId, Name, CreatedBy, CreatedDate, UpdatedBy, UpdatedDate, IsDelete, IsActive)
                VALUES (@ResolvedCatId, @StagingSubCatName, @UserId, GETDATE(), @UserId, GETDATE(), 0, 1);

                -- Bypass SCOPE_IDENTITY()
                SELECT TOP 1 @ResolvedSubCatId = SlNo 
                FROM [Master].[TblOperatorSubCategory] 
                WHERE LOWER(LTRIM(RTRIM(Name))) = LOWER(LTRIM(RTRIM(@StagingSubCatName))) AND CategoryId = @ResolvedCatId AND IsDelete = 0;
            END
        END

        -- 4. Ingest or Update target [Master].[TblOperator] record
        DECLARE @TargetSlNo INT = NULL;

        SELECT TOP 1 @TargetSlNo = SlNo 
        FROM [Master].[TblOperator] 
        WHERE LTRIM(RTRIM(OperatorId)) = LTRIM(RTRIM(@StagingOpID));

        IF @TargetSlNo IS NOT NULL
        BEGIN
            -- Record found -> UPDATE details
            UPDATE [Master].[TblOperator]
            SET OperatorName = @StagingName,
                MobileNo = @StagingMobile,
                Remarks = @StagingRemarks,
                CategoryId = ISNULL(@ResolvedCatId, CategoryId),
                SubCategoryId = ISNULL(@ResolvedSubCatId, SubCategoryId),
                IsActive = 1,
                IsDelete = 0,
                UpdatedBy = @UserId,
                UpdatedDate = GETDATE()
            WHERE SlNo = @TargetSlNo;
        END
        ELSE
        BEGIN
            -- Record not found -> INSERT new operator
            DECLARE @NextSlNo INT = 1;
            SELECT @NextSlNo = ISNULL(MAX(SlNo), 0) + 1 FROM [Master].[TblOperator];

            -- identity column insertion
            SET IDENTITY_INSERT [Master].[TblOperator] ON;
            INSERT INTO [Master].[TblOperator] (
                SlNo, OperatorId, OperatorName, MobileNo, Remarks, CategoryId, SubCategoryId,
                CreatedBy, CreatedDate, UpdatedBy, UpdatedDate, IsDelete, IsActive, UploadRemark
            ) VALUES (
                @NextSlNo, @StagingOpID, @StagingName, @StagingMobile, @StagingRemarks, @ResolvedCatId, @ResolvedSubCatId,
                @UserId, GETDATE(), @UserId, GETDATE(), 0, 1, 'StagingIngestion'
            );
            SET IDENTITY_INSERT [Master].[TblOperator] OFF;

            -- Bypass SCOPE_IDENTITY()
            SELECT TOP 1 @TargetSlNo = SlNo 
            FROM [Master].[TblOperator] 
            WHERE LTRIM(RTRIM(OperatorId)) = LTRIM(RTRIM(@StagingOpID));
        END

        -- Commit single row transaction
        COMMIT TRANSACTION;

        -- Update staging status with successful SlNo
        UPDATE #Staging_Operators
        SET ImportStatus = 'SUCCESS',
            ImportRemarks = 'Ingested successfully. Target SlNo: ' + CAST(@TargetSlNo AS VARCHAR(10))
        WHERE RowId = @RowId;

        SET @SuccessCount = @SuccessCount + 1;

    END TRY
    BEGIN CATCH
        -- Rollback row transaction on failure
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Safe identity insert reset on error
        BEGIN TRY
            SET IDENTITY_INSERT [Master].[TblOperator] OFF;
        END TRY
        BEGIN CATCH
            -- Suppress secondary reset errors
        END CATCH

        -- Extract database error message
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();

        -- Mark as failed in staging with detailed error message
        UPDATE #Staging_Operators
        SET ImportStatus = 'FAILED',
            ImportRemarks = SUBSTRING(@ErrorMessage, 1, 500)
        WHERE RowId = @RowId;

        SET @FailedCount = @FailedCount + 1;
    END CATCH;

    FETCH NEXT FROM OpCursor INTO @RowId, @StagingOpID, @StagingName, @StagingMobile, @StagingCatName, @StagingSubCatName, @StagingRemarks;
END;

CLOSE OpCursor;
DEALLOCATE OpCursor;

-- =================================================================================
-- STEP 4: MIGRATION STATISTICS RUN SUMMARY REPORT
-- =================================================================================

PRINT '=================================================================================';
PRINT '📝 OPERATOR MIGRATION IMPORT SUMMARY REPORT';
PRINT '=================================================================================';
PRINT 'Total Processed Staging Rows : ' + CAST(@TotalCount AS VARCHAR(10));
PRINT 'Succeeded Operator Ingests   : ' + CAST(@SuccessCount AS VARCHAR(10));
PRINT 'Failed Operator Ingests      : ' + CAST(@FailedCount AS VARCHAR(10));
PRINT 'Run Ingestion Success Rate   : ' + CAST(ROUND((CAST(@SuccessCount AS FLOAT) / NULLIF(@TotalCount, 0)) * 100, 2) AS VARCHAR(10)) + '%';
PRINT '=================================================================================';

-- 1. Display Metrics Summary Matrix
SELECT 
    @TotalCount AS [Total Attempted],
    @SuccessCount AS [Succeeded (Active)],
    @FailedCount AS [Failed (Check Remarks)];

-- 2. Display Detailed Staging Execution Log
SELECT 
    RowId AS [Row No],
    OperatorID AS [Staging Operator ID],
    OperatorName AS [Staging Operator Name],
    MobileNo AS [Staging Mobile No],
    CategoryName AS [Staging Category],
    SubCategoryName AS [Staging Subcategory],
    ImportStatus AS [Import Status],
    ImportRemarks AS [Execution Log / Error Remarks]
FROM #Staging_Operators
ORDER BY RowId ASC;

-- Clean up staging table
DROP TABLE #Staging_Operators;
