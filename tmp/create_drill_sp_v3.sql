
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_GetDrillingBlastingStats]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    
    -- =============================================
    -- 1. Drilling KPIs
    -- =============================================
    CREATE TABLE #DrillKPIs (
        Period VARCHAR(50),
        MaxMeters DECIMAL(18,2),
        EquipmentName VARCHAR(100),
        ShiftName VARCHAR(50)
    );

    INSERT INTO #DrillKPIs
    SELECT TOP 1 'Shift', CAST(D.TotalMeters AS DECIMAL(18,2)), E.EquipmentName, S.ShiftName
    FROM Trans.TblDrilling D WITH(NOLOCK)
    JOIN Master.TblEquipment E WITH(NOLOCK) ON D.EquipmentId = E.SlNo
    JOIN Master.TblShift S WITH(NOLOCK) ON D.ShiftId = S.SlNo
    WHERE CAST(D.Date AS DATE) = @Date AND D.IsDelete = 0
    ORDER BY D.TotalMeters DESC;

    INSERT INTO #DrillKPIs
    SELECT TOP 1 'Day', CAST(SUM(D.TotalMeters) AS DECIMAL(18,2)), E.EquipmentName, ''
    FROM Trans.TblDrilling D WITH(NOLOCK)
    JOIN Master.TblEquipment E WITH(NOLOCK) ON D.EquipmentId = E.SlNo
    WHERE CAST(D.Date AS DATE) = @Date AND D.IsDelete = 0
    GROUP BY E.EquipmentName
    ORDER BY SUM(D.TotalMeters) DESC;

    INSERT INTO #DrillKPIs
    SELECT TOP 1 'Month', CAST(SUM(D.TotalMeters) AS DECIMAL(18,2)), E.EquipmentName, ''
    FROM Trans.TblDrilling D WITH(NOLOCK)
    JOIN Master.TblEquipment E WITH(NOLOCK) ON D.EquipmentId = E.SlNo
    WHERE CAST(D.Date AS DATE) BETWEEN @StartOfMonth AND @Date AND D.IsDelete = 0
    GROUP BY E.EquipmentName
    ORDER BY SUM(D.TotalMeters) DESC;

    SELECT * FROM #DrillKPIs;

    -- =============================================
    -- 2. Drilling Recovery (Chart) - Last 7 Days
    -- =============================================
    SELECT 
        FORMAT(CAST(Date AS DATE), 'dd-MMM') AS Date,
        SUM(TotalMeters) AS Meters
    FROM Trans.TblDrilling WITH(NOLOCK)
    WHERE CAST(Date AS DATE) >= DATEADD(DAY, -6, @Date) 
      AND CAST(Date AS DATE) <= @Date 
      AND IsDelete = 0
    GROUP BY CAST(Date AS DATE)
    ORDER BY CAST(Date AS DATE);

    -- =============================================
    -- 3. Drilling Performance (Table) - Today
    -- =============================================
    SELECT 
        E.EquipmentName,
        MAX(D.Remarks) AS Remarks, 
        SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.TotalMeters ELSE 0 END) AS DayMeters,
        MAX(D.TotalMeters) AS ShiftMeters, 
        CAST((SUM(D.TotalMeters) / 400.0) * 100 AS DECIMAL(18,0)) AS Achievement
    FROM Trans.TblDrilling D WITH(NOLOCK)
    JOIN Master.TblEquipment E WITH(NOLOCK) ON D.EquipmentId = E.SlNo
    WHERE CAST(D.Date AS DATE) = @Date AND D.IsDelete = 0
    GROUP BY E.EquipmentName;

    -- =============================================
    -- 4. Blasting Supplier (Chart)
    -- =============================================
    SELECT 
        ISNULL(S.Name, 'Unknown') AS name,
        CAST(SUM(B.SMEQty) AS DECIMAL(18,2)) AS value
    FROM Trans.TblBlasting B WITH(NOLOCK)
    LEFT JOIN Master.TblSMESupplier S WITH(NOLOCK) ON B.SMESupplierId = S.SlNo
    WHERE CAST(B.Date AS DATE) = @Date AND B.IsDelete = 0 AND B.SMEQty > 0
    GROUP BY S.Name;

    -- =============================================
    -- 5. Explosive Summary (Donut) - Pivoted
    -- =============================================
    SELECT 
        CAST(SUM(SMEQty) AS DECIMAL(18,2)) AS TotalSME,
        CAST(SUM(CASE WHEN (TotalExplosiveUsed - SMEQty) > 0 THEN (TotalExplosiveUsed - SMEQty) ELSE 0 END) AS DECIMAL(18,2)) AS TotalANFO,
        0 AS TotalLDE, -- Placeholder as no specific column found
        CAST(SUM(TotalExplosiveUsed) AS DECIMAL(18,2)) AS GrandTotal
    FROM Trans.TblBlasting WITH(NOLOCK)
    WHERE CAST(Date AS DATE) = @Date AND IsDelete = 0;

    -- =============================================
    -- 6. Blasting Details Log
    -- =============================================
    SELECT 
        ISNULL(Loc.LocationName, B.BlastingPatchId) AS Location,
        B.BlastingPatchId AS Pattern, 
        CAST(B.NoofHolesDeckCharged AS INT) AS Holes,
        CAST(B.TotalExplosiveUsed AS DECIMAL(18,2)) AS Explosive,
        'Composite' AS Type, -- Hardcoded as we don't have per-row type generally
        ISNULL(S.Name, 'Internal') AS Supplier
    FROM Trans.TblBlasting B WITH(NOLOCK)
    LEFT JOIN Master.TblSMESupplier S WITH(NOLOCK) ON B.SMESupplierId = S.SlNo
    LEFT JOIN Master.TblLocation Loc WITH(NOLOCK) ON 1=0 
    WHERE CAST(B.Date AS DATE) = @Date AND B.IsDelete = 0;

    DROP TABLE #DrillKPIs;
END
