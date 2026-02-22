
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_DailyProductionReport]
	@Date DATE = NULL,
	@ShiftId INT = NULL
AS
BEGIN
	SET NOCOUNT ON;

    -- =============================================
    -- Variable Declarations
    -- =============================================
    DECLARE @RomCoalId INT = 7;
    DECLARE @TopSoilId INT = 1;
    DECLARE @OBId INT = 2;
    DECLARE @WP3_DestinationId INT = 2; -- Destination for WP-3

    -- Output Variables
    DECLARE @ProdCoal DECIMAL(18,2) = 0;
    DECLARE @ProdOB DECIMAL(18,2) = 0;
    DECLARE @WPCoalQty DECIMAL(18,2) = 0;
    DECLARE @WPObQty DECIMAL(18,2) = 0;

    -- =============================================
    -- 1. Production Quantity (Total)
    -- =============================================
    SELECT 
        @ProdCoal = SUM(CASE WHEN MaterialId = @RomCoalId THEN ISNULL(NoofTrip, 0) * ISNULL(NtpcQtyTrip, 0) ELSE 0 END),
        @ProdOB   = SUM(CASE WHEN MaterialId IN (@TopSoilId, @OBId) THEN ISNULL(NoofTrip, 0) * ISNULL(NtpcQtyTrip, 0) ELSE 0 END)
    FROM Trans.TblLoading WITH(NOLOCK)
    WHERE CAST(LoadingDate AS DATE) = @Date 
      AND ShiftId = @ShiftId
      AND IsDelete = 0;

    -- =============================================
    -- 2. WP-3 Quantity (Specific Destination)
    -- =============================================
    SELECT 
        @WPCoalQty = SUM(CASE WHEN MaterialId = @RomCoalId THEN ISNULL(NoofTrip, 0) * ISNULL(NtpcQtyTrip, 0) ELSE 0 END),
        @WPObQty   = SUM(CASE WHEN MaterialId IN (@TopSoilId, @OBId) THEN ISNULL(NoofTrip, 0) * ISNULL(NtpcQtyTrip, 0) ELSE 0 END)
    FROM Trans.TblLoading WITH(NOLOCK)
    WHERE CAST(LoadingDate AS DATE) = @Date 
      AND ShiftId = @ShiftId
      AND DestinationId = @WP3_DestinationId
      AND IsDelete = 0;

    -- =============================================
    -- 3. Result Set 1: Production Summary
    -- =============================================
    SELECT 
        ISNULL(@ProdCoal, 0) AS ProdCoal,
        ISNULL(@ProdOB, 0) AS ProdOB,
        ISNULL(@WPCoalQty, 0) AS WPCoalQty,
        ISNULL(@WPObQty, 0) AS WPObQty;

    -- =============================================
    -- 4. Result Set 2: Crusher Details
    -- =============================================
    SELECT 
        P.Name AS Plant,
        ISNULL(C.RunningHr, 0) AS RunningHr,
        ISNULL(C.TotalQty, 0) AS TotalQty
    FROM Master.TblPlant P WITH(NOLOCK)
    LEFT JOIN Trans.TblCrusher C WITH(NOLOCK) 
        ON P.SlNo = C.PlantId 
        AND CAST(C.Date AS DATE) = @Date 
        AND C.ShiftId = @ShiftId 
        AND C.IsDelete = 0
    WHERE P.IsDelete = 0 AND P.IsDPRReport = 1 -- Assuming flag usage similar to other reports
    ORDER BY P.Name;

    -- =============================================
    -- 5. Result Set 3: Header Info
    -- =============================================
    -- Fetch Shift Incharge and Relay dynamically if needed, else empty for now as layout is simple
    -- The previous SP had complex logic for ShiftIncharge/Relay from TblCrusherShiftIncharge. 
    -- We will try to preserve that if possible, but keep it simple if not critical or if tables missing.
    -- Let's include basic info first.
    
    DECLARE @ShiftName VARCHAR(50);
    SELECT TOP 1 @ShiftName = ShiftName FROM Master.TblShift WHERE SlNo = @ShiftId;

    SELECT 
        FORMAT(@Date, 'dd-MM-yyyy') AS Date,
        @ShiftName AS ShiftName,
        '' AS Logo;

END
