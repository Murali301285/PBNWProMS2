CREATE   PROCEDURE [dbo].[PMS2_New_Sp_DailyProductionReport]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @StartOfYear DATE;
    IF MONTH(@Date) >= 4
        SET @StartOfYear = DATEFROMPARTS(YEAR(@Date), 4, 1);
    ELSE
        SET @StartOfYear = DATEFROMPARTS(YEAR(@Date) - 1, 4, 1);
    DECLARE @RefDate DATE = @Date;

    -------------------------------------------------------------------
    -- 0: Shift Production (COAL)
    -------------------------------------------------------------------
    SELECT
        CAST([LoadingDate] AS DATE) AS Date,
        MAX(S.ShiftName) AS ShiftName,
        MAX(Mt.MaterialName) AS MaterialName,
        Sl.Name AS Scale,
        SUM([NoofTrip]) AS Trip,
        SUM([QtyTrip]) AS mngTripQty,
        SUM([TotalQty]) AS mngQty,
        SUM([NtpcQtyTrip]) AS ntpcTrip,
        SUM([TotalNtpcQty]) AS ntpcTotalQty
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblShift] S WITH(NOLOCK) ON L.ShiftId = S.SlNo
    LEFT JOIN [Master].[TblMaterial] Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
    LEFT JOIN [Master].[TblScale] Sl WITH(NOLOCK) ON Eq.ScaleId = Sl.SlNo
    WHERE L.IsDelete = 0 
      AND L.MaterialId = 7 -- ROM COAL
      AND CAST([LoadingDate] AS DATE) = @RefDate
    GROUP BY CAST([LoadingDate] AS DATE), Sl.Name, S.ShiftName;

    -------------------------------------------------------------------
    -- 1: Shift Production (WASTE)
    -------------------------------------------------------------------
    SELECT
        CAST([LoadingDate] AS DATE) AS Date,
        MAX(S.ShiftName) AS ShiftName,
        'WASTE' AS MaterialName,
        Sl.Name AS Scale,
        SUM([NoofTrip]) AS Trip,
        SUM([QtyTrip]) AS mngTripQty,
        SUM([TotalQty]) AS mngQty,
        SUM([NtpcQtyTrip]) AS ntpcTrip,
        SUM([TotalNtpcQty]) AS ntpcTotalQty
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblShift] S WITH(NOLOCK) ON L.ShiftId = S.SlNo
    LEFT JOIN [Master].[TblMaterial] Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
    LEFT JOIN [Master].[TblScale] Sl WITH(NOLOCK) ON Eq.ScaleId = Sl.SlNo
    WHERE L.IsDelete = 0 
      AND Mt.MaterialName IN ('OB', 'OVER BURDEN')
      AND CAST([LoadingDate] AS DATE) = @RefDate
    GROUP BY CAST([LoadingDate] AS DATE), Sl.Name, S.ShiftName;

    -------------------------------------------------------------------
    -- 2: TRIP-QUANTITY DETAILS (FTD / MTD / YTD) - COAL
    -------------------------------------------------------------------
    SELECT 
        Sl.Name AS Scale,
        SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_FTD,
        SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_FTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_MTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_MTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_YTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_YTD
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblScale] Sl WITH(NOLOCK) ON Eq.ScaleId = Sl.SlNo
    WHERE L.IsDelete = 0 
      AND L.MaterialId = 7 -- ROM COAL only
      AND L.LoadingDate >= @StartOfYear 
      AND CAST(L.LoadingDate AS DATE) <= @RefDate
    GROUP BY Sl.Name
    HAVING SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) > 0 
        OR SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) > 0
    ORDER BY Sl.Name;

    -------------------------------------------------------------------
    -- 3: TRIP-QUANTITY DETAILS (FTD / MTD / YTD) - WASTE
    -------------------------------------------------------------------
    SELECT 
        Sl.Name AS Scale,
        SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_FTD,
        SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_FTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_MTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_MTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_YTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_YTD
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblMaterial] Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
    LEFT JOIN [Master].[TblScale] Sl WITH(NOLOCK) ON Eq.ScaleId = Sl.SlNo
    WHERE L.IsDelete = 0 
      AND Mt.MaterialName IN ('OB', 'OVER BURDEN')
      AND L.LoadingDate >= @StartOfYear
      AND CAST(L.LoadingDate AS DATE) <= @RefDate
    GROUP BY Sl.Name
    HAVING SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) > 0 
        OR SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) > 0
    ORDER BY Sl.Name;

    -------------------------------------------------------------------
    -- 4: CRUSHED COAL SECTION (FTD/MTD/YTD)
    -------------------------------------------------------------------
    SELECT
        So.Name AS sourceName,
        SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_FTD,
        SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_FTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_MTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_MTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.NoofTrip ELSE 0 END) AS Trip_YTD,
        SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END) AS Qty_YTD
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblMaterial] Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
    LEFT JOIN [Master].[TblSource] So WITH(NOLOCK) ON L.SourceId = So.SlNo
    WHERE L.IsDelete = 0 
      AND Mt.MaterialName = 'CRUSHED COAL'
      AND L.LoadingDate >= @StartOfYear
      AND CAST(L.LoadingDate AS DATE) <= @RefDate
    GROUP BY So.Name;

    -------------------------------------------------------------------
    -- 5: COAL CRUSHING DETAILS
    -------------------------------------------------------------------
    SELECT 
        CAST(C.[Date] AS DATE) AS Date,
        P.Name AS PlantName,
        MAX(S.ShiftName) AS ShiftName,
        ISNULL(SUM([ProductionQty]),0) AS EstQty,
        ISNULL(SUM([RunningHr]),0) AS Hr
    FROM [Trans].[TblCrusher] C WITH(NOLOCK)
    LEFT JOIN [Master].[TblShift] S WITH(NOLOCK) ON C.ShiftId = S.SlNo
    LEFT JOIN [Master].[TblPlant] P WITH(NOLOCK) ON C.PlantId = P.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.[Date] AS DATE) = @RefDate
    GROUP BY S.ShiftName, P.Name, CAST(C.[Date] AS DATE);

    -------------------------------------------------------------------
    -- 6: CRUSHER COAL QTY (Summary FTD/MTD/YTD)
    -------------------------------------------------------------------
    SELECT 
        ISNULL(SUM(CASE WHEN CAST(C.[Date] AS DATE) = @RefDate THEN C.TotalQty ELSE 0 END),0) AS Qty_FTD,
        ISNULL(SUM(CASE WHEN C.[Date] >= @StartOfMonth AND CAST(C.[Date] AS DATE) <= @RefDate THEN C.TotalQty ELSE 0 END),0) AS Qty_MTD,
        ISNULL(SUM(CASE WHEN C.[Date] >= @StartOfYear AND CAST(C.[Date] AS DATE) <= @RefDate THEN C.TotalQty ELSE 0 END),0) AS Qty_YTD
    FROM [Trans].[TblCrusher] C WITH(NOLOCK)
    WHERE C.IsDelete = 0 
      AND C.[Date] >= @StartOfYear;

    -------------------------------------------------------------------
    -- 7: BLASTING DETAILS
    -------------------------------------------------------------------
    SELECT 
        CAST(C.[Date] AS DATE) AS date,
        SUM(D.TotalMeters) AS TotalMetersDrilled,
        SUM([NoofHolesDeckCharged]) AS Noofholesblasted,
        SUM([TotalExplosiveUsed]) AS ExplosiveCosumed
    FROM [Trans].[TblBlasting] C WITH(NOLOCK)
    LEFT JOIN [Trans].[TblDrilling] D WITH(NOLOCK) ON C.BlastingPatchId = D.DrillingPatchId
    WHERE C.IsDelete = 0 
      AND CAST(C.[Date] AS DATE) = @RefDate
    GROUP BY CAST(C.[Date] AS DATE);

    -------------------------------------------------------------------
    -- 8: Itiz Dump-Rehandling (Removed, returning empty 0 to match old index)
    -------------------------------------------------------------------
    SELECT 'Section Removed' AS Removed WHERE 1=0;

    -------------------------------------------------------------------
    -- 9: WP-1 EXCAVATION DETAIL (Removed, returning empty)
    -------------------------------------------------------------------
    SELECT 'Section Removed' AS Removed WHERE 1=0;

    -------------------------------------------------------------------
    -- 10: SMASL Quantity (FTD) (Placeholder)
    -------------------------------------------------------------------
    SELECT 'SMASL' AS Section, 0 AS Qty WHERE 1=0;

    -------------------------------------------------------------------
    -- 11: INPIT DUMPING (Destination = INPIT DUMP)
    -------------------------------------------------------------------
    SELECT 
        CASE 
            WHEN Mt.MaterialName = 'ROM COAL' OR Mt.MaterialName = 'CRUSHED COAL' THEN 'COAL'
            ELSE 'OVER BURDEN'
        END AS Type,
        ISNULL(SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.TotalQty ELSE 0 END),0) AS Qty_FTD,
        ISNULL(SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END),0) AS Qty_MTD,
        ISNULL(SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END),0) AS Qty_YTD
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblMaterial] Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
    LEFT JOIN [Master].[TblDestination] Dst WITH(NOLOCK) ON L.DestinationId = Dst.SlNo
    WHERE L.IsDelete = 0 
      AND L.LoadingDate >= @StartOfYear 
      AND CAST(L.LoadingDate AS DATE) <= @RefDate
      AND Dst.Name LIKE '%INPIT DUMP%'
    GROUP BY CASE 
            WHEN Mt.MaterialName = 'ROM COAL' OR Mt.MaterialName = 'CRUSHED COAL' THEN 'COAL'
            ELSE 'OVER BURDEN'
        END;

    -------------------------------------------------------------------
    -- 12: WP-3 EXCAVATION DETAIL (SectorId = 5)
    -------------------------------------------------------------------
    SELECT 
        CASE 
            WHEN Mt.MaterialName = 'ROM COAL' OR Mt.MaterialName = 'CRUSHED COAL' THEN 'COAL'
            ELSE 'OVER BURDEN'
        END AS Type,
        ISNULL(SUM(CASE WHEN CAST(L.LoadingDate AS DATE) = @RefDate THEN L.TotalQty ELSE 0 END),0) AS Qty_FTD,
        ISNULL(SUM(CASE WHEN L.LoadingDate >= @StartOfMonth AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END),0) AS Qty_MTD,
        ISNULL(SUM(CASE WHEN L.LoadingDate >= @StartOfYear AND CAST(L.LoadingDate AS DATE) <= @RefDate THEN L.TotalQty ELSE 0 END),0) AS Qty_YTD
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblMaterial] Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
    WHERE L.IsDelete = 0 
      AND L.LoadingDate >= @StartOfYear 
      AND CAST(L.LoadingDate AS DATE) <= @RefDate
      AND L.DestinationId = 5
    GROUP BY CASE 
            WHEN Mt.MaterialName = 'ROM COAL' OR Mt.MaterialName = 'CRUSHED COAL' THEN 'COAL'
            ELSE 'OVER BURDEN'
        END;

    -------------------------------------------------------------------
    -- 13: DUMPER-LOADER TRIP DETAILS
    -------------------------------------------------------------------
    SELECT
        CAST([LoadingDate] AS DATE) AS Date,
        s.ShiftName,
        100 AS FACTOR, -- Hardcoded as per user request
        Eq.EquipmentName AS Dumper,
        Leq.EquipmentName AS Loader,
        SUM([NoofTrip]) AS Trip
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    LEFT JOIN [Master].[TblEquipment] AS Eq WITH(NOLOCK) ON L.HaulerEquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblEquipment] AS Leq WITH(NOLOCK) ON L.LoadingMachineEquipmentId = Leq.SlNo
    LEFT JOIN [Master].TblShift AS s WITH(NOLOCK) ON L.ShiftId = s.SlNo
    WHERE L.IsDelete = 0
      AND CAST([LoadingDate] AS DATE) = @RefDate
      AND Eq.EquipmentGroupId = 24 -- Dumper Group ID
    GROUP BY CAST([LoadingDate] AS DATE), s.ShiftName, Eq.EquipmentName, Leq.EquipmentName
    ORDER BY Eq.EquipmentName ASC;

    -------------------------------------------------------------------
    -- 14: Remarks
    -------------------------------------------------------------------
    SELECT Remarks 
    FROM [Trans].[TblLoading] L WITH(NOLOCK)
    WHERE L.IsDelete = 0 
      AND CAST(L.[LoadingDate] AS DATE) = @RefDate
      AND L.Remarks IS NOT NULL AND L.Remarks <> '';

END
