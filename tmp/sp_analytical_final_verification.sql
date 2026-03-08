CREATE   PROCEDURE [dbo].[PMS2_New_Dash_SP_GetAnalyticalStats]

                                                                                                                                                                                               

    @FromDate DATE,

                                                                                                                                                                                                                                          

    @ToDate DATE

                                                                                                                                                                                                                                             

AS

                                                                                                                                                                                                                                                           

BEGIN

                                                                                                                                                                                                                                                        

    SET NOCOUNT ON;

                                                                                                                                                                                                                                          

    

                                                                                                                                                                                                                                                         

    DECLARE @StartOfMonth DATE = DATEFROMPARTS(YEAR(@ToDate), MONTH(@ToDate), 1);

                                                                                                                                                                            

    DECLARE @StartOfYear DATE = DATEFROMPARTS(YEAR(@ToDate), 1, 1);

                                                                                                                                                                                          

    

                                                                                                                                                                                                                                                         

    DECLARE @DayOfMonth INT = DAY(@ToDate);

                                                                                                                                                                                                                  

    IF @DayOfMonth = 0 SET @DayOfMonth = 1;

                                                                                                                                                                                                                  



                                                                                                                                                                                                                                                             

    -- =============================================

                                                                                                                                                                                                         

    -- 1. KPIs & Details Preparation

                                                                                                                                                                                                                         

    -- =============================================

                                                                                                              

    CREATE TABLE #Stats (

                                                                                                                                                                                                                                    

        SectionId VARCHAR(50),

                                                                                                                                                                                                                               

        Category VARCHAR(100),

                                                                                                                                                                                                                               

        Date DATE,

                                                                                                                                                                                                                                           

        Qty DECIMAL(18,2)

                                                                                                                                                                                                                                    

    );

                                                                                                                                                                                                                                                       



                                                                                                                                                                                                                                                             

    -- Insert Coal Prod (MaterialId = 7)

    INSERT INTO #Stats (SectionId, Category, Date, Qty)

    SELECT 'coal_prod', ISNULL(S.SectorName, '-'), CAST(L.LoadingDate AS DATE), ISNULL(L.TotalQty, 0)

    FROM Trans.TblLoading L WITH(NOLOCK)

    JOIN [Master].TblShift T1 WITH(NOLOCK) on T1.SlNo=L.ShiftId

    JOIN [Master].TblSource T2 WITH(NOLOCK) on T2.SlNo=L.SourceId

    JOIN [Master].TblDestination T3 WITH(NOLOCK) on T3.SlNo=L.DestinationId

    JOIN [Master].TblEquipment T4 WITH(NOLOCK) on T4.SlNo=L.HaulerEquipmentId

    JOIN [Master].TblEquipment T5 WITH(NOLOCK) on T5.SlNo=L.LoadingMachineEquipmentId

    JOIN [Master].TblMaterial T6 WITH(NOLOCK) on T6.SlNo=L.MaterialId

    JOIN [Master].TblScale T7 WITH(NOLOCK) on T7.SlNo=T4.ScaleId

    JOIN [Master].TblRelay T8 WITH(NOLOCK) on T8.SlNo=L.RelayId

    JOIN [Master].TblEquipmentGroup T9 WITH(NOLOCK) on T9.SlNo=T4.EquipmentGroupId

    JOIN [Master].TblEquipmentGroup T10 WITH(NOLOCK) on T10.SlNo=T5.EquipmentGroupId

    LEFT JOIN (

        SELECT DISTINCT 

            ER.EquipmentId, 

            CAST(ER.Date AS DATE) AS Date, 

            ER.ShiftId, 

            ER.SectorId

        FROM Trans.TblEquipmentReading ER WITH(NOLOCK)

        WHERE CAST(ER.Date AS DATE) <= @ToDate 

          AND YEAR(ER.Date) = YEAR(@ToDate)

          AND ER.IsDelete = 0

    ) ER ON L.LoadingMachineEquipmentId = ER.EquipmentId 

        AND CAST(L.LoadingDate AS DATE) = ER.Date 

        AND L.ShiftId = ER.ShiftId 

    LEFT JOIN Master.TblSector S WITH(NOLOCK) ON ER.SectorId = S.SlNo

    WHERE L.IsDelete = 0 

      AND L.MaterialId = 7 

      AND CAST(L.LoadingDate AS DATE) <= @ToDate 

      AND YEAR(L.LoadingDate) = YEAR(@ToDate);



    -- Insert OB Removal (MaterialId IN (1, 2))

    INSERT INTO #Stats (SectionId, Category, Date, Qty)

    SELECT 'ob_rem', ISNULL(S.SectorName, '-'), CAST(L.LoadingDate AS DATE), ISNULL(L.TotalQty, 0)

    FROM Trans.TblLoading L WITH(NOLOCK)

    JOIN [Master].TblShift T1 WITH(NOLOCK) on T1.SlNo=L.ShiftId

    JOIN [Master].TblSource T2 WITH(NOLOCK) on T2.SlNo=L.SourceId

    JOIN [Master].TblDestination T3 WITH(NOLOCK) on T3.SlNo=L.DestinationId

    JOIN [Master].TblEquipment T4 WITH(NOLOCK) on T4.SlNo=L.HaulerEquipmentId

    JOIN [Master].TblEquipment T5 WITH(NOLOCK) on T5.SlNo=L.LoadingMachineEquipmentId

    JOIN [Master].TblMaterial T6 WITH(NOLOCK) on T6.SlNo=L.MaterialId

    JOIN [Master].TblScale T7 WITH(NOLOCK) on T7.SlNo=T4.ScaleId

    JOIN [Master].TblRelay T8 WITH(NOLOCK) on T8.SlNo=L.RelayId

    JOIN [Master].TblEquipmentGroup T9 WITH(NOLOCK) on T9.SlNo=T4.EquipmentGroupId

    JOIN [Master].TblEquipmentGroup T10 WITH(NOLOCK) on T10.SlNo=T5.EquipmentGroupId

    LEFT JOIN (

        SELECT DISTINCT 

            ER.EquipmentId, 

            CAST(ER.Date AS DATE) AS Date, 

            ER.ShiftId, 

            ER.SectorId

        FROM Trans.TblEquipmentReading ER WITH(NOLOCK)

        WHERE CAST(ER.Date AS DATE) <= @ToDate 

          AND YEAR(ER.Date) = YEAR(@ToDate)

          AND ER.IsDelete = 0

    ) ER ON L.LoadingMachineEquipmentId = ER.EquipmentId 

        AND CAST(L.LoadingDate AS DATE) = ER.Date 

        AND L.ShiftId = ER.ShiftId 

    LEFT JOIN Master.TblSector S WITH(NOLOCK) ON ER.SectorId = S.SlNo

    WHERE L.IsDelete = 0 

      AND L.MaterialId IN (1, 2) 

      AND CAST(L.LoadingDate AS DATE) <= @ToDate 

      AND YEAR(L.LoadingDate) = YEAR(@ToDate);

                                                                                                                      



                                                                                                                                                                                                                                                             

    -- Insert Crushing

                                                                                                                                                                                                                                       

    INSERT INTO #Stats (SectionId, Category, Date, Qty)

                                                                                                                                                                                                      

    SELECT 'crushing', 'Plant ' + CAST(ISNULL(C.PlantId, 0) AS VARCHAR), CAST(C.Date AS DATE), C.ProductionQty

                                                                                                                                               

    FROM Trans.TblCrusher C WITH(NOLOCK)

                                                                                                                                                                                                                     

    WHERE C.IsDelete = 0 AND CAST(C.Date AS DATE) <= @ToDate AND YEAR(C.Date) = YEAR(@ToDate);

                                                                                                                                                               



                                                                                                                                                                                                                                                             

    -- Insert Dispatch (Using Master.TblLocation)

                                                                                                                                                                                                            

    INSERT INTO #Stats (SectionId, Category, Date, Qty)

                                                                                                                                                                                                      

    SELECT 'dispatch', ISNULL(L.LocationName, 'Unknown'), CAST(D.Date AS DATE), D.TotalQty

                                         

    FROM Trans.TblDispatchEntry D WITH(NOLOCK)

                                                                                                                                                                                                               

    LEFT JOIN Master.TblLocation L WITH(NOLOCK) ON D.DispatchLocationId = L.SlNo

                                                                                                                                                                             

    WHERE D.IsDelete = 0 AND CAST(D.Date AS DATE) <= @ToDate AND YEAR(D.Date) = YEAR(@ToDate);

                                                                                                                                                               



                                                                                                                                                                                                                                                             

    -- Insert Coal Rehandling

                                                                                                                                                                                                                                

    INSERT INTO #Stats (SectionId, Category, Date, Qty)

                                                                                                                                                                                                      

    SELECT 'coal_re', 'Rehandling', CAST(R.RehandlingDate AS DATE), R.TotalQty

                                                                                                                                                                               

    FROM Trans.TblMaterialRehandling R WITH(NOLOCK)

                                                                                                                                                                                                          

    WHERE R.IsDelete = 0 AND R.MaterialId = 7 AND CAST(R.RehandlingDate AS DATE) <= @ToDate AND YEAR(R.RehandlingDate) = YEAR(@ToDate);

                                                                                                                      



                                                                                                                                                                                                                                                             

    -- Insert OB Rehandling

                                                                                                                                                                                                                                  

    INSERT INTO #Stats (SectionId, Category, Date, Qty)

                                                                                                                                                                                                      

    SELECT 'ob_re', 'Rehandling', CAST(R.RehandlingDate AS DATE), R.TotalQty

                                                                                                                                                                                 

    FROM Trans.TblMaterialRehandling R WITH(NOLOCK)

                                                                                                                                                                                                          

    WHERE R.IsDelete = 0 AND R.MaterialId = 5 AND CAST(R.RehandlingDate AS DATE) <= @ToDate AND YEAR(R.RehandlingDate) = YEAR(@ToDate);

                                                                                                                      



                                                                                                                                                         

    -- =============================================

                                                                                                                                                                                                         

    -- OUTPUT 1: KPIs

                                                                                                                                                                                                                                        

    -- =============================================

                                                                                                                                                                                                         

    SELECT 

                                                                                                                                                                                                                                                  

        SectionId,

                                                                                                                                                                                                                                           

        SUM(CASE WHEN Date = @ToDate THEN Qty ELSE 0 END) AS FTD,

                                                                                                                                                                                            

        SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) AS MTD,

                                                                                                                                                                 

        CAST(SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) / NULLIF(@DayOfMonth, 0) AS DECIMAL(18,2)) AS Avg,

                                                                                                                 

        SUM(CASE WHEN Date >= @StartOfYear AND Date <= @ToDate THEN Qty ELSE 0 END) AS YTD

                                                                                                                                                                   

    FROM #Stats

                                                                                                                                                                                                                                              

    GROUP BY SectionId;

                                                                                                                                                                                                                                      



                                                                                                                                                                                                                                                             

    -- =============================================

                                                                                                                                                                                                         

    -- OUTPUT 2: Details

                                                                                                                                                                                                                                     

    -- =============================================

        

    SELECT 

                                                                                                                                                                                                                                                  

        SectionId,

                                                                                                                                                                                                                                           

        Category,

                                                                                                                                                                                                                                            

        SUM(CASE WHEN Date = @ToDate THEN Qty ELSE 0 END) AS FTD,

                                                                                                                                                                                            

        SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) AS MTD,

                                                                                                                                                                 

        CAST(SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) / NULLIF(@DayOfMonth, 0) AS DECIMAL(18,2)) AS Avg,

                                                                                                                 

        SUM(CASE WHEN Date >= @StartOfYear AND Date <= @ToDate THEN Qty ELSE 0 END) AS YTD,

                                                                                                                                                                  

        0 AS IsTotal

                                                                                                                                                                                                                                         

    FROM #Stats

                                                                                                                                                                                                                                              

    GROUP BY SectionId, Category

                                                                                                                                                                                                                             

    UNION ALL

                                                                                                                                                                                                                                                

    SELECT 

                                                                                                                                                                                                                                                  

        SectionId,

                                                                                                                                                                                                                                           

        'Total' AS Category,

                                                                                                                                                                                                                                 

        SUM(CASE WHEN Date = @ToDate THEN Qty ELSE 0 END) AS FTD,

                                                                                                                                                                                            

        SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) AS MTD,

                                                                                                                        

        CAST(SUM(CASE WHEN Date >= @StartOfMonth AND Date <= @ToDate THEN Qty ELSE 0 END) / NULLIF(@DayOfMonth, 0) AS DECIMAL(18,2)) AS Avg,

                                                                                                                 

        SUM(CASE WHEN Date >= @StartOfYear AND Date <= @ToDate THEN Qty ELSE 0 END) AS YTD,

                                                                                                                                                                  

        1 AS IsTotal

                                                                                                                                                                                                                                         

    FROM #Stats

                                                                                                                                                                                                                                              

    GROUP BY SectionId;

                                                                                                                                                                                                                                      



                                                                                                                                                                                                                                                             

    -- =============================================

                                                                                                                                                                                                         

    -- Chart Data Prep

                                                                                                                                                                                                                                       

    -- =============================================

                                                                                                                                                                                                         

    -- 3. Hauling Chart

    SELECT TOP 10

        E.EquipmentName,

        CAST(SUM(ISNULL(L.NoofTrip, 0)) AS DECIMAL(18,2)) / NULLIF(SUM(ISNULL(R.TotalWorkingHr, 0)), 0) as Productivity, 

        CAST(SUM(ISNULL(R.TotalWorkingHr, 0)) AS DECIMAL(18,2)) as WorkingHours,

        'Hauling' as Type

    FROM Trans.TblEquipmentReading R WITH(NOLOCK)

    JOIN Master.TblEquipment E WITH(NOLOCK) ON R.EquipmentId = E.SlNo 

    LEFT JOIN Trans.TblLoading L WITH(NOLOCK) ON L.HaulerEquipmentId = E.SlNo 

               AND CAST(L.LoadingDate AS DATE) = CAST(R.Date AS DATE)

               AND L.ShiftId = R.ShiftId

               AND L.IsDelete = 0

    WHERE R.IsDelete = 0

      AND R.ActivityId = 4 -- Hauling Activity

      AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate

      AND E.IsDelete = 0

    GROUP BY E.EquipmentName

    HAVING SUM(ISNULL(L.NoofTrip, 0)) > 0 OR SUM(ISNULL(R.TotalWorkingHr, 0)) > 0

                                                                                                                                                                            

    ORDER BY Productivity DESC;

                                                                                                                                                                                                                              



                                                 

    -- 4. Loading Chart

    SELECT TOP 10

        E.EquipmentName,

        CAST(SUM(ISNULL(L.TotalQty, 0)) AS DECIMAL(18,2)) / NULLIF(SUM(ISNULL(R.TotalWorkingHr, 0)), 0) as Productivity, 

        CAST(SUM(ISNULL(R.TotalWorkingHr, 0)) AS DECIMAL(18,2)) as WorkingHours,

        'Loading' as Type

    FROM Trans.TblEquipmentReading R WITH(NOLOCK)

    JOIN Master.TblEquipment E WITH(NOLOCK) ON R.EquipmentId = E.SlNo 

    LEFT JOIN Trans.TblLoading L WITH(NOLOCK) ON L.LoadingMachineEquipmentId = E.SlNo 

               AND CAST(L.LoadingDate AS DATE) = CAST(R.Date AS DATE)

               AND L.ShiftId = R.ShiftId

               AND L.IsDelete = 0

    WHERE R.IsDelete = 0

      AND R.ActivityId = 3 -- Loading Activity

      AND CAST(R.Date AS DATE) BETWEEN @FromDate AND @ToDate

      AND E.IsDelete = 0

    GROUP BY E.EquipmentName

    HAVING SUM(ISNULL(L.TotalQty, 0)) > 0 OR SUM(ISNULL(R.TotalWorkingHr, 0)) > 0

                                                                                                                                                                            

    ORDER BY Productivity DESC;

                                                                                                                                                                                                                              



                                                                                                                                                                                                                                                             

    DROP TABLE #Stats;

                                                                                                                                                                                                                                       

END

                                                                                                                                                                                                                                                          

