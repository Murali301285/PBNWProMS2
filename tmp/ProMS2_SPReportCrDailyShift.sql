CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportCrDailyShift]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Plant-Shift Production Metrics
    -- Return Master Template for all Active Plants (IsDPRReport=1) and Shifts
    SELECT
        P.SlNo as PlantId,
        P.Name as PlantName,
        S.SlNo as ShiftId,
        S.ShiftName,
        OL.OperatorName as LargeScaleIncharge,
        OM.OperatorName as MidScaleIncharge,
        ISNULL(MIN(C.OHMR), 0) as ApronStartingHour,
        ISNULL(MAX(C.CHMR), 0) as ApronClosingHour,
        ISNULL(SUM(C.RunningHr), 0) as RunningHr,
        ISNULL(MAX(C.BeltScaleOHMR), 0) as SBS_Reading,
        ISNULL(MAX(C.BeltScaleCHMR), 0) as CBS_Reading,
        ISNULL(SUM(C.ProductionQty), 0) as TotalProductionMT,
        ISNULL(SUM(C.NoofTrip), 0) as NoofTripUnloaded,
        ISNULL(SUM(C.PowerKWH), 0) as TotalUnit,
        CASE WHEN ISNULL(SUM(C.RunningHr), 0) > 0 THEN SUM(C.ProductionQty) / SUM(C.RunningHr) ELSE 0 END as TPH
    FROM [Master].[TblPlant] P
    CROSS JOIN [Master].[TblShift] S
    LEFT JOIN [Trans].[TblCrusher] C ON P.SlNo = C.PlantId AND S.SlNo = C.ShiftId 
        AND CAST(C.Date AS DATE) = @Date 
        AND C.IsDelete = 0
    LEFT JOIN [Master].[TblOperator] OL ON C.ShiftInChargeId = OL.SlNo
    LEFT JOIN [Master].[TblOperator] OM ON C.MidScaleInchargeId = OM.SlNo
    WHERE P.IsDPRReport = 1 AND P.IsActive = 1
    -- Filter relevant shifts if needed? Assuming all shifts in TblShift are relevant.
    GROUP BY P.SlNo, P.Name, S.SlNo, S.ShiftName, OL.OperatorName, OM.OperatorName
    ORDER BY S.ShiftName, P.Name;

    -- 2. Stoppage Details (Only if exists)
    SELECT 
        P.Name as PlantName,
        S.ShiftName,
        BD.BDReasonName as StoppageReason,
        SUM(ISNULL(CS.StoppageHours, 0)) as Hrs
    FROM [Trans].[TblCrusherStoppage] CS
    JOIN [Trans].[TblCrusher] C ON CS.CrusherId = C.SlNo
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblShift] S ON C.ShiftId = S.SlNo
    LEFT JOIN [Master].[TblBDReason] BD ON CS.StoppageId = BD.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date
      AND P.IsDPRReport = 1
    GROUP BY P.Name, S.ShiftName, BD.BDReasonName
    ORDER BY S.ShiftName, P.Name, BD.BDReasonName;

    -- 3. Detailed Remarks (Main + Stoppage)
    SELECT 
        P.SlNo as PlantId,
        P.Name as PlantName,
        S.ShiftName,
        'Main' as Source,
        NULL as FromTime,
        NULL as ToTime,
        NULL as DurationHours,
        C.Remarks
    FROM [Trans].[TblCrusher] C
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblShift] S ON C.ShiftId = S.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date 
      AND LEN(ISNULL(C.Remarks, '')) > 0
    
    UNION ALL
    
    SELECT 
        P.SlNo as PlantId,
        P.Name as PlantName,
        S.ShiftName,
        'Stop' as Source,
        CS.FromTime,
        CS.ToTime,
        CS.StoppageHours as DurationHours,
        CS.Remarks
    FROM [Trans].[TblCrusherStoppage] CS
    JOIN [Trans].[TblCrusher] C ON CS.CrusherId = C.SlNo
    JOIN [Master].[TblPlant] P ON C.PlantId = P.SlNo
    LEFT JOIN [Master].[TblShift] S ON C.ShiftId = S.SlNo
    WHERE C.IsDelete = 0 
      AND CAST(C.Date AS DATE) = @Date 
      AND (LEN(ISNULL(CS.Remarks, '')) > 0 OR CS.StoppageHours > 0)

    ORDER BY ShiftName, PlantName, Source;

END
GO
