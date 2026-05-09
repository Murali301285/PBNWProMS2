CREATE   PROCEDURE [dbo].[PMS2_New_Sp_TentativeProductionQty]



    @Date DATE,



    @ShiftId INT



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



            @DestinationCarpetingWorkId INT = 10;



    -- =============================================



    -- 1. Waste Handling (Now OB Handling)



    -- =============================================



    ;WITH WasteHandlingTable AS ( 



        SELECT 



            T1.EquipmentGroupId,



            T2.Name AS EquipmentGroup,



            T3.Name AS Scale,



            T0.MaterialId,



            SUM(T0.NoofTrip) AS NoofTrip,



            T0.QtyTrip



        FROM Trans.TblLoading T0 WITH(NOLOCK)



        JOIN Master.TblEquipment T1 WITH(NOLOCK) ON T1.SlNo = T0.HaulerEquipmentId



        JOIN Master.TblEquipmentGroup T2 WITH(NOLOCK) ON T2.SlNo = T1.EquipmentGroupId



        JOIN Master.TblScale T3 WITH(NOLOCK) ON T3.SlNo = T1.ScaleId



        WHERE T0.IsDelete = 0 



          AND T0.MaterialId IN (@TopSoilId, @OBId) 



          AND T0.DestinationId != @DestinationCarpetingWorkId 



          AND CAST(T0.LoadingDate AS DATE) = @Date 



          AND T0.ShiftId = @ShiftId



        GROUP BY T1.EquipmentGroupId, T2.Name, T3.Name, T0.MaterialId, T0.QtyTrip



    )



    SELECT 



        T0.EquipmentGroupId,



        T0.EquipmentGroup,



        T0.Scale,



        ISNULL(T1.OverBurden, 0) AS OverBurden,



        ISNULL(T1.OverBurdenFactor, 0) AS OverBurdenFactor,



        ISNULL(T2.TopSoil, 0) AS TopSoil,



        ISNULL(T2.TopSoilFactor, 0) AS TopSoilFactor,



        ISNULL(T1.OverBurden, 0) + ISNULL(T2.TopSoil, 0) AS TotalTrip, 



        (ISNULL(T1.OverBurden, 0) * ISNULL(T1.OverBurdenFactor, 0)) + (ISNULL(T2.TopSoil, 0) * ISNULL(T2.TopSoilFactor, 0)) AS QtyBcm,



        0 AS MapioTrip,



        0 AS MapioQty,



        (0 - ISNULL(T1.OverBurden, 0) + ISNULL(T2.TopSoil, 0)) AS Diff



    FROM WasteHandlingTable T0



    OUTER APPLY (



        SELECT SUM(NoofTrip) AS OverBurden, QtyTrip AS OverBurdenFactor 



        FROM WasteHandlingTable 



        WHERE MaterialId = @OBId AND EquipmentGroupId = T0.EquipmentGroupId 



        GROUP BY QtyTrip



    ) T1



    OUTER APPLY (



        SELECT SUM(NoofTrip) AS TopSoil, QtyTrip AS TopSoilFactor 



        FROM WasteHandlingTable 



        WHERE MaterialId = @TopSoilId AND EquipmentGroupId = T0.EquipmentGroupId 



        GROUP BY QtyTrip



    ) T2



    GROUP BY T0.EquipmentGroupId, T0.EquipmentGroup, T0.Scale, T1.OverBurden, T1.OverBurdenFactor, T2.TopSoil, T2.TopSoilFactor;



    -- =============================================



    -- 2. Coal Production



    -- =============================================



    SELECT 



        *,



        CONVERT(DECIMAL(18,2), A.RomCoal * A.Factor) AS Qty,



        0 AS MapioTrip,



        0 AS MapioQty,



        (0 - (CONVERT(DECIMAL(18,2), A.RomCoal * A.Factor))) AS Diff  



    FROM (



        SELECT  



            T1.EquipmentGroupId,



            T2.Name AS EquipmentGroup,



            T0.MaterialId,



            SUM(T0.NoofTrip) AS RomCoal,



            T0.QtyTrip AS Factor



        FROM Trans.TblLoading T0 WITH(NOLOCK)



        JOIN Master.TblEquipment T1 WITH(NOLOCK) ON T1.SlNo = T0.HaulerEquipmentId



        JOIN Master.TblEquipmentGroup T2 WITH(NOLOCK) ON T2.SlNo = T1.EquipmentGroupId



        WHERE T0.IsDelete = 0 



          AND T0.MaterialId IN (@RomCoalId) 



          AND CAST(T0.LoadingDate AS DATE) = @Date 



          AND T0.ShiftId = @ShiftId



        GROUP BY T1.EquipmentGroupId, T2.Name, T0.MaterialId, T0.QtyTrip



    ) A;



-- =============================================



    -- 3. WP-3 Quantity



    -- =============================================



    -- CTE to ID Equipment in Sector 5



    ;WITH Sector5Equipment AS (



        SELECT DISTINCT EquipmentId



        FROM Trans.TblEquipmentReading WITH(NOLOCK)



        WHERE SectorId = 5



          AND CAST([Date] AS DATE) = @Date



          AND ShiftId = @ShiftId



          AND IsDelete = 0



    ),



    WP3Table AS ( 



        SELECT 



            T1.EquipmentGroupId,



            T2.Name AS EquipmentGroup,



            T3.Name AS Scale,



            T0.MaterialId,



            SUM(T0.NoofTrip) AS NoofTrip,



            T0.QtyTrip



        FROM Trans.TblLoading T0 WITH(NOLOCK)



        JOIN Master.TblEquipment T1 WITH(NOLOCK) ON T1.SlNo = T0.HaulerEquipmentId



        JOIN Master.TblEquipmentGroup T2 WITH(NOLOCK) ON T2.SlNo = T1.EquipmentGroupId



        JOIN Master.TblScale T3 WITH(NOLOCK) ON T3.SlNo = T1.ScaleId



        WHERE T0.IsDelete = 0



          -- Include Coal, OB, TopSoil



          AND T0.MaterialId IN (@TopSoilId, @OBId, @RomCoalId)



          -- Filter by Sector 5 Equipment

          AND T0.LoadingMachineEquipmentId IN (SELECT EquipmentId FROM Sector5Equipment)



          AND CAST(T0.LoadingDate AS DATE) = @Date 



          AND T0.ShiftId = @ShiftId



        GROUP BY T1.EquipmentGroupId, T2.Name, T3.Name, T0.MaterialId, T0.QtyTrip



    )



    SELECT 



        T0.EquipmentGroupId,



        T0.EquipmentGroup,



        T0.Scale,



        ISNULL(T1.OverBurden, 0) AS OverBurden,



        ISNULL(T1.OverBurdenFactor, 0) AS OverBurdenFactor,



        ISNULL(T2.TopSoil, 0) AS TopSoil,



        ISNULL(T2.TopSoilFactor, 0) AS TopSoilFactor,



        



        -- Coal Columns



        ISNULL(T3.Coal, 0) AS Coal,



        ISNULL(T3.CoalFactor, 0) AS CoalFactor,



        CONVERT(DECIMAL(18,2), ISNULL(T3.Coal, 0) * ISNULL(T3.CoalFactor, 0)) AS CoalQty,



        -- Totals



        ISNULL(T1.OverBurden, 0) + ISNULL(T2.TopSoil, 0) + ISNULL(T3.Coal, 0) AS TotalTrip,



        (ISNULL(T1.OverBurden, 0) * ISNULL(T1.OverBurdenFactor, 0)) + (ISNULL(T2.TopSoil, 0) * ISNULL(T2.TopSoilFactor, 0)) AS QtyBcm



        



    FROM WP3Table T0



    OUTER APPLY (



        SELECT SUM(NoofTrip) AS OverBurden, QtyTrip AS OverBurdenFactor 



        FROM WP3Table 



        WHERE MaterialId = @OBId AND EquipmentGroupId = T0.EquipmentGroupId 



        GROUP BY QtyTrip



    ) T1



    OUTER APPLY (



        SELECT SUM(NoofTrip) AS TopSoil, QtyTrip AS TopSoilFactor 



        FROM WP3Table 



        WHERE MaterialId = @TopSoilId AND EquipmentGroupId = T0.EquipmentGroupId 



        GROUP BY QtyTrip



    ) T2



    OUTER APPLY (



        SELECT SUM(NoofTrip) AS Coal, QtyTrip AS CoalFactor 



        FROM WP3Table 



        WHERE MaterialId = @RomCoalId AND EquipmentGroupId = T0.EquipmentGroupId 



        GROUP BY QtyTrip



    ) T3



    GROUP BY 



        T0.EquipmentGroupId, T0.EquipmentGroup, T0.Scale, 



        T1.OverBurden, T1.OverBurdenFactor, 



        T2.TopSoil, T2.TopSoilFactor,



        T3.Coal, T3.CoalFactor;



    -- =============================================



    -- 4. OB Rehandling/Carpeting Quantity



    -- =============================================



    SELECT 



        A.EquipmentGroupId,



        A.EquipmentGroup,



        SUM(A.Trip) AS Trip,



        A.Factor,



        CONVERT(DECIMAL(18,2), SUM(A.Trip * A.Factor)) AS Qty 



    FROM (



        SELECT  



            T1.EquipmentGroupId,



            T2.Name AS EquipmentGroup,



            SUM(T0.NoofTrip) AS Trip,



            T0.QtyTrip AS Factor



        FROM Trans.TblMaterialRehandling T0 WITH(NOLOCK)



        JOIN Master.TblEquipment T1 WITH(NOLOCK) ON T1.SlNo = T0.HaulerEquipmentId



        JOIN Master.TblEquipmentGroup T2 WITH(NOLOCK) ON T2.SlNo = T1.EquipmentGroupId



      WHERE T0.IsDelete = 0 



          AND T0.MaterialId IN (@ObRehandlingId) 



          AND CAST(T0.RehandlingDate AS DATE) = @Date 



          AND T0.ShiftId = @ShiftId



        GROUP BY T1.EquipmentGroupId, T2.Name, T0.QtyTrip



        



        UNION ALL



        



        SELECT  



            T1.EquipmentGroupId,



            T2.Name AS EquipmentGroup,



        SUM(T0.NoofTrip) AS Trip,



            T0.QtyTrip AS Factor



        FROM Trans.TblLoading T0 WITH(NOLOCK)



        JOIN Master.TblEquipment T1 WITH(NOLOCK) ON T1.SlNo = T0.HaulerEquipmentId



        JOIN Master.TblEquipmentGroup T2 WITH(NOLOCK) ON T2.SlNo = T1.EquipmentGroupId



        WHERE T0.DestinationId = @DestinationCarpetingWorkId 



          AND CAST(T0.LoadingDate AS DATE) = @Date 



          AND T0.ShiftId = @ShiftId



        GROUP BY T1.EquipmentGroupId, T2.Name, T0.QtyTrip



    ) A 



    GROUP BY A.EquipmentGroupId, A.EquipmentGroup, A.Factor;



    -- =============================================



    -- 5. Coal Rehandling Quantity



    -- =============================================



    SELECT 



        *,



        CONVERT(DECIMAL(18,2), A.Trip * A.Factor) AS Qty 



    FROM (



        SELECT  



            T1.EquipmentGroupId,



            T2.Name AS EquipmentGroup,



            T0.MaterialId,



            SUM(T0.NoofTrip) AS Trip,



            T0.QtyTrip AS Factor



        FROM Trans.TblMaterialRehandling T0 WITH(NOLOCK)



        JOIN Master.TblEquipment T1 WITH(NOLOCK) ON T1.SlNo = T0.HaulerEquipmentId



        JOIN Master.TblEquipmentGroup T2 WITH(NOLOCK) ON T2.SlNo = T1.EquipmentGroupId



        WHERE T0.IsDelete = 0 



          AND T0.MaterialId IN (@RomCoalId) 



          AND CAST(T0.RehandlingDate AS DATE) = @Date 



          AND T0.ShiftId = @ShiftId



        GROUP BY T1.EquipmentGroupId, T2.Name, T0.MaterialId, T0.QtyTrip



    ) A;



        



    -- =============================================



    -- 6. Header Info



    -- =============================================



    ;WITH CTE_Incharges AS (



        SELECT ShiftInchargeId AS OperatorId, 'Large' AS Type



        FROM Trans.TblLoading WITH(NOLOCK)



        WHERE IsDelete = 0 AND CAST(LoadingDate AS DATE) = @Date AND ShiftId = @ShiftId AND ShiftInchargeId IS NOT NULL



        UNION



        SELECT MidScaleInchargeId AS OperatorId, 'Mid' AS Type



        FROM Trans.TblLoading WITH(NOLOCK)



        WHERE IsDelete = 0 AND CAST(LoadingDate AS DATE) = @Date AND ShiftId = @ShiftId AND MidScaleInchargeId IS NOT NULL



        UNION



        SELECT ShiftInchargeId AS OperatorId, 'Large' AS Type



        FROM Trans.TblMaterialRehandling WITH(NOLOCK)



        WHERE IsDelete = 0 AND CAST(RehandlingDate AS DATE) = @Date AND ShiftId = @ShiftId AND ShiftInchargeId IS NOT NULL



        UNION



        SELECT MidScaleInchargeId AS OperatorId, 'Mid' AS Type



        FROM Trans.TblMaterialRehandling WITH(NOLOCK)



        WHERE IsDelete = 0 AND CAST(RehandlingDate AS DATE) = @Date AND ShiftId = @ShiftId AND MidScaleInchargeId IS NOT NULL



    ),



    CTE_Relays AS (



        SELECT DISTINCT RelayId FROM Trans.TblLoading WITH(NOLOCK) WHERE IsDelete = 0 AND CAST(LoadingDate AS DATE) = @Date AND ShiftId = @ShiftId AND RelayId IS NOT NULL



        UNION



        SELECT DISTINCT RelayId FROM Trans.TblMaterialRehandling WITH(NOLOCK) WHERE IsDelete = 0 AND CAST(RehandlingDate AS DATE) = @Date AND ShiftId = @ShiftId AND RelayId IS NOT NULL



    )



    SELECT 



        (



            STUFF(



                (



                    SELECT ', ' + O.OperatorName + '(Large Scale)'



                    FROM (SELECT DISTINCT OperatorId FROM CTE_Incharges WHERE Type = 'Large') X



                    JOIN Master.TblOperator O WITH(NOLOCK) ON X.OperatorId = O.SlNo



                    FOR XML PATH('')



                ), 1, 2, ''



            )



            + 



            CASE 



                WHEN EXISTS(SELECT 1 FROM CTE_Incharges WHERE Type = 'Large') AND EXISTS(SELECT 1 FROM CTE_Incharges WHERE Type = 'Mid') THEN ', ' 



                ELSE '' 



            END



            +



            ISNULL(STUFF(



                (



                    SELECT ', ' + O.OperatorName + '(Mid Scale)'



                    FROM (SELECT DISTINCT OperatorId FROM CTE_Incharges WHERE Type = 'Mid') X



                    JOIN Master.TblOperator O WITH(NOLOCK) ON X.OperatorId = O.SlNo



            FOR XML PATH('')



                ), 1, 2, ''



            ), '')



        ) AS ShiftIncharge,



        



        (SELECT STRING_AGG(R.Name, ', ') FROM CTE_Relays CR JOIN Master.TblRelay R WITH(NOLOCK) ON CR.RelayId = R.SlNo) AS Relay,



        (SELECT TOP 1 ShiftName FROM Master.TblShift WITH(NOLOCK) WHERE SlNo = @ShiftId) AS ShiftName,



        FORMAT(@Date, 'dd-MMM-yyyy') AS Date,



        '' AS Logo;



END



