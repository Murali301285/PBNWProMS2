
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_OperatorPerformanceLoadingReport]
    @Date DATE,
    @OperatorIds NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);

    -- Filter Table
    DECLARE @OperatorTbl TABLE (Id INT);
    IF @OperatorIds IS NOT NULL AND @OperatorIds <> ''
        INSERT INTO @OperatorTbl SELECT value FROM STRING_SPLIT(@OperatorIds, ',');

    -- CTE_Reading: Get Operator's working hours and identifying info per shift/equipment
    WITH CTE_Reading AS (
        SELECT 
            T0.OperatorId,
            T0.EquipmentId,
            T0.ShiftId,
            T1.ShiftName,
            Cast(T0.[Date] as Date) as WorkDate,
            SUM(T0.TotalWorkingHr) as WorkingHr
        FROM [Trans].[TblEquipmentReading] T0
        JOIN [Master].[TblShift] T1 ON T0.ShiftId = T1.SlNo
        WHERE T0.IsDelete = 0 
          AND T0.OperatorId IS NOT NULL 
          AND T0.OperatorId > 0
          AND Cast(T0.[Date] as Date) BETWEEN @MonthStart AND @Date
          AND (@OperatorIds IS NULL OR @OperatorIds = '' OR T0.OperatorId IN (SELECT Id FROM @OperatorTbl))
        GROUP BY T0.OperatorId, T0.EquipmentId, T0.ShiftId, T1.ShiftName, Cast(T0.[Date] as Date)
    ),

    -- CTE_Loading: Aggregated production data per Equipment/Shift/Date
    CTE_Loading AS (
        SELECT 
            LoadingMachineEquipmentId as EquipmentId,
            ShiftId,
            Cast(LoadingDate as Date) as WorkDate,
            SUM(NoofTrip) as Trips,
            SUM(TotalQty) as Qty
        FROM [Trans].[TblLoading]
        WHERE IsDelete = 0 
          AND Cast(LoadingDate as Date) BETWEEN @MonthStart AND @Date
        GROUP BY LoadingMachineEquipmentId, ShiftId, Cast(LoadingDate as Date)
    ),

    -- CTE_Merged: Join Operator Reading with Loading Data
    -- This assigns the production of the machine in that shift to the operator assigned to it
    CTE_Merged AS (
        SELECT 
            R.OperatorId,
            R.ShiftName,
            R.WorkDate,
            R.WorkingHr,
            ISNULL(L.Trips, 0) as Trips,
            ISNULL(L.Qty, 0) as Qty
        FROM CTE_Reading R
        LEFT JOIN CTE_Loading L ON R.EquipmentId = L.EquipmentId 
                                AND R.ShiftId = L.ShiftId 
                                AND R.WorkDate = L.WorkDate
    )

    -- Final Report Aggregation
    SELECT 
        ROW_NUMBER() OVER(ORDER BY Op.OperatorName) as SlNo,
        Op.OperatorName,
        Op.OperatorId as OperatorCode, -- Display ID if needed

        -- Shift A
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.Trips ELSE 0 END) as [Shift ATotal Trips],
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.Qty ELSE 0 END) as [Shift ATotal Qty],
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.WorkingHr ELSE 0 END) as [Shift ATotal Hrs],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.Trips ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.WorkingHr ELSE 0 END) 
        END as [Shift ATrips Per Hr],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.Qty ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.WorkingHr ELSE 0 END) 
        END as [Shift AQty Per Hr],
        
        -- Shift B
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift B' THEN M.Trips ELSE 0 END) as [Shift BTotal Trips],
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift B' THEN M.Qty ELSE 0 END) as [Shift BTotal Qty],
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift B' THEN M.WorkingHr ELSE 0 END) as [Shift BTotal Hrs],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift B' THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift B' THEN M.Trips ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift B' THEN M.WorkingHr ELSE 0 END) 
        END as [Shift BTrips Per Hr],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift B' THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift B' THEN M.Qty ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift B' THEN M.WorkingHr ELSE 0 END) 
        END as [Shift BQty Per Hr],

        -- Shift C
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.Trips ELSE 0 END) as [Shift CTotal Trips],
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.Qty ELSE 0 END) as [Shift CTotal Qty],
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.WorkingHr ELSE 0 END) as [Shift CTotal Hrs],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.Trips ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.WorkingHr ELSE 0 END) 
        END as [Shift CTrips Per Hr],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.Qty ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.WorkingHr ELSE 0 END) 
        END as [Shift CQty Per Hr],

        -- FTD (For The Day)
        SUM(CASE WHEN M.WorkDate = @Date THEN M.Trips ELSE 0 END) as [FTDTotal Trips],
        SUM(CASE WHEN M.WorkDate = @Date THEN M.Qty ELSE 0 END) as [FTDTotal Qty],
        SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) as [FTDTotal Hrs],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date THEN M.Trips ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) 
        END as [FTDTrips Per Hr],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date THEN M.Qty ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) 
        END as [FTDQty Per Hr],

        -- MTD (Month To Date)
        SUM(M.Trips) as [MTDTotal Trips],
        SUM(M.Qty) as [MTDTotal Qty],
        SUM(M.WorkingHr) as [MTDTotal Hrs],
        CASE WHEN SUM(M.WorkingHr) = 0 THEN 0 ELSE SUM(M.Trips) / SUM(M.WorkingHr) END as [MTDTrips Per Hr],
        CASE WHEN SUM(M.WorkingHr) = 0 THEN 0 ELSE SUM(M.Qty) / SUM(M.WorkingHr) END as [MTDQty Per Hr]

    FROM CTE_Merged M
    JOIN [Master].[TblOperator] Op ON M.OperatorId = Op.SlNo
    GROUP BY Op.SlNo, Op.OperatorName, Op.OperatorId
    ORDER BY Op.OperatorName;

END
