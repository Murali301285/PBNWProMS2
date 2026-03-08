const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
};

const createQuery = `
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Sp_ProductionTSMPLReport] 
    @Date DATE = NULL,
    @ShiftId INT = NULL,
    @ShiftChange INT = 0,
    @BreakTime INT = 0,
    @Blasting INT = 0,
    @Others INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    -- =============================================
    -- Constants & Variable Declaration
    -- =============================================
    DECLARE @OBId INT = 2, 
            @TopSoilId INT = 1, 
            @RomCoalId INT = 7, 
            @ObRehandlingId INT = 5, 
            @DestinationDumpB INT = 2, 
            @DestinationCarpetingWorkId INT = 10,
            @ShaleId INT = 4;

    DECLARE @ProdCoal DECIMAL(18,2) = 0,
            @ProdOB DECIMAL(18,2) = 0,
            @WPCoalQty DECIMAL(18,2) = 0,
            @WPObQty DECIMAL(18,2) = 0,
            @CarpettingObQty DECIMAL(18,2) = 0,
            @RehandlingCoalQty DECIMAL(18,2) = 0;

    -- =============================================
    -- 1. Aggregation from Trans.TblLoading
    --    Calculates: ProdCoal, ProdOB, WPCoal, WPOb, Carpeting(Loading Part)
    -- =============================================
    
    -- CTE to ID Equipment in Sector 5
    ;WITH Sector5Equipment AS (
        SELECT DISTINCT EquipmentId
        FROM Trans.TblEquipmentReading WITH(NOLOCK)
        WHERE SectorId = 5
          AND CAST([Date] AS DATE) = @Date
          AND ShiftId = @ShiftId
          AND IsDelete = 0
    )
    SELECT 
        -- Production Coal: Material = RomCoal
        @ProdCoal = SUM(CASE 
            WHEN MaterialId = @RomCoalId THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END),

        -- Production OB: Material in (TopSoil, OB) AND Dest != Carpeting
        @ProdOB = SUM(CASE 
            WHEN MaterialId IN (@TopSoilId, @OBId) AND DestinationId != @DestinationCarpetingWorkId THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END),

        -- WP-3 Coal: Material = RomCoal AND Equipment in Sector 5
        @WPCoalQty = SUM(CASE 
            WHEN MaterialId = @RomCoalId 
                 AND S5.EquipmentId IS NOT NULL -- Exists in Sector 5 List
            THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END),

        -- WP-3 OB: Material in (TopSoil, OB) AND Equipment in Sector 5
        @WPObQty = SUM(CASE 
            WHEN MaterialId IN (@TopSoilId, @OBId) 
                 AND S5.EquipmentId IS NOT NULL -- Exists in Sector 5 List
            THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END),

        -- Carpeting OB (Part 1): Dest = CarpetingWorkId
        @CarpettingObQty = SUM(CASE 
            WHEN DestinationId = @DestinationCarpetingWorkId THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END)

    FROM Trans.TblLoading T0 WITH(NOLOCK)
    LEFT JOIN Sector5Equipment S5 ON T0.LoadingMachineEquipmentId = S5.EquipmentId
    WHERE T0.IsDelete = 0 
      AND Convert(DATE, T0.LoadingDate) = @Date 
      AND T0.ShiftId = @ShiftId;

    -- =============================================
    -- 2. Aggregation from Trans.TblMaterialRehandling
    --    Calculates: Carpeting(Rehandling Part), Rehandling Coal
    -- =============================================
    DECLARE @Rehandling_Carpeting DECIMAL(18,2) = 0;

    SELECT 
        -- Carpeting OB (Part 2): Material = ObRehandling
        @Rehandling_Carpeting = SUM(CASE 
            WHEN MaterialId = @ObRehandlingId THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END),

        -- Coal Rehandling: Material = RomCoal
        @RehandlingCoalQty = SUM(CASE 
            WHEN MaterialId = @RomCoalId THEN (NoofTrip * QtyTrip) 
            ELSE 0 
        END)

    FROM Trans.TblMaterialRehandling WITH(NOLOCK)
    WHERE IsDelete = 0 
      AND Convert(DATE, RehandlingDate) = @Date 
      AND ShiftId = @ShiftId;

    -- Combine Carpeting Quantities
    SET @CarpettingObQty = ISNULL(@CarpettingObQty, 0) + ISNULL(@Rehandling_Carpeting, 0);

    -- Handle NULLs for final output
  SET @ProdCoal = ISNULL(@ProdCoal, 0);
    SET @ProdOB = ISNULL(@ProdOB, 0);
    SET @WPCoalQty = ISNULL(@WPCoalQty, 0);
    SET @WPObQty = ISNULL(@WPObQty, 0);
    SET @RehandlingCoalQty = ISNULL(@RehandlingCoalQty, 0);


    -- =============================================
    -- 3. Calculations for Time & Rates
    -- =============================================
    DECLARE @TotalMin DECIMAL(18,2), @TotalHrs DECIMAL(18,2), @TotalWorkingHrs DECIMAL(18,2);
    DECLARE @ProdCoalPerHrs DECIMAL(18,2), @ProdOBPerHrs DECIMAL(18,2);

    SET @TotalMin = @ShiftChange + @BreakTime + @Blasting + @Others;
    SET @TotalHrs = @TotalMin / 60.0;
    SET @TotalWorkingHrs = 8.0 - @TotalHrs;

    -- Avoid Divide by Zero
    IF @TotalWorkingHrs > 0
    BEGIN
        SET @ProdCoalPerHrs = @ProdCoal / @TotalWorkingHrs;
        SET @ProdOBPerHrs = @ProdOB / @TotalWorkingHrs;
    END
    ELSE
    BEGIN
        SET @ProdCoalPerHrs = 0;
        SET @ProdOBPerHrs = 0;
    END

    -- =============================================
    -- 4. Final Result Set: Summary Data
    -- =============================================
    SELECT 
        @ProdCoal AS ProdCoal,
        @ProdOB AS ProdOB,
        @WPCoalQty AS WPCoalQty,
        @WPObQty AS WPObQty,
        @RehandlingCoalQty AS RehandlingCoalQty,
        @CarpettingObQty AS CarpettingObQty,
        
        @ShiftChange AS ShiftChange,
        @BreakTime AS BreakTime,
        @Blasting AS Blasting,
        @Others AS Others,
        @TotalMin AS Totalmin,
        
        CAST((@ShiftChange/60.0) AS DECIMAL(18,1)) AS TotalShiftChangeHrs,
        CAST((@BreakTime/60.0) AS DECIMAL(18,1)) AS TotalBreakTimeHrs,
        CAST((@Blasting/60.0) AS DECIMAL(18,1)) AS TotalBlastingHrs,
        CAST((@Others/60.0) AS DECIMAL(18,1)) AS TotalOthersHrs,
        CAST(@TotalHrs AS DECIMAL(18,1)) AS TotalHrs,
        
        CAST(@TotalWorkingHrs AS DECIMAL(18,1)) AS TotalWorkingHrs,
        CAST(@ProdCoalPerHrs AS DECIMAL(18,2)) AS ProdCoalPerHrs,
        CAST(@ProdOBPerHrs AS DECIMAL(18,2)) AS ProdOBPerHrs;

    -- =============================================
    -- 5. Crusher Details (Sourcing from Loading Destinations)
    -- =============================================
    SELECT  
        D.Name AS Plant,
        0 AS RunningHr, -- Loading table doesn't have direct Crusher Running Hr, hardcode to 0 for now as it's not captured there
        ISNULL(SUM(L.TotalQty), 0) AS TotalQty 
    FROM Trans.TblLoading L WITH(NOLOCK)
    JOIN Master.TblDestination D WITH(NOLOCK) ON D.SlNo = L.DestinationId
    WHERE L.IsDelete = 0 
      AND Convert(DATE, L.LoadingDate) = @Date 
      AND L.ShiftId = @ShiftId
      AND (D.Name LIKE '%Crush%' OR D.Name LIKE '%CHP%')
    GROUP BY D.Name;

    -- =============================================
    -- 6. Filter Data (Shift Incharge, Relay)
    -- =============================================
    ;WITH FilterData AS (
        -- Loading Incharges
        SELECT T2.OperatorName AS ShiftIncharge, RE.Name AS Relay 
        FROM Trans.TblLoading T0 WITH(NOLOCK)
        JOIN Trans.TblLoadingShiftIncharge T1 WITH(NOLOCK) ON T1.LoadingId = T0.SlNo 
        JOIN Master.TblOperator T2 WITH(NOLOCK) ON T2.SlNo = T1.OperatorId 
        JOIN Master.TblRelay RE WITH(NOLOCK) ON RE.SlNo = T0.RelayId
        WHERE T0.IsDelete = 0 
          AND T0.MaterialId IN (@OBId, @TopSoilId, @RomCoalId) 
          AND Convert(DATE, T0.LoadingDate) = @Date 
          AND T0.ShiftId = @ShiftId

        -- [Crusher Incharge removed as TblCrusher is practically unused, keeping only Loading for Shift Incharge to avoid empty returns]
    )
    SELECT 
        (SELECT STRING_AGG(ShiftIncharge, ', ') FROM (SELECT DISTINCT ShiftIncharge FROM FilterData) AS SI) AS ShiftIncharge,
        (SELECT STRING_AGG(Relay, ', ') FROM (SELECT DISTINCT Relay FROM FilterData) AS RE) AS Relay,
        (SELECT TOP 1 ShiftName FROM Master.TblShift WITH(NOLOCK) WHERE SlNo = @ShiftId) AS ShiftName,
        FORMAT(@Date, 'dd-MMM-yyyy') AS Date,
        '' AS Logo;

END
`;

async function run() {
    try {
        await sql.connect(config);
        console.log("Updating TSMPL SP Crusher Details...");
        await sql.query(createQuery);
        console.log("Success.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
