CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportEquipmentPerformance]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);

    -- Pre-aggregate Reading (Hours) by Date/Shift/Eq
    WITH CTE_Daily_Eq AS (
        SELECT 
            R.EquipmentId,
            R.ShiftId,
            Cast(R.[Date] as Date) as WorkDate,
            SUM(R.TotalWorkingHr) as WorkingHr,
            Eq.EquipmentGroupId,
            Eq.ActivityId,
            Eq.EquipmentName -- Added EquipmentName for grouping
        FROM [Trans].[TblEquipmentReading] R
        JOIN [Master].[TblEquipment] Eq ON R.EquipmentId = Eq.SlNo
        WHERE R.IsDelete = 0 
          AND Cast(R.[Date] as Date) BETWEEN @MonthStart AND @Date
          AND Eq.ActivityId IN (3, 4, 5) -- Loading, Rehandling, Surface Miner
        GROUP BY R.EquipmentId, R.ShiftId, Cast(R.[Date] as Date), Eq.EquipmentGroupId, Eq.ActivityId, Eq.EquipmentName
    ),
    
    CTE_Daily_Loading AS (
        SELECT 
            L.LoadingMachineEquipmentId,
            L.ShiftId,
            Cast(L.LoadingDate as Date) as LDate,
            SUM(L.NoofTrip) as Trips,
            SUM(L.TotalQty) as Qty
        FROM [Trans].[TblLoading] L
        WHERE L.IsDelete = 0 
          AND Cast(L.LoadingDate as Date) BETWEEN @MonthStart AND @Date
        GROUP BY L.LoadingMachineEquipmentId, L.ShiftId, Cast(L.LoadingDate as Date)
    ),

    CTE_Combined AS (
        SELECT 
            D.WorkDate,
            D.ActivityId,
            D.EquipmentGroupId,
            D.EquipmentId,
            D.EquipmentName,
            D.WorkingHr,
            ISNULL(L.Trips, 0) as Trips,
            ISNULL(L.Qty, 0) as Qty
        FROM CTE_Daily_Eq D
        LEFT JOIN CTE_Daily_Loading L ON D.EquipmentId = L.LoadingMachineEquipmentId 
                                      AND D.ShiftId = L.ShiftId 
                                      AND D.WorkDate = L.LDate
    )

    SELECT 
        ac.Name as ActivityName,
        eg.Name as EquipmentGroupName,
        C.EquipmentName,

        -- FTD (For The Date)
        SUM(CASE WHEN C.WorkDate = @Date THEN C.WorkingHr ELSE 0 END) as FTD_WorkingHr,
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Trips ELSE 0 END) as FTD_Trips,
        SUM(CASE WHEN C.WorkDate = @Date THEN C.Qty ELSE 0 END) as FTD_Qty,

        -- FTM (For The Month)
        SUM(C.WorkingHr) as FTM_WorkingHr,
        SUM(C.Trips) as FTM_Trips,
        SUM(C.Qty) as FTM_Qty

    FROM CTE_Combined C
    LEFT JOIN [Master].[TblActivity] ac ON C.ActivityId = ac.SlNo
    LEFT JOIN [Master].[TblEquipmentGroup] eg ON C.EquipmentGroupId = eg.SlNo

    GROUP BY ac.Name, eg.Name, C.EquipmentName, ac.SlNo
    
    ORDER BY ac.Name, eg.Name, C.EquipmentName;
END
