const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2026',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

const spSQL = `
ALTER PROCEDURE [dbo].[PMS2_New_Sp_DailyProgressReport]
	@Date DATE = NULL
AS
BEGIN
	SET NOCOUNT ON;

    -- =============================================
    -- Variable Declaration & Time Ranges
    -- =============================================
    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @StartOfNextMonth DATE = DATEADD(MONTH, 1, @StartOfMonth);
    
    -- Dynamic Financial Year (FY) Start Date calculation:
    -- If Month is April (4) or later, FY starts on April 1st of the current year.
    -- If Month is March (3) or earlier, FY starts on April 1st of the previous year.
    DECLARE @StartOfYear DATE;
    IF MONTH(@Date) >= 4
        SET @StartOfYear = DATEFROMPARTS(YEAR(@Date), 4, 1);
    ELSE
        SET @StartOfYear = DATEFROMPARTS(YEAR(@Date) - 1, 4, 1);

    -- Material IDs
    DECLARE @RomCoalId INT = 7;
    DECLARE @TopSoilId INT = 1;
    DECLARE @OBId INT = 2;
    DECLARE @IBId INT = 3;

    -- Dynamic Conversion Factor
    DECLARE @ConversionFactor DECIMAL(18,2);

    SELECT TOP 1 @ConversionFactor = Factor 
    FROM [Master].[TblConversionFactor] WITH(NOLOCK)
    WHERE @Date BETWEEN FromDate AND ToDate 
    AND IsActive = 1 AND IsDelete = 0
    ORDER BY FromDate DESC;

    IF @ConversionFactor IS NULL 
        SET @ConversionFactor = 1.55;

    -- =============================================
    -- 1. Production Details
    -- =============================================
    -- Structure to hold production data
    CREATE TABLE #TempProduction (
        SlNo INT, 
        MaterialName VARCHAR(100), 
        Unit VARCHAR(50), 
        DayTrip INT DEFAULT(0), DayQty DECIMAL(18, 2) DEFAULT(0), 
        MonthTrip INT DEFAULT(0), MonthQty DECIMAL(18, 2) DEFAULT(0), 
        YearTrip INT DEFAULT(0), YearQty DECIMAL(18, 2) DEFAULT(0), 
        OrderNo INT 
    );

    -- Pre-populate categories
    INSERT INTO #TempProduction (SlNo, MaterialName, Unit, OrderNo) VALUES 
    (7, 'ROM COAL', 'MT', 1), 
    (1, 'TOP SOIL', 'BCM', 2), 
    (2, 'OVER BURDEN', 'BCM', 3), 
    (3, 'INTER BURDEN', 'BCM', 4);

    -- Aggregate Loading Data
    WITH ProductionAgg AS (
        SELECT 
            MaterialId,
            SUM(CASE WHEN CAST(LoadingDate AS DATE) = @Date THEN NoofTrip ELSE 0 END) AS DayTrip,
            SUM(CASE WHEN CAST(LoadingDate AS DATE) = @Date THEN TotalQty ELSE 0 END) AS DayQty,
            SUM(CASE WHEN LoadingDate >= @StartOfMonth AND LoadingDate < @StartOfNextMonth THEN NoofTrip ELSE 0 END) AS MonthTrip,
            SUM(CASE WHEN LoadingDate >= @StartOfMonth AND LoadingDate < @StartOfNextMonth THEN TotalQty ELSE 0 END) AS MonthQty,
            SUM(NoofTrip) AS YearTrip, 
            SUM(TotalQty) AS YearQty
        FROM Trans.TblLoading WITH(NOLOCK)
        WHERE LoadingDate >= @StartOfYear AND IsDelete = 0 
        GROUP BY MaterialId
    )
    UPDATE T 
    SET 
        T.DayTrip = ISNULL(P.DayTrip, 0), T.DayQty = ISNULL(P.DayQty, 0),
        T.MonthTrip = ISNULL(P.MonthTrip, 0), T.MonthQty = ISNULL(P.MonthQty, 0),
        T.YearTrip = ISNULL(P.YearTrip, 0), T.YearQty = ISNULL(P.YearQty, 0)
    FROM #TempProduction T
    LEFT JOIN ProductionAgg P ON T.SlNo = P.MaterialId;

    -- Calculate 'TOTAL WASTE' (BCM items)
    INSERT INTO #TempProduction (SlNo, MaterialName, Unit, DayTrip, DayQty, MonthTrip, MonthQty, YearTrip, YearQty, OrderNo)
    SELECT 
        0, 'TOTAL WASTE', 'BCM', 
        SUM(DayTrip), SUM(DayQty), 
        SUM(MonthTrip), SUM(MonthQty), 
        SUM(YearTrip), SUM(YearQty), 
        6 
    FROM #TempProduction WHERE Unit = 'BCM';

    -- Calculate 'TOTAL EXCAVATION'
    -- Logic: Coal (MT / ConversionFactor) + Waste (BCM)
    -- Using Dynamic @ConversionFactor

    INSERT INTO #TempProduction (SlNo, MaterialName, Unit, DayTrip, DayQty, MonthTrip, MonthQty, YearTrip, YearQty, OrderNo)
    SELECT 
        0, 'TOTAL EXCAVATION', 'BCM (MT/' + CAST(@ConversionFactor AS VARCHAR(10)) + ')',
        SUM(DayTrip), -- Total Trips
        SUM(CASE WHEN Unit = 'MT' THEN DayQty / @ConversionFactor ELSE DayQty END), -- Coal/@ConversionFactor + BCM
        SUM(MonthTrip),
        SUM(CASE WHEN Unit = 'MT' THEN MonthQty / @ConversionFactor ELSE MonthQty END),
        SUM(YearTrip),
        SUM(CASE WHEN Unit = 'MT' THEN YearQty / @ConversionFactor ELSE YearQty END),
        7
    FROM #TempProduction 
    WHERE OrderNo < 6; -- Exclude 'TOTAL WASTE' row to avoid double counting

    -- Result Set 1: Production
    SELECT 
        ROW_NUMBER() OVER (ORDER BY OrderNo) AS SlNo, 
        MaterialName, Unit,
        FORMAT(DayTrip, 'N0', 'en-IN') AS DayTrip, FORMAT(DayQty, 'N2', 'en-IN') AS DayQty,
        FORMAT(MonthTrip, 'N0', 'en-IN') AS MonthTrip, FORMAT(MonthQty, 'N2', 'en-IN') AS MonthQty,
        FORMAT(YearTrip, 'N0', 'en-IN') AS YearTrip, FORMAT(YearQty, 'N2', 'en-IN') AS YearQty
    FROM #TempProduction;


    -- =============================================
    -- 2. Drilling Details
    -- =============================================
    -- Aggregate Drilling Data
    SELECT 
        ROW_NUMBER() OVER (ORDER BY M.MaterialName DESC) AS SlNo, 
        M.MaterialName AS MaterialType,
        
        FORMAT(SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.NoofHoles ELSE 0 END), 'N0', 'en-IN') AS Holes_FTD,
        FORMAT(SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN D.NoofHoles ELSE 0 END), 'N0', 'en-IN') AS Holes_MTD,
        FORMAT(SUM(D.NoofHoles), 'N0', 'en-IN') AS Holes_YTD,

        FORMAT(SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.TotalMeters ELSE 0 END), 'N2', 'en-IN') AS Drilling_FTD,
        FORMAT(SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN D.TotalMeters ELSE 0 END), 'N2', 'en-IN') AS Drilling_MTD,
        FORMAT(SUM(D.TotalMeters), 'N2', 'en-IN') AS Drilling_YTD,

        -- Hours from Equipment Reading (ActivityId=7 for Drilling)
        FORMAT(ISNULL(SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN ER.TotalWorkingHr ELSE 0 END), 0), 'N2', 'en-IN') AS Hrs_FTD,
        FORMAT(ISNULL(SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN ER.TotalWorkingHr ELSE 0 END), 0), 'N2', 'en-IN') AS Hrs_MTD,
        FORMAT(ISNULL(SUM(ER.TotalWorkingHr), 0), 'N2', 'en-IN') AS Hrs_YTD

    FROM Trans.TblDrilling D WITH(NOLOCK)
    JOIN Master.TblMaterial M WITH(NOLOCK) ON D.MaterialId = M.SlNo
    LEFT JOIN Trans.TblEquipmentReading ER WITH(NOLOCK) 
        ON D.EquipmentId = ER.EquipmentId AND ER.ActivityId = 7 AND ER.IsDelete = 0
    WHERE D.Date >= @StartOfYear AND D.IsDelete = 0 
    GROUP BY M.MaterialName;


    -- =============================================
    -- 3. Blasting Details
    -- =============================================
    -- Common Table Experession for Blasting Aggregates
    ;WITH BlastingAgg AS (
        SELECT 
            M.MaterialName,
            
            -- Holes
            SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.NoofHoles ELSE 0 END) AS Holes_FTD,
            SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN D.NoofHoles ELSE 0 END) AS Holes_MTD,
            SUM(D.NoofHoles) AS Holes_YTD,

            -- Explosives
            SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN B.TotalExplosiveUsed ELSE 0 END) AS Exp_FTD,
            SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN B.TotalExplosiveUsed ELSE 0 END) AS Exp_MTD,
            SUM(B.TotalExplosiveUsed) AS Exp_YTD,

            -- Volume (Meters * Spacing * Burden * Factor)
            SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN (D.TotalMeters * D.Spacing * D.Burden * IIF(M.MaterialName = 'ROM COAL', 0.95, 0.90)) ELSE 0 END) AS Vol_FTD,
            SUM(CASE WHEN D.Date >= @StartOfMonth AND D.Date < @StartOfNextMonth THEN (D.TotalMeters * D.Spacing * D.Burden * IIF(M.MaterialName = 'ROM COAL', 0.95, 0.90)) ELSE 0 END) AS Vol_MTD,
            SUM(D.TotalMeters * D.Spacing * D.Burden * IIF(M.MaterialName = 'ROM COAL', 0.95, 0.90)) AS Vol_YTD

        FROM Trans.TblDrilling D WITH(NOLOCK)
        JOIN Master.TblMaterial M WITH(NOLOCK) ON D.MaterialId = M.SlNo
        LEFT JOIN Trans.TblBlasting B WITH(NOLOCK) ON D.DrillingPatchId = B.BlastingPatchId AND B.IsDelete = 0
        WHERE D.Date >= @StartOfYear AND D.IsDelete = 0
        GROUP BY M.MaterialName
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY MaterialName DESC) AS SlNo,
        MaterialName,
        FORMAT(Holes_FTD, 'N0', 'en-IN') AS Holes_FTD, FORMAT(Holes_MTD, 'N0', 'en-IN') AS Holes_MTD, FORMAT(Holes_YTD, 'N0', 'en-IN') AS Holes_YTD,
        FORMAT(Exp_FTD, 'N2', 'en-IN') AS Exp_FTD, FORMAT(Exp_MTD, 'N2', 'en-IN') AS Exp_MTD, FORMAT(Exp_YTD, 'N2', 'en-IN') AS Exp_YTD,
        FORMAT(Vol_FTD, 'N2', 'en-IN') AS TotalVolume_FTD, FORMAT(Vol_MTD, 'N2', 'en-IN') AS TotalVolume_MTD, FORMAT(Vol_YTD, 'N2', 'en-IN') AS TotalVolume_YTD,
        
        -- Powder Factor
        FORMAT(IIF(Exp_FTD > 0, Vol_FTD / Exp_FTD, 0), 'N2', 'en-IN') AS PowderFactor_FTD,
        FORMAT(IIF(Exp_MTD > 0, Vol_MTD / Exp_MTD, 0), 'N2', 'en-IN') AS PowderFactor_MTD,
        FORMAT(IIF(Exp_YTD > 0, Vol_YTD / Exp_YTD, 0), 'N2', 'en-IN') AS PowderFactor_YTD
    FROM BlastingAgg;


    -- =============================================
    -- 4. Crusher Details
    -- =============================================
    WITH CrusherAgg AS (
        SELECT 
            PlantId,
            SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN RunningHr ELSE 0 END) AS Hrs_FTD,
            SUM(CASE WHEN Date >= @StartOfMonth AND Date < @StartOfNextMonth THEN RunningHr ELSE 0 END) AS Hrs_MTD,
            SUM(RunningHr) AS Hrs_YTD,

            SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN TotalQty ELSE 0 END) AS Qty_FTD,
            SUM(CASE WHEN Date >= @StartOfMonth AND Date < @StartOfNextMonth THEN TotalQty ELSE 0 END) AS Qty_MTD,
            SUM(TotalQty) AS Qty_YTD,

            SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN PowerKWH ELSE 0 END) AS KWH_FTD,
            SUM(CASE WHEN Date >= @StartOfMonth AND Date < @StartOfNextMonth THEN PowerKWH ELSE 0 END) AS KWH_MTD,
            SUM(PowerKWH) AS KWH_YTD
        FROM Trans.TblCrusher WITH(NOLOCK)
        WHERE Date >= @StartOfYear AND IsDelete = 0
        GROUP BY PlantId
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY P.Name DESC) AS SlNo, 
        P.Name AS Plant,
        FORMAT(ISNULL(C.Hrs_FTD, 0), 'N2', 'en-IN') AS Hrs_FTD, FORMAT(ISNULL(C.Hrs_MTD, 0), 'N2', 'en-IN') AS Hrs_MTD, FORMAT(ISNULL(C.Hrs_YTD, 0), 'N2', 'en-IN') AS Hrs_YTD,
        FORMAT(ISNULL(C.Qty_FTD, 0), 'N0', 'en-IN') AS Qty_FTD, FORMAT(ISNULL(C.Qty_MTD, 0), 'N0', 'en-IN') AS Qty_MTD, FORMAT(ISNULL(C.Qty_YTD, 0), 'N0', 'en-IN') AS Qty_YTD,
        FORMAT(ISNULL(C.KWH_FTD, 0), 'N2', 'en-IN') AS KWH_FTD, FORMAT(ISNULL(C.KWH_MTD, 0), 'N2', 'en-IN') AS KWH_MTD, FORMAT(ISNULL(C.KWH_YTD, 0), 'N2', 'en-IN') AS KWH_YTD,
        
        -- KWH Per Hour
        FORMAT(IIF(ISNULL(C.Hrs_FTD, 0) > 0, ISNULL(C.KWH_FTD, 0) / C.Hrs_FTD, 0), 'N2', 'en-IN') AS KWH_HR_FTD,
        FORMAT(IIF(ISNULL(C.Hrs_MTD, 0) > 0, ISNULL(C.KWH_MTD, 0) / C.Hrs_MTD, 0), 'N2', 'en-IN') AS KWH_HR_MTD,
        FORMAT(IIF(ISNULL(C.Hrs_YTD, 0) > 0, ISNULL(C.KWH_YTD, 0) / C.Hrs_YTD, 0), 'N2', 'en-IN') AS KWH_HR_YTD
    FROM Master.TblPlant P WITH(NOLOCK)
    LEFT JOIN CrusherAgg C ON P.SlNo = C.PlantId
    WHERE P.IsDelete = 0 AND P.IsDPRReport = 1;

    -- =============================================
    -- 5. Header Info
    -- =============================================
    SELECT 
        'PRODUCTION DETAILS' AS ProductionHeading,
        'DRILLING DETAILS' AS DrillingHeading,
        'BLASTING DETAILS' AS BlastingHeading,
        'CRUSHER PRODUCTION' AS CrusherHeading,
        FORMAT(@Date, 'dd-MM-yyyy') AS Date,
        CAST(@ConversionFactor AS VARCHAR(10)) AS ConversionFactor, -- Returning Conversion Factor
        '' AS Logo;

END
`;

async function applySP() {
    try {
        console.log("Connecting to MSSQL...");
        await mssql.connect(config);

        console.log("Updating PMS2_New_Sp_DailyProgressReport to use Financial Year (FY) logic...");
        await mssql.query(spSQL);
        console.log("SP PMS2_New_Sp_DailyProgressReport updated successfully.");

    } catch (err) {
        console.error("Error creating SP:", err);
    } finally {
        await mssql.close();
    }
}

applySP();
