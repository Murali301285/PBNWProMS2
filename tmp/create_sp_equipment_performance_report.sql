
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_EquipmentPerformanceReport]
    @Date DATE,
    @ActivityIds NVARCHAR(MAX) = NULL,
    @EquipmentIds NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @ObMatrialId INT = 1; 
    DECLARE @CoalMatrialId INT = 8;

    -- Filters
    DECLARE @ActivityTbl TABLE (Id INT);
    IF @ActivityIds IS NOT NULL AND @ActivityIds <> ''
        INSERT INTO @ActivityTbl SELECT value FROM STRING_SPLIT(@ActivityIds, ',');

    DECLARE @EquipmentTbl TABLE (Id INT);
    IF @EquipmentIds IS NOT NULL AND @EquipmentIds <> ''
        INSERT INTO @EquipmentTbl SELECT value FROM STRING_SPLIT(@EquipmentIds, ',');

    -- Helper to calculate Trips/Hr and Qty/Hr safely
    -- Logic: Total Trips or Qty / Total Working Hours
    
    WITH CTE_ShiftData AS (
        SELECT 
            T0.EquipmentId,
            T0.ShiftId,
            T1.ShiftName,
            Cast(T0.[Date] as Date) as WorkDate,
            SUM(T0.TotalWorkingHr) as WorkingHr,
            SUM(ISNULL(T0.NetHMR, 0)) as NetHmr, -- Using NetHMR for total hours if needed, but TotalWorkingHr is standard
            -- Calculate Trips & Qty from TblLoading or TblMaterialRehandling?
            -- Equipment Performance usually focuses on Loading/Rehandling machines.
            -- If Activity is Hauling, then Trips comes from TblLoading (HaulerEquipmentId)?
            -- User asking for "Activity" filter implies ANY activity.
            -- Valid Activities for trips: Loading (3), Rehandling, Surface Miner (5).
            -- Haulers (4) -> Trips from Loading where HaulerID = EqID.
            
            -- We need a robust way to get Trips/Qty per Equipment type.
            -- Let's stick to the pattern used in previous SP:
            -- Join TblLoading for Loading Machines. 
            -- But what about Haulers? The previous SP filtered ActivityId IN (3, 4, 5).
            -- If Hauler (4), trips are in TblLoading.HaulerEquipmentId.
            
            -- Let's pre-aggregate Trips/Qty for the specific Date and Month.
            
            Eq.ActivityId
        FROM [Trans].[TblEquipmentReading] T0
        JOIN [Master].[TblEquipment] Eq ON T0.EquipmentId = Eq.SlNo
        JOIN [Master].[TblShift] T1 ON T0.ShiftId = T1.SlNo
        WHERE T0.IsDelete = 0 
          AND Cast(T0.[Date] as Date) BETWEEN @MonthStart AND @Date
          AND (@ActivityIds IS NULL OR @ActivityIds = '' OR Eq.ActivityId IN (SELECT Id FROM @ActivityTbl))
          AND (@EquipmentIds IS NULL OR @EquipmentIds = '' OR T0.EquipmentId IN (SELECT Id FROM @EquipmentTbl))
        GROUP BY T0.EquipmentId, T0.ShiftId, T1.ShiftName, Cast(T0.[Date] as Date), Eq.ActivityId
    ),

    CTE_Trips_Qty AS (
        -- Loading Machines (Activity 3, 5) & Rehandling
        SELECT 
            LoadingMachineEquipmentId as EquipmentId,
            ShiftId,
            Cast(LoadingDate as Date) as WorkDate,
            SUM(NoofTrip) as Trips,
            SUM(TotalQty) as Qty
        FROM [Trans].[TblLoading]
        WHERE IsDelete = 0 AND Cast(LoadingDate as Date) BETWEEN @MonthStart AND @Date
        GROUP BY LoadingMachineEquipmentId, ShiftId, Cast(LoadingDate as Date)
        
        UNION ALL
        
        -- Haulers (Activity 4)
        SELECT 
            HaulerEquipmentId as EquipmentId,
            ShiftId,
            Cast(LoadingDate as Date) as WorkDate,
            SUM(NoofTrip) as Trips,
            SUM(TotalQty) as Qty
        FROM [Trans].[TblLoading]
        WHERE IsDelete = 0 AND Cast(LoadingDate as Date) BETWEEN @MonthStart AND @Date
        GROUP BY HaulerEquipmentId, ShiftId, Cast(LoadingDate as Date)
    ),
    
    CTE_Merged AS (
        SELECT 
            S.EquipmentId,
            S.ShiftName,
            S.WorkDate,
            S.WorkingHr,
            ISNULL(TQ.Trips, 0) as Trips,
            ISNULL(TQ.Qty, 0) as Qty,
            S.ActivityId -- Passed down for grouping if needed
        FROM CTE_ShiftData S
        LEFT JOIN CTE_Trips_Qty TQ ON S.EquipmentId = TQ.EquipmentId 
                                   AND S.ShiftId = TQ.ShiftId 
                                   AND S.WorkDate = TQ.WorkDate
    )

    SELECT 
        ROW_NUMBER() OVER(ORDER BY Eq.EquipmentName) as SlNo,
        format(Eq.SlNo, '0000000') as [PMS Code], -- Using SlNo for PMS Code generation
        Eq.CostCenter,
        Eq.EquipmentName as Equipment,
        AC.Name as Activity,

        -- Shift A
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.Trips ELSE 0 END) as [Shift ATotal Trips],
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.Qty ELSE 0 END) as [Shift ATotal Qty],
        SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift A' THEN M.WorkingHr ELSE 0 END) as [Shift ATotal Hrs],
        0 as [Shift ATotal Kms], -- Placeholder
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
        0 as [Shift BTotal Kms], -- Placeholder
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
        0 as [Shift CTotal Kms], -- Placeholder
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.Trips ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.WorkingHr ELSE 0 END) 
        END as [Shift CTrips Per Hr],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.Qty ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date AND M.ShiftName = 'Shift C' THEN M.WorkingHr ELSE 0 END) 
        END as [Shift CQty Per Hr],

        -- FTD (For The Day - Sum of all shifts for @Date)
        SUM(CASE WHEN M.WorkDate = @Date THEN M.Trips ELSE 0 END) as [FTDTotal Trips],
        SUM(CASE WHEN M.WorkDate = @Date THEN M.Qty ELSE 0 END) as [FTDTotal Qty],
        SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) as [FTDTotal Hrs],
        0 as [FTDTotal Kms],
        0 as [FTDTotal Fuel],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date THEN M.Trips ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) 
        END as [FTDTrips Per Hr],
        CASE WHEN SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) = 0 THEN 0 
             ELSE SUM(CASE WHEN M.WorkDate = @Date THEN M.Qty ELSE 0 END) / SUM(CASE WHEN M.WorkDate = @Date THEN M.WorkingHr ELSE 0 END) 
        END as [FTDQty Per Hr],
        0 as [FTDFuel Per Hr],
        0 as [FTDKMPL],

        -- MTD (Month To Date)
        SUM(M.Trips) as [MTDTotal Trips],
        SUM(M.Qty) as [MTDTotal Qty],
        SUM(M.WorkingHr) as [MTDTotal Hrs],
        0 as [MTDTotal Kms],
        0 as [MTDTotal Fuel],
        CASE WHEN SUM(M.WorkingHr) = 0 THEN 0 ELSE SUM(M.Trips) / SUM(M.WorkingHr) END as [MTDTrips Per Hr],
        CASE WHEN SUM(M.WorkingHr) = 0 THEN 0 ELSE SUM(M.Qty) / SUM(M.WorkingHr) END as [MTDQty Per Hr],
        0 as [MTDFuel Per Hr],
        0 as [MTDKMPL]

    FROM CTE_Merged M
    JOIN [Master].[TblEquipment] Eq ON M.EquipmentId = Eq.SlNo
    LEFT JOIN [Master].[TblActivity] AC ON Eq.ActivityId = AC.SlNo

    GROUP BY Eq.SlNo, Eq.EquipmentName, Eq.CostCenter, Eq.EquipmentGroupId, AC.Name
    ORDER BY AC.Name, Eq.EquipmentName;

END
