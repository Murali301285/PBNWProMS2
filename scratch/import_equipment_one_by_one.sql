-- =================================================================================
-- 📊 T-SQL REFERENCE SCRIPT: ONE-BY-ONE TRANSACTIONAL EQUIPMENT DATA IMPORT
-- =================================================================================
-- Description:
--   This script disables the identity insert constraint, inserts records one-by-one
--   using nested TRY-CATCH blocks, captures insertion errors dynamically, updates 
--   the active status to 0 (Failed/Inactive) and logs error messages in the 
--   [UploadRemark] column upon failure, and finally prints a summary execution report.
-- =================================================================================

SET NOCOUNT ON;

-- 1. Enable Identity Insert to allow explicit primary key SlNo inserts
SET IDENTITY_INSERT [Master].[TblEquipment] ON;

-- 2. Clear target table (only done for fresh imports)
-- DELETE FROM [Master].[TblEquipment];

-- 3. Individual Try-Catch Insertions
-- Example row 1 (Bharat Benz Hauler - Successful OB Load Factor)
BEGIN TRY
    INSERT INTO [Master].[TblEquipment] (
        SlNo, EquipmentName, Model, EuipmentID, CostCenter, EquipmentGroupId,
        ActivityId, ScaleId, TripQty, Active, CreatedBy, CreatedDate,
        IsDelete, IsActive, PMSCode, VendorCode, OwnerTypeId, UploadRemark,
        Capacity, UnitId, FuelTypeId,
        OBUnitId, OBLoadFactor, TopSoilUnitId, TopSoilLoadFactor, 
        CoalUnitId, CoalLoadFactor, ROMCoalUnitId, ROMCoalLoadFactor, 
        CrushedCoalUnitId, CrushedCoalLoadFactor
    ) VALUES (
        1, 'BHARAT BENZ - 01', 'Bharat Benz', '1 BENZ', '6101260000', 1, -- EquipmentGroupId: 1 (Benz Group)
        4, 1, 13.5, 1, 1, GETDATE(), -- ActivityId: 4 (Hauling)
        0, 1, '2000001', 1, 1, 'Bulkupload', -- PMSCode: '2000001', Active: 1
        13.5, 1, 1, -- UnitId: 1 (BCM)
        1, 13.5000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL -- OB load factor columns mapped
    );
END TRY
BEGIN CATCH
    -- On failure, insert placeholder with active = 0 and log the error message in UploadRemark
    BEGIN TRY
        INSERT INTO [Master].[TblEquipment] (
            SlNo, EquipmentName, Model, EuipmentID, CostCenter, EquipmentGroupId,
            ActivityId, ScaleId, TripQty, Active, CreatedBy, CreatedDate,
            IsDelete, IsActive, PMSCode, VendorCode, OwnerTypeId, UploadRemark,
            Capacity, UnitId, FuelTypeId
        ) VALUES (
            1, 'BHARAT BENZ - 01', 'Bharat Benz', '1 BENZ', '6101260000', NULL,
            NULL, NULL, 0, 0, 1, GETDATE(),
            0, 0, '2000001', NULL, NULL, SUBSTRING(ERROR_MESSAGE(), 1, 250), -- Captures DB error (e.g. duplicate key, foreign key failure)
            NULL, NULL, NULL
        );
    END TRY
    BEGIN CATCH
        -- Silent fallback if even the placeholder insert fails
    END CATCH
END CATCH;


-- Example row 2 (Zaxis Loader - Successful ROM Coal Load Factor)
BEGIN TRY
    INSERT INTO [Master].[TblEquipment] (
        SlNo, EquipmentName, Model, EuipmentID, CostCenter, EquipmentGroupId,
        ActivityId, ScaleId, TripQty, Active, CreatedBy, CreatedDate,
        IsDelete, IsActive, PMSCode, VendorCode, OwnerTypeId, UploadRemark,
        Capacity, UnitId, FuelTypeId,
        OBUnitId, OBLoadFactor, TopSoilUnitId, TopSoilLoadFactor, 
        CoalUnitId, CoalLoadFactor, ROMCoalUnitId, ROMCoalLoadFactor, 
        CrushedCoalUnitId, CrushedCoalLoadFactor
    ) VALUES (
        2, 'ZAXIS 490 - 01', 'Zaxis 490', '1 ZX490', '6101260001', 2, -- EquipmentGroupId: 2 (Zaxis Group)
        3, 1, 22.0, 1, 1, GETDATE(), -- ActivityId: 3 (Loading)
        0, 1, '2000002', 1, 1, 'Bulkupload', -- PMSCode: '2000002', Active: 1
        22.0, 2, 1, -- UnitId: 2 (MT)
        NULL, NULL, NULL, NULL, NULL, NULL, 2, 22.0000, NULL, NULL -- ROM Coal load factor columns mapped
    );
END TRY
BEGIN CATCH
    -- On failure, insert placeholder with active = 0 and log the error message in UploadRemark
    BEGIN TRY
        INSERT INTO [Master].[TblEquipment] (
            SlNo, EquipmentName, Model, EuipmentID, CostCenter, EquipmentGroupId,
            ActivityId, ScaleId, TripQty, Active, CreatedBy, CreatedDate,
            IsDelete, IsActive, PMSCode, VendorCode, OwnerTypeId, UploadRemark,
            Capacity, UnitId, FuelTypeId
        ) VALUES (
            2, 'ZAXIS 490 - 01', 'Zaxis 490', '1 ZX490', '6101260001', NULL,
            NULL, NULL, 0, 0, 1, GETDATE(),
            0, 0, '2000002', NULL, NULL, SUBSTRING(ERROR_MESSAGE(), 1, 250),
            NULL, NULL, NULL
        );
    END TRY
    BEGIN CATCH
        -- Silent fallback
    END CATCH
END CATCH;


-- 4. Disable Identity Insert to restore database defaults
SET IDENTITY_INSERT [Master].[TblEquipment] OFF;

-- =================================================================================
-- 📊 5. GENERATE FINAL IMPORT EXECUTION SUMMARY REPORT
-- =================================================================================
SELECT 
    COUNT(*) AS [Total Rows Processed],
    SUM(CASE WHEN IsActive = 1 AND UploadRemark = 'Bulkupload' THEN 1 ELSE 0 END) AS [Successful Active Records],
    SUM(CASE WHEN IsActive = 0 OR UploadRemark <> 'Bulkupload' THEN 1 ELSE 0 END) AS [Failed Placeholder Records]
FROM [Master].[TblEquipment];

-- Fetch detailed status log
SELECT 
    SlNo as [Row No], 
    EquipmentName as [Equipment Name], 
    PMSCode as [PMS Code],
    CASE WHEN IsActive = 1 AND UploadRemark = 'Bulkupload' THEN 'SUCCESS' ELSE 'FAILED' END as [Status],
    UploadRemark as [Database Remark/Error Log]
FROM [Master].[TblEquipment]
ORDER BY SlNo ASC;
