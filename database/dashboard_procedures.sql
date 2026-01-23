USE [ProMS2_Serv]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/* =============================================
   1. Analytical Dashboard SP
   Returns: KPIs, Detail Breakdown, Hauling Chart, Loading Chart
   ============================================= */
CREATE OR ALTER PROCEDURE [dbo].[ProMS2_Dash_SP_GetAnalyticalStats]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. KPIs
    -- Dummy Calculation illustrating structure
    SELECT 
        'coal_prod' as SectionId, 
        45000 as FTD, 1819692 as MTD, 58000 as Avg, 25000000 as YTD
    UNION ALL
    SELECT 'ob_rem', 110000, 3502100, 115000, 42000000
    UNION ALL
    SELECT 'crushing', 42000, 1750000, 56000, 24000000
    UNION ALL
    SELECT 'dispatch', 40000, 1600000, 53000, 23000000
    UNION ALL
    SELECT 'coal_re', 12000, 500000, 16000, 6000000
    UNION ALL
    SELECT 'ob_re', 8000, 320000, 10000, 4000000;

    -- 2. Detail Breakdown
    SELECT 'coal_prod' as SectionId, 'Large Scale (E)' as Category, 15000 as FTD, 600000 as MTD, 19000 as Avg, 8000000 as YTD, 0 as IsTotal
    UNION ALL
    SELECT 'coal_prod', 'Total', 45000, 1819692, 58000, 25000000, 1
    UNION ALL
    SELECT 'ob_rem', 'Pit A', 30000, 1000000, 31000, 12000000, 0
    UNION ALL
    SELECT 'ob_rem', 'Total', 30000, 1000000, 31000, 12000000, 1
    UNION ALL
    SELECT 'crushing', 'Plant 1', 20000, 500000, 21000, 6000000, 0
    UNION ALL
    SELECT 'crushing', 'Total', 20000, 500000, 21000, 6000000, 1
    UNION ALL
    SELECT 'dispatch', 'Road', 25000, 800000, 26000, 9000000, 0
    UNION ALL
    SELECT 'dispatch', 'Total', 25000, 800000, 26000, 9000000, 1;

    -- 3. Hauling Chart Data
    SELECT TOP 10 
        E.EquipmentName, 
        CAST(RAND() * 5 + 2 AS DECIMAL(10,2)) as Productivity, -- Trips/Hr
        CAST(RAND() * 12 AS DECIMAL(10,2)) as WorkingHours,
        'Hauling' as Type
    FROM [Master].[TblEquipment] E
    WHERE E.EquipmentGroupId = 2 -- Assuming 2 is Hauler (Adjust ID)
    ORDER BY NewId();

    -- 4. Loading Chart Data
    SELECT TOP 10 
        E.EquipmentName, 
        CAST(RAND() * 400 + 100 AS DECIMAL(10,2)) as Productivity, -- BCM/Hr
        CAST(RAND() * 14 AS DECIMAL(10,2)) as WorkingHours,
        'Loading' as Type
    FROM [Master].[TblEquipment] E
    WHERE E.EquipmentGroupId = 1 -- Assuming 1 is Loader
    ORDER BY NewId();
END
GO

/* =============================================
   2. Drilling & Blasting Dashboard SP
   Returns: KPIs, Recovery, Performance, Supplier, Explosive, Logs
   ============================================= */
CREATE OR ALTER PROCEDURE [dbo].[ProMS2_Dash_SP_GetDrillingBlastingStats]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Drilling KPIs (Shift, Day, Month Max)
    SELECT 'Shift' as Period, 145 as MaxMeters, 'Drill-RX' as EquipmentName, 'Shift A' as ShiftName
    UNION ALL
    SELECT 'Day', 410, 'Drill-Y', NULL
    UNION ALL
    SELECT 'Month', 5200, 'Drill-Z', NULL;

    -- 2. Recovery
    SELECT 'Coal' as Category, 2100 as TotalMeters
    UNION ALL
    SELECT 'OB', 4500;

    -- 3. Drill Performance List
    SELECT 'Drill-01' as EquipmentName, 45 as ShiftMeters, 120 as DayMeters, 150 as Target, 80 as Achievement, '' as Remarks
    UNION ALL
    SELECT 'Drill-02', 55, 135, 150, 90, '';

    -- 4. Blasting Supplier
    SELECT 'Solar' as SupplierName, 'Coal' as MaterialType, 5000 as TotalExplosive, 0.45 as PowderFactor
    UNION ALL
    SELECT 'IDL', 'OB', 7000, 0.60;

    -- 5. Explosive Summary
    SELECT 15000 as TotalSME, 5000 as TotalLDE, 3000 as TotalANFO, 23000 as GrandTotal;

    -- 6. Blasting Details Log
    SELECT 'Pit-1' as Location, 'P-101' as Pattern, 45 as Holes, 4500 as Explosive, 'SME' as Type, 'Solar' as Supplier;
END
GO

/* =============================================
   3. Crushing Dashboard SP
   Returns: Transactions, Stoppage Summary, Stoppage Log
   ============================================= */
CREATE OR ALTER PROCEDURE [dbo].[ProMS2_Dash_SP_GetCrushingStats]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Transactions
    SELECT 
        CAST(@FromDate AS DATE) as Date,
        'Crusher-01' as CrusherName, 
        'Shift A' as Shift, 
        400 as Qty, 
        'Normal' as Remarks
    UNION ALL
    SELECT CAST(@FromDate AS DATE), 'Crusher-02', 'Shift A', 350, 'Low Feed';

    -- 2. Stoppage Summary
    SELECT 'Conveyor Belt Tear' as Reason, 2 as Frequency, 4.5 as TotalDuration;

    -- 3. Stoppage Log
    SELECT 
        1 as SlNo, 
        CAST(@FromDate AS DATE) as Date, 
        'Crusher-01' as CrusherName, 
        'Conveyor Belt Tear' as Reason, 
        '10:00' as FromTime, '12:30' as ToTime, '2.5 hrs' as Duration;
END
GO

/* =============================================
   4. Performance Dashboard SP
   Returns: Highest Prod, Crusher Wise, Sector Wise, Operator, Loading
   ============================================= */
CREATE OR ALTER PROCEDURE [dbo].[ProMS2_Dash_SP_GetPerformanceStats]
    @FromDate DATE,
    @ToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Highest Production (Flat list, filtered by UI)
    -- Category: Coal, OB, Electrical, Dispatch, Crushing
    SELECT TOP 5 'Coal' as Category, 1 as SN, 50000 as Qty, 'Shift-C' as Shift, '6 Nov 25' as Day, 'Dec-25' as Month
    UNION ALL
    SELECT TOP 5 'OB', 1, 40000, 'Shift-A', '21 Dec 25', 'Dec-25';

    -- 2. Crusher Wise
    SELECT 'Sector-2' as Plant, 'Coal' as Category, 4563 as Qty
    UNION ALL
    SELECT 'Sector-3', 'Coal', 15000;

    -- 3. Sector Wise
    SELECT 'Sector-1' as Plant, 12000 as Qty;

    -- 4. Operator Performance
    SELECT 
        1 as SN, 'EQ-101' as Equipment, 12 as Trip, 1500 as Qty, 8.5 as Hrs, 
        'CAT' as Model, '100T' as Capacity, 'Shift-A' as Shift, 'Loading' as Type
    UNION ALL
    SELECT 
        1, 'DT-201', 25, 0, 8.0, 
        'Volvo', '60T', 'Shift-B', 'Hauling';

    -- 5. Loading Performance
    SELECT 
        1 as SN, 'LE-301' as Equipment, 450 as Rate, 
        'Komatsu' as Model, 'High' as Capacity, 'Shift-C' as Shift, 'Loading' as Type;
END
GO
