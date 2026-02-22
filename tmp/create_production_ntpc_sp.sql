
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_ProductionNTPCReport]
    @Date DATE,
    @ShiftId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- =============================================
    -- Constants & Configuration
    -- =============================================
    DECLARE @Material_Coal INT = 7;      -- ROM Coal
    DECLARE @Material_TopSoil INT = 1;   -- Top Soil
    DECLARE @Material_OB INT = 2;        -- OB
    DECLARE @Destination_WP3 INT = 2;    -- WP-3 Destination

    -- =============================================
    -- 1. Production Summary (Coal & OB)
    -- =============================================
    SELECT
        -- Production Quantity (Total)
        SUM(CASE 
            WHEN MaterialId = @Material_Coal THEN ISNULL(NoofTrip, 0) * ISNULL(NtpcQtyTrip, 0) 
            ELSE 0 
        END) AS ProdCoal,
        
        SUM(CASE 
            WHEN MaterialId IN (@Material_TopSoil, @Material_OB) THEN ISNULL(NoofTrip, 0) * ISNULL(NtpcQtyTrip, 0) 
            ELSE 0 
        END) AS ProdOB,

        -- WP-3 Quantity (Specific Destination)
        SUM(CASE 
            WHEN MaterialId = @Material_Coal AND DestinationId = @Destination_WP3 THEN ISNULL(NoofTrip, 0) * ISNULL(NtpcQtyTrip, 0) 
            ELSE 0 
        END) AS WPCoalQty,
        
        SUM(CASE 
            WHEN MaterialId IN (@Material_TopSoil, @Material_OB) AND DestinationId = @Destination_WP3 THEN ISNULL(NoofTrip, 0) * ISNULL(NtpcQtyTrip, 0) 
            ELSE 0 
        END) AS WPObQty

    FROM [Trans].[TblLoading] WITH(NOLOCK)
    WHERE CAST(LoadingDate AS DATE) = @Date
      AND ShiftId = @ShiftId
      AND IsDelete = 0;

    -- =============================================
    -- 2. Crusher Details
    -- =============================================
    SELECT
        P.Name AS Plant,
        ISNULL(C.RunningHr, 0) AS RunningHr,
        ISNULL(C.TotalQty, 0) AS TotalQty
    FROM [Master].[TblPlant] P WITH(NOLOCK)
    LEFT JOIN [Trans].[TblCrusher] C WITH(NOLOCK) 
        ON P.SlNo = C.PlantId 
        AND CAST(C.Date AS DATE) = @Date 
        AND C.ShiftId = @ShiftId
        AND C.IsDelete = 0
    WHERE P.IsDelete = 0 
      AND P.IsDPRReport = 1 -- Assuming this flag logic from original SP is correct
    ORDER BY P.Name;

    -- =============================================
    -- 3. Header Information
    -- =============================================
    SELECT
        FORMAT(@Date, 'dd-MM-yyyy') AS Date,
        S.ShiftName,
        '' AS Logo
    FROM [Master].[TblShift] S WITH(NOLOCK)
    WHERE S.SlNo = @ShiftId;

END
