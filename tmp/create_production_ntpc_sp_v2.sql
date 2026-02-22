
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_ProductionNTPCReport]
    @Date DATE = NULL,
    @ShiftId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- =============================================
    -- Variable Declarations
    -- =============================================
    DECLARE @OBId INT = 2;
    DECLARE @TopSoilId INT = 1;
    DECLARE @RomCoalId INT = 7;
    DECLARE @ObRehandlingId INT = 5;
    DECLARE @DestinationDumpB INT = 2;

    DECLARE @ProdCoal DECIMAL(18, 2) = 0;
    DECLARE @ProdOB DECIMAL(18, 2) = 0;
    DECLARE @WPCoalQty DECIMAL(18, 2) = 0;
    DECLARE @WPObQty DECIMAL(18, 2) = 0;

    -- =============================================
    -- 1. Production Quantity
    -- =============================================
    SELECT @ProdCoal = CONVERT(DECIMAL(18, 2), ISNULL(SUM(A.RomCoal), 0.00))
    FROM (
        SELECT 
            T1.EquipmentGroupId,
            T2.Name AS EquipmentGroup,
            T0.MaterialId,
            SUM(T0.NoofTrip * T0.NtpcQtyTrip) AS RomCoal
        FROM Trans.TblLoading T0 WITH(NOLOCK)
        JOIN Master.TblEquipment T1 WITH(NOLOCK) ON T1.SlNo = T0.HaulerEquipmentId
        JOIN Master.TblEquipmentGroup T2 WITH(NOLOCK) ON T2.SlNo = T1.EquipmentGroupId
        WHERE T0.IsDelete = 0 
          AND T0.MaterialId IN (@RomCoalId) 
          AND CONVERT(DATE, T0.LoadingDate) = @Date 
          AND T0.ShiftId = @ShiftId
        GROUP BY T1.EquipmentGroupId, T2.Name, T0.MaterialId
    ) A;

    -- CTE for Waste Handling
    WITH WasteHandlingTable AS (
        SELECT 
            T1.EquipmentGroupId,
            T2.Name AS EquipmentGroup,
            T3.Name AS Scale,
            T0.MaterialId,
            SUM(T0.NoofTrip) AS NoofTrip,
            T0.NtpcQtyTrip
        FROM Trans.TblLoading T0 WITH(NOLOCK)
        JOIN Master.TblEquipment T1 WITH(NOLOCK) ON T1.SlNo = T0.HaulerEquipmentId
        JOIN Master.TblEquipmentGroup T2 WITH(NOLOCK) ON T2.SlNo = T1.EquipmentGroupId
        JOIN Master.TblScale T3 WITH(NOLOCK) ON T3.SlNo = T1.ScaleId
        WHERE T0.IsDelete = 0 
          AND T0.MaterialId IN (@TopSoilId, @OBId) 
          AND CONVERT(DATE, T0.LoadingDate) = @Date 
          AND T0.ShiftId = @ShiftId
        GROUP BY T1.EquipmentGroupId, T2.Name, T3.Name, T0.MaterialId, T0.NtpcQtyTrip
    )
    SELECT @ProdOB = CONVERT(DECIMAL(18, 2), ISNULL(SUM(A.QtyBcm), 0.00))
    FROM (
        SELECT 
            T0.EquipmentGroupId,
            T0.EquipmentGroup,
            T0.Scale,
            (ISNULL(T1.OverBurden, 0) + ISNULL(T2.TopSoil, 0)) AS QtyBcm
        FROM WasteHandlingTable T0
        OUTER APPLY (SELECT SUM(NoofTrip * NtpcQtyTrip) AS OverBurden FROM WasteHandlingTable WHERE MaterialId = @OBId AND EquipmentGroupId = T0.EquipmentGroupId) T1
        OUTER APPLY (SELECT SUM(NoofTrip * NtpcQtyTrip) AS TopSoil FROM WasteHandlingTable WHERE MaterialId = @TopSoilId AND EquipmentGroupId = T0.EquipmentGroupId) T2
        GROUP BY T0.EquipmentGroupId, T0.EquipmentGroup, T0.Scale, T1.OverBurden, T2.TopSoil
    ) A;

    -- =============================================
    -- 2. WP-3 Quantity
    -- =============================================
    WITH WP3Table AS (
        SELECT 
            T1.EquipmentGroupId,
            T2.Name AS EquipmentGroup,
            T3.Name AS Scale,
            T0.MaterialId,
            SUM(T0.NoofTrip) AS NoofTrip,
            T0.NtpcQtyTrip
        FROM Trans.TblLoading T0 WITH(NOLOCK)
        JOIN Master.TblEquipment T1 WITH(NOLOCK) ON T1.SlNo = T0.HaulerEquipmentId
        JOIN Master.TblEquipmentGroup T2 WITH(NOLOCK) ON T2.SlNo = T1.EquipmentGroupId
        JOIN Master.TblScale T3 WITH(NOLOCK) ON T3.SlNo = T1.ScaleId
        WHERE T0.IsDelete = 0 
          AND T0.MaterialId IN (@TopSoilId, @OBId, @RomCoalId) 
          AND T0.DestinationId = @DestinationDumpB 
          AND CONVERT(DATE, T0.LoadingDate) = @Date 
          AND T0.ShiftId = @ShiftId
        GROUP BY T1.EquipmentGroupId, T2.Name, T3.Name, T0.MaterialId, T0.NtpcQtyTrip
    )
    SELECT 
        @WPCoalQty = CONVERT(DECIMAL(18, 2), ISNULL(SUM(A.WPCoalQty), 0.00)),
        @WPObQty = CONVERT(DECIMAL(18, 2), ISNULL(SUM(A.WPObQty), 0.00))
    FROM (
        SELECT 
            T0.EquipmentGroupId,
            T0.EquipmentGroup,
            T0.Scale,
            (ISNULL(T1.OverBurden, 0) + ISNULL(T2.TopSoil, 0)) AS WPObQty,
            ISNULL(T3.Coal, 0) AS WPCoalQty
        FROM WP3Table T0
        OUTER APPLY (SELECT SUM(NoofTrip * NtpcQtyTrip) AS OverBurden FROM WP3Table WHERE MaterialId = @OBId AND EquipmentGroupId = T0.EquipmentGroupId) T1
        OUTER APPLY (SELECT SUM(NoofTrip * NtpcQtyTrip) AS TopSoil FROM WP3Table WHERE MaterialId = @TopSoilId AND EquipmentGroupId = T0.EquipmentGroupId) T2
        OUTER APPLY (SELECT SUM(NoofTrip * NtpcQtyTrip) AS Coal FROM WP3Table WHERE MaterialId = @RomCoalId AND EquipmentGroupId = T0.EquipmentGroupId) T3
        GROUP BY T0.EquipmentGroupId, T0.EquipmentGroup, T0.Scale, T1.OverBurden, T2.TopSoil, T3.Coal
    ) A;

    -- Return Result Set 1: Quantities
    SELECT 
        @ProdCoal AS ProdCoal,
        @ProdOB AS ProdOB,
        @WPCoalQty AS WPCoalQty,
        @WPObQty AS WPObQty;

    -- =============================================
    -- 3. Crusher Details
    -- =============================================
    SELECT 
        T1.Name AS Plant,
        SUM(T0.RunningHr) AS RunningHr,
        SUM(T0.ProductionQty) AS TotalQty 
    FROM Trans.TblCrusher T0 WITH(NOLOCK)
    JOIN Master.TblPlant T1 WITH(NOLOCK) ON T1.SlNo = T0.PlantId
    WHERE T0.IsDelete = 0 
      AND CONVERT(DATE, T0.Date) = @Date 
      AND T0.ShiftId = @ShiftId
    GROUP BY T1.Name;

    -- =============================================
    -- 4. Header & Filter Data
    -- =============================================
    WITH FilterDate AS (
        SELECT 
            T2.OperatorName AS ShiftIncharge,
            RE.Name AS Relay 
        FROM Trans.TblLoading T0 WITH(NOLOCK)
        JOIN Trans.TblLoadingShiftIncharge T1 WITH(NOLOCK) ON T1.LoadingId = T0.SlNo 
        JOIN Master.TblOperator T2 WITH(NOLOCK) ON T2.SlNo = T1.OperatorId 
        JOIN Master.TblRelay RE WITH(NOLOCK) ON RE.SlNo = T0.RelayId 
        WHERE T0.IsDelete = 0 
          AND T0.MaterialId IN (@OBId, @TopSoilId, @RomCoalId) 
          AND CONVERT(DATE, T0.LoadingDate) = @Date 
          AND T0.ShiftId = @ShiftId
        
        UNION
        
        SELECT 
            T2.OperatorName AS ShiftIncharge,
            RE.Name AS Relay 
        FROM Trans.TblLoading T0 WITH(NOLOCK) 
        JOIN Trans.TblLoadingShiftIncharge T1 WITH(NOLOCK) ON T1.LoadingId = T0.SlNo 
        JOIN Master.TblOperator T2 WITH(NOLOCK) ON T2.SlNo = T1.OperatorId 
        JOIN Master.TblRelay RE WITH(NOLOCK) ON RE.SlNo = T0.RelayId 
        WHERE T0.IsDelete = 0 
          AND T0.MaterialId IN (@OBId, @TopSoilId, @RomCoalId) 
          AND T0.DestinationId = @DestinationDumpB 
          AND CONVERT(DATE, T0.LoadingDate) = @Date 
          AND T0.ShiftId = @ShiftId
        
        UNION
        
        SELECT 
            T2.OperatorName AS ShiftIncharge,
            RE.Name AS Relay 
        FROM Trans.TblCrusher T0 WITH(NOLOCK)
        JOIN Trans.TblCrusherShiftIncharge T1 WITH(NOLOCK) ON T1.CrusherId = T0.SlNo 
        JOIN Master.TblOperator T2 WITH(NOLOCK) ON T2.SlNo = T1.OperatorId 
        JOIN Master.TblRelay RE WITH(NOLOCK) ON RE.SlNo = T0.RelayId 
        WHERE T0.IsDelete = 0 
          AND CONVERT(DATE, T0.Date) = @Date 
          AND T0.ShiftId = @ShiftId
    )
    SELECT 
        (SELECT STRING_AGG(ShiftIncharge, ', ') FROM (SELECT DISTINCT ShiftIncharge FROM FilterDate) AS SI) AS ShiftIncharge,
        (SELECT STRING_AGG(Relay, ', ') FROM (SELECT DISTINCT Relay FROM FilterDate) AS RE) AS Relay,
        (SELECT TOP 1 ShiftName FROM Master.TblShift WITH(NOLOCK) WHERE SlNo = @ShiftId) AS ShiftName,
        FORMAT(@Date, 'dd-MMM-yyyy') AS Date,
        '' AS Logo;

END
