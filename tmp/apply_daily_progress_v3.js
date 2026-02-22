const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

const spText = `
ALTER   PROCEDURE [dbo].[PMS2_New_Sp_DailyProgressReport]
	@Date DATE = NULL
AS
BEGIN
	SET NOCOUNT ON;

    -- =============================================
    -- Variable Declaration & Time Ranges
    -- =============================================
    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    DECLARE @StartOfYear DATE = DATEFROMPARTS(YEAR(@Date), 1, 1);

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
    CREATE TABLE #TempProduction (
        SlNo INT, 
        MaterialName VARCHAR(100), 
        Unit VARCHAR(50), 
        DayTrip INT DEFAULT(0), DayQty DECIMAL(18, 2) DEFAULT(0), 
        MonthTrip INT DEFAULT(0), MonthQty DECIMAL(18, 2) DEFAULT(0), 
        YearTrip INT DEFAULT(0), YearQty DECIMAL(18, 2) DEFAULT(0), 
        OrderNo INT 
    );

    INSERT INTO #TempProduction (SlNo, MaterialName, Unit, OrderNo) VALUES 
    (7, 'ROM COAL', 'MT', 1), 
    (1, 'TOP SOIL', 'BCM', 2), 
    (2, 'OVER BURDEN', 'BCM', 3), 
    (3, 'INTER BURDEN', 'BCM', 4);

    WITH ProductionAgg AS (
        SELECT 
            MaterialId,
            SUM(CASE WHEN CAST(LoadingDate AS DATE) = @Date THEN NoofTrip ELSE 0 END) AS DayTrip,
            SUM(CASE WHEN CAST(LoadingDate AS DATE) = @Date THEN TotalQty ELSE 0 END) AS DayQty,
            SUM(CASE WHEN LoadingDate >= @StartOfMonth AND CAST(LoadingDate AS DATE) <= @Date THEN NoofTrip ELSE 0 END) AS MonthTrip,
            SUM(CASE WHEN LoadingDate >= @StartOfMonth AND CAST(LoadingDate AS DATE) <= @Date THEN TotalQty ELSE 0 END) AS MonthQty,
            SUM(CASE WHEN LoadingDate >= @StartOfYear AND CAST(LoadingDate AS DATE) <= @Date THEN NoofTrip ELSE 0 END) AS YearTrip, 
            SUM(CASE WHEN LoadingDate >= @StartOfYear AND CAST(LoadingDate AS DATE) <= @Date THEN TotalQty ELSE 0 END) AS YearQty
        FROM Trans.TblLoading WITH(NOLOCK)
        WHERE LoadingDate >= @StartOfYear AND CAST(LoadingDate AS DATE) <= @Date
          AND IsDelete = 0 
        GROUP BY MaterialId
    )
    UPDATE T 
    SET 
        T.DayTrip = ISNULL(P.DayTrip, 0), T.DayQty = ISNULL(P.DayQty, 0),
        T.MonthTrip = ISNULL(P.MonthTrip, 0), T.MonthQty = ISNULL(P.MonthQty, 0),
        T.YearTrip = ISNULL(P.YearTrip, 0), T.YearQty = ISNULL(P.YearQty, 0)
    FROM #TempProduction T
    LEFT JOIN ProductionAgg P ON T.SlNo = P.MaterialId;

    INSERT INTO #TempProduction (SlNo, MaterialName, Unit, DayTrip, DayQty, MonthTrip, MonthQty, YearTrip, YearQty, OrderNo)
    SELECT 
        0, 'TOTAL WASTE', 'BCM', 
        SUM(DayTrip), SUM(DayQty), 
        SUM(MonthTrip), SUM(MonthQty), 
        SUM(YearTrip), SUM(YearQty), 
        6 
    FROM #TempProduction WHERE Unit = 'BCM';

    INSERT INTO #TempProduction (SlNo, MaterialName, Unit, DayTrip, DayQty, MonthTrip, MonthQty, YearTrip, YearQty, OrderNo)
    SELECT 
        0, 'TOTAL EXCAVATION', 'BCM (MT/' + CAST(@ConversionFactor AS VARCHAR(10)) + ')',
        SUM(DayTrip), 
        SUM(CASE WHEN Unit = 'MT' THEN DayQty / @ConversionFactor ELSE DayQty END), 
        SUM(MonthTrip),
        SUM(CASE WHEN Unit = 'MT' THEN MonthQty / @ConversionFactor ELSE MonthQty END),
        SUM(YearTrip),
        SUM(CASE WHEN Unit = 'MT' THEN YearQty / @ConversionFactor ELSE YearQty END),
        7
    FROM #TempProduction 
    WHERE OrderNo < 6; 

    SELECT 
        ROW_NUMBER() OVER (ORDER BY OrderNo) AS SlNo, 
        MaterialName, Unit,
        FORMAT(DayTrip, 'N0', 'en-IN') AS DayTrip, FORMAT(DayQty, 'N0', 'en-IN') AS DayQty,
        FORMAT(MonthTrip, 'N0', 'en-IN') AS MonthTrip, FORMAT(MonthQty, 'N0', 'en-IN') AS MonthQty,
        FORMAT(YearTrip, 'N0', 'en-IN') AS YearTrip, FORMAT(YearQty, 'N0', 'en-IN') AS YearQty
    FROM #TempProduction;

    -- =============================================
    -- 2. Drilling Details
    -- =============================================
    ;WITH DrillCTE AS (
        SELECT 
            M.MaterialName,
            
            -- Holes
            SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.NoofHoles ELSE 0 END) AS Holes_FTD,
            SUM(CASE WHEN D.Date >= @StartOfMonth AND CAST(D.Date AS DATE) <= @Date THEN D.NoofHoles ELSE 0 END) AS Holes_MTD,
            SUM(CASE WHEN D.Date >= @StartOfYear AND CAST(D.Date AS DATE) <= @Date THEN D.NoofHoles ELSE 0 END) AS Holes_YTD,
            
            -- Meters
            SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.TotalMeters ELSE 0 END) AS Drilling_FTD,
            SUM(CASE WHEN D.Date >= @StartOfMonth AND CAST(D.Date AS DATE) <= @Date THEN D.TotalMeters ELSE 0 END) AS Drilling_MTD,
            SUM(CASE WHEN D.Date >= @StartOfYear AND CAST(D.Date AS DATE) <= @Date THEN D.TotalMeters ELSE 0 END) AS Drilling_YTD,
            
            -- Hours (From Equipment Reading, joined by EquipmentId AND Date)
            SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN ER.TotalWorkingHr ELSE 0 END) AS Hrs_FTD,
            SUM(CASE WHEN D.Date >= @StartOfMonth AND CAST(D.Date AS DATE) <= @Date THEN ER.TotalWorkingHr ELSE 0 END) AS Hrs_MTD,
            SUM(CASE WHEN D.Date >= @StartOfYear AND CAST(D.Date AS DATE) <= @Date THEN ER.TotalWorkingHr ELSE 0 END) AS Hrs_YTD
            
        FROM Trans.TblDrilling D WITH(NOLOCK)
        JOIN Master.TblMaterial M WITH(NOLOCK) ON D.MaterialId = M.SlNo
        LEFT JOIN Trans.TblEquipmentReading ER WITH(NOLOCK) 
            ON D.EquipmentId = ER.EquipmentId 
            AND ER.ActivityId = 7 
            AND CAST(ER.Date AS DATE) = CAST(D.Date AS DATE)
            AND ER.IsDelete = 0
        WHERE D.Date >= @StartOfYear AND CAST(D.Date AS DATE) <= @Date 
        AND D.IsDelete = 0 
        GROUP BY M.MaterialName
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY MaterialName DESC) AS SlNo, 
        MaterialName AS MaterialType,
        
        FORMAT(Holes_FTD, 'N0', 'en-IN') AS Holes_FTD,
        FORMAT(Holes_MTD, 'N0', 'en-IN') AS Holes_MTD,
        FORMAT(Holes_YTD, 'N0', 'en-IN') AS Holes_YTD,
        
        FORMAT(Drilling_FTD, 'N0', 'en-IN') AS Drilling_FTD,
        FORMAT(Drilling_MTD, 'N0', 'en-IN') AS Drilling_MTD,
        FORMAT(Drilling_YTD, 'N0', 'en-IN') AS Drilling_YTD,
        
        FORMAT(ISNULL(Hrs_FTD, 0), 'N0', 'en-IN') AS Hrs_FTD,
        FORMAT(ISNULL(Hrs_MTD, 0), 'N0', 'en-IN') AS Hrs_MTD,
        FORMAT(ISNULL(Hrs_YTD, 0), 'N0', 'en-IN') AS Hrs_YTD,
        
        -- Meters / Hr (zero decimal places as requested)
        FORMAT(IIF(ISNULL(Hrs_FTD, 0) > 0, Drilling_FTD / Hrs_FTD, 0), 'N0', 'en-IN') AS MetersHr_FTD,
        FORMAT(IIF(ISNULL(Hrs_MTD, 0) > 0, Drilling_MTD / Hrs_MTD, 0), 'N0', 'en-IN') AS MetersHr_MTD,
        FORMAT(IIF(ISNULL(Hrs_YTD, 0) > 0, Drilling_YTD / Hrs_YTD, 0), 'N0', 'en-IN') AS MetersHr_YTD
        
    FROM DrillCTE;

    -- =============================================
    -- 3. Blasting Details
    -- =============================================
    ;WITH BlastingAgg AS (
        SELECT 
            M.MaterialName,
            SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.NoofHoles ELSE 0 END) AS Holes_FTD,
            SUM(CASE WHEN D.Date >= @StartOfMonth AND CAST(D.Date AS DATE) <= @Date THEN D.NoofHoles ELSE 0 END) AS Holes_MTD,
            SUM(CASE WHEN D.Date >= @StartOfYear AND CAST(D.Date AS DATE) <= @Date THEN D.NoofHoles ELSE 0 END) AS Holes_YTD,
            SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN B.TotalExplosiveUsed ELSE 0 END) AS Exp_FTD,
            SUM(CASE WHEN D.Date >= @StartOfMonth AND CAST(D.Date AS DATE) <= @Date THEN B.TotalExplosiveUsed ELSE 0 END) AS Exp_MTD,
            SUM(CASE WHEN D.Date >= @StartOfYear AND CAST(D.Date AS DATE) <= @Date THEN B.TotalExplosiveUsed ELSE 0 END) AS Exp_YTD,
            SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN (D.TotalMeters * D.Spacing * D.Burden * IIF(M.MaterialName = 'ROM COAL', 0.95, 0.90)) ELSE 0 END) AS Vol_FTD,
            SUM(CASE WHEN D.Date >= @StartOfMonth AND CAST(D.Date AS DATE) <= @Date THEN (D.TotalMeters * D.Spacing * D.Burden * IIF(M.MaterialName = 'ROM COAL', 0.95, 0.90)) ELSE 0 END) AS Vol_MTD,
            SUM(CASE WHEN D.Date >= @StartOfYear AND CAST(D.Date AS DATE) <= @Date THEN (D.TotalMeters * D.Spacing * D.Burden * IIF(M.MaterialName = 'ROM COAL', 0.95, 0.90)) ELSE 0 END) AS Vol_YTD
        FROM Trans.TblDrilling D WITH(NOLOCK)
        JOIN Master.TblMaterial M WITH(NOLOCK) ON D.MaterialId = M.SlNo
        LEFT JOIN Trans.TblBlasting B WITH(NOLOCK) ON D.DrillingPatchId = B.BlastingPatchId AND B.IsDelete = 0
        WHERE D.Date >= @StartOfYear AND CAST(D.Date AS DATE) <= @Date
        AND D.IsDelete = 0
        GROUP BY M.MaterialName
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY MaterialName DESC) AS SlNo,
        MaterialName,
        FORMAT(Holes_FTD, 'N0', 'en-IN') AS Holes_FTD, FORMAT(Holes_MTD, 'N0', 'en-IN') AS Holes_MTD, FORMAT(Holes_YTD, 'N0', 'en-IN') AS Holes_YTD,
        FORMAT(Exp_FTD, 'N0', 'en-IN') AS Exp_FTD, FORMAT(Exp_MTD, 'N0', 'en-IN') AS Exp_MTD, FORMAT(Exp_YTD, 'N0', 'en-IN') AS Exp_YTD,
        FORMAT(Vol_FTD, 'N0', 'en-IN') AS TotalVolume_FTD, FORMAT(Vol_MTD, 'N0', 'en-IN') AS TotalVolume_MTD, FORMAT(Vol_YTD, 'N0', 'en-IN') AS TotalVolume_YTD,
        FORMAT(IIF(Exp_FTD > 0, Vol_FTD / Exp_FTD, 0), 'N0', 'en-IN') AS PowderFactor_FTD,
        FORMAT(IIF(Exp_MTD > 0, Vol_MTD / Exp_MTD, 0), 'N0', 'en-IN') AS PowderFactor_MTD,
        FORMAT(IIF(Exp_YTD > 0, Vol_YTD / Exp_YTD, 0), 'N0', 'en-IN') AS PowderFactor_YTD
    FROM BlastingAgg;

    -- =============================================
    -- 4. Crusher Details
    -- =============================================
    WITH CrusherAgg AS (
        SELECT 
            PlantId,
            SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN RunningHr ELSE 0 END) AS Hrs_FTD,
            SUM(CASE WHEN Date >= @StartOfMonth AND CAST(Date AS DATE) <= @Date THEN RunningHr ELSE 0 END) AS Hrs_MTD,
            SUM(CASE WHEN Date >= @StartOfYear AND CAST(Date AS DATE) <= @Date THEN RunningHr ELSE 0 END) AS Hrs_YTD,
            SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN TotalQty ELSE 0 END) AS Qty_FTD,
            SUM(CASE WHEN Date >= @StartOfMonth AND CAST(Date AS DATE) <= @Date THEN TotalQty ELSE 0 END) AS Qty_MTD,
            SUM(CASE WHEN Date >= @StartOfYear AND CAST(Date AS DATE) <= @Date THEN TotalQty ELSE 0 END) AS Qty_YTD,
            SUM(CASE WHEN CAST(Date AS DATE) = @Date THEN PowerKWH ELSE 0 END) AS KWH_FTD,
            SUM(CASE WHEN Date >= @StartOfMonth AND CAST(Date AS DATE) <= @Date THEN PowerKWH ELSE 0 END) AS KWH_MTD,
            SUM(CASE WHEN Date >= @StartOfYear AND CAST(Date AS DATE) <= @Date THEN PowerKWH ELSE 0 END) AS KWH_YTD
        FROM Trans.TblCrusher WITH(NOLOCK)
        WHERE Date >= @StartOfYear AND CAST(Date AS DATE) <= @Date
        AND IsDelete = 0
        GROUP BY PlantId
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY P.Name DESC) AS SlNo, 
        P.Name AS Plant,
        FORMAT(ISNULL(C.Hrs_FTD, 0), 'N0', 'en-IN') AS Hrs_FTD, FORMAT(ISNULL(C.Hrs_MTD, 0), 'N0', 'en-IN') AS Hrs_MTD, FORMAT(ISNULL(C.Hrs_YTD, 0), 'N0', 'en-IN') AS Hrs_YTD,
        FORMAT(ISNULL(C.Qty_FTD, 0), 'N0', 'en-IN') AS Qty_FTD, FORMAT(ISNULL(C.Qty_MTD, 0), 'N0', 'en-IN') AS Qty_MTD, FORMAT(ISNULL(C.Qty_YTD, 0), 'N0', 'en-IN') AS Qty_YTD,
        FORMAT(ISNULL(C.KWH_FTD, 0), 'N0', 'en-IN') AS KWH_FTD, FORMAT(ISNULL(C.KWH_MTD, 0), 'N0', 'en-IN') AS KWH_MTD, FORMAT(ISNULL(C.KWH_YTD, 0), 'N0', 'en-IN') AS KWH_YTD,
        FORMAT(IIF(ISNULL(C.Hrs_FTD, 0) > 0, ISNULL(C.KWH_FTD, 0) / C.Hrs_FTD, 0), 'N0', 'en-IN') AS KWH_HR_FTD,
        FORMAT(IIF(ISNULL(C.Hrs_MTD, 0) > 0, ISNULL(C.KWH_MTD, 0) / C.Hrs_MTD, 0), 'N0', 'en-IN') AS KWH_HR_MTD,
        FORMAT(IIF(ISNULL(C.Hrs_YTD, 0) > 0, ISNULL(C.KWH_YTD, 0) / C.Hrs_YTD, 0), 'N0', 'en-IN') AS KWH_HR_YTD
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
        CAST(@ConversionFactor AS VARCHAR(10)) AS ConversionFactor,
        '' AS Logo;
END
`;

async function run() {
    try {
        const pool = await sql.connect(config);
        await pool.request().batch(spText);
        console.log("SP Updated successfully.");
    } catch (e) {
        console.error(e.originalError || e);
    } finally {
        process.exit();
    }
}
run();
