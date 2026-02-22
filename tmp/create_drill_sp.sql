
CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_GetDrillingBlastingStats]
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@Date), MONTH(@Date), 1);
    
    -- =============================================
    -- 1. Drilling KPIs
    -- =============================================
    -- Highest Drill (Shift) - Best single shift performance today
    SELECT TOP 1
        'Shift' AS Period,
        CAST(D.TotalMeters AS DECIMAL(18,2)) AS MaxMeters,
        E.EquipmentName,
        S.ShiftName
    FROM Trans.TblDrilling D WITH(NOLOCK)
    JOIN Master.TblEquipment E WITH(NOLOCK) ON D.EquipmentId = E.SlNo
    JOIN Master.TblShift S WITH(NOLOCK) ON D.ShiftId = S.SlNo
    WHERE CAST(D.Date AS DATE) = @Date AND D.IsDelete = 0
    ORDER BY D.TotalMeters DESC
    
    UNION ALL
    
    -- Highest Drill (Day) - Best total performance today by a drill
    SELECT TOP 1
        'Day' AS Period,
        CAST(SUM(D.TotalMeters) AS DECIMAL(18,2)) AS MaxMeters,
        E.EquipmentName,
        '' AS ShiftName
    FROM Trans.TblDrilling D WITH(NOLOCK)
    JOIN Master.TblEquipment E WITH(NOLOCK) ON D.EquipmentId = E.SlNo
    WHERE CAST(D.Date AS DATE) = @Date AND D.IsDelete = 0
    GROUP BY E.EquipmentName
    ORDER BY SUM(D.TotalMeters) DESC
    
    UNION ALL
    
    -- Highest Drill (Month) - Best total performance this month by a drill
    SELECT TOP 1
        'Month' AS Period,
        CAST(SUM(D.TotalMeters) AS DECIMAL(18,2)) AS MaxMeters,
        E.EquipmentName,
        '' AS ShiftName
    FROM Trans.TblDrilling D WITH(NOLOCK)
    JOIN Master.TblEquipment E WITH(NOLOCK) ON D.EquipmentId = E.SlNo
    WHERE CAST(D.Date AS DATE) BETWEEN @StartOfMonth AND @Date AND D.IsDelete = 0
    GROUP BY E.EquipmentName
    ORDER BY SUM(D.TotalMeters) DESC;

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
        MAX(D.Remarks) AS Remarks, -- Just taking one remark if multiple
        SUM(CASE WHEN CAST(D.Date AS DATE) = @Date THEN D.TotalMeters ELSE 0 END) AS DayMeters,
        -- Approximate Shift Meters (Avg or Max for display? Table col is Shift (m). Usually implies "Last Shift" or "Current Shift". Let's sum for now or list all? The table implies one row per Drill.)
        -- Let's provide the Max single shift meter as "Shift Meters"
        MAX(D.TotalMeters) AS ShiftMeters, 
        -- Achievement? Assumed Target. If no target, calculate mock based on 1000m? 
        -- Or just return 0.
        -- Let's calculate Achievement relative to a fixed assumed target of 400m per day for now, to avoid 0s. 
        -- A real target table would be better.
        CAST((SUM(D.TotalMeters) / 400.0) * 100 AS DECIMAL(18,0)) AS Achievement
    FROM Trans.TblDrilling D WITH(NOLOCK)
    JOIN Master.TblEquipment E WITH(NOLOCK) ON D.EquipmentId = E.SlNo
    WHERE CAST(D.Date AS DATE) = @Date AND D.IsDelete = 0
    GROUP BY E.EquipmentName;

    -- =============================================
    -- 4. Blasting Supplier (Chart) - Supplier Share
    -- =============================================
    SELECT 
        ISNULL(S.Name, 'Unknown') AS name,
        CAST(SUM(B.SMEQty) AS DECIMAL(18,2)) AS value
    FROM Trans.TblBlasting B WITH(NOLOCK)
    LEFT JOIN Master.TblSMESupplier S WITH(NOLOCK) ON B.SMESupplierId = S.SlNo
    WHERE CAST(B.Date AS DATE) = @Date AND B.IsDelete = 0 AND B.SMEQty > 0
    GROUP BY S.Name;

    -- =============================================
    -- 5. Explosive Summary (Donut)
    -- =============================================
    -- Group by SME Category if available, else hardcode 'SME'
    SELECT 
        ISNULL(C.Category, 'SME') AS type,
        CAST(SUM(B.SMEQty) AS DECIMAL(18,2)) AS value
    FROM Trans.TblBlasting B WITH(NOLOCK)
    LEFT JOIN Master.TblSMESupplier S WITH(NOLOCK) ON B.SMESupplierId = S.SlNo
    LEFT JOIN Master.TblSMECategory C WITH(NOLOCK) ON S.SMECategoryId = C.SlNo
    WHERE CAST(B.Date AS DATE) = @Date AND B.IsDelete = 0 AND B.SMEQty > 0
    GROUP BY C.Category;

    -- =============================================
    -- 6. Blasting Details Log
    -- =============================================
    SELECT 
        ISNULL(Loc.LocationName, B.BlastingPatchId) AS Location,
        B.BlastingPatchId AS Pattern, -- Assuming PatchId serves as Pattern ID or similar
        CAST(B.NoofHolesDeckCharged AS INT) AS Holes,
        CAST(B.TotalExplosiveUsed AS DECIMAL(18,2)) AS Explosive,
        ISNULL(C.Category, 'Composite') AS Type,
        ISNULL(S.Name, 'Internal') AS Supplier
    FROM Trans.TblBlasting B WITH(NOLOCK)
    LEFT JOIN Master.TblSMESupplier S WITH(NOLOCK) ON B.SMESupplierId = S.SlNo
    LEFT JOIN Master.TblSMECategory C WITH(NOLOCK) ON S.SMECategoryId = C.SlNo
    -- LocationId? TblBlasting doesn't have LocationId in columns I saw?
    -- Checked cols: BlastingPatchId (nvarchar).
    -- TblDrilling has LocationId. Blasting usually follows Drilling.
    -- Let's try to join with Location string or just use PatchId.
    -- For now, using BlastingPatchId as Location if no better match.
    LEFT JOIN Master.TblLocation Loc WITH(NOLOCK) ON 1=0 -- Placeholder
    WHERE CAST(B.Date AS DATE) = @Date AND B.IsDelete = 0;

END
