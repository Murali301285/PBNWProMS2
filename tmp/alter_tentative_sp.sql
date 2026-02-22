ALTER PROCEDURE [dbo].[PMS2_New_Sp_TentativeProductionQty]
    @Date DATE,
    @ShiftId INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OBId int=2,@TopSoilId int=1,@RomCoalId int=7,@ObRehandlingId int=5,@DestinationDumpB int=2,@DestinationCarpetingWorkId int=10;

    -- 1. Waste Handling
    WITH WasteHandlingTable As( 
        select T1.EquipmentGroupId,T2.Name as EquipmentGroup,T3.Name as Scale,T0.MaterialId,SUM(T0.NoofTrip) AS NoofTrip,T0.QtyTrip
        from Trans.TblLoading T0 WITH(NOLOCK)
        Join Master.TblEquipment T1 WITH(NOLOCK) on T1.SlNo=T0.HaulerEquipmentId
        Join Master.TblEquipmentGroup T2 WITH(NOLOCK) on T2.SlNo=T1.EquipmentGroupId
        Join Master.TblScale T3 WITH(NOLOCK) on T3.SlNo=T1.ScaleId
        Where T0.IsDelete =0 AND T0.MaterialId in (@TopSoilId,@OBId) and T0.DestinationId!=@DestinationCarpetingWorkId and CAST(T0.LoadingDate as Date)=@Date and T0.ShiftId=@ShiftId
        group by T1.EquipmentGroupId,T2.Name,T3.Name,T0.MaterialId,T0.QtyTrip
    )
    select T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,
    ISNULL(T1.OverBurden,0) as OverBurden,ISNULL(T1.OverBurdenFactor,0) as OverBurdenFactor,
    ISNULL(T2.TopSoil,0) AS TopSoil ,ISNULL(T2.TopSoilFactor,0) AS TopSoilFactor,
    ISNULL(T1.OverBurden,0)+ISNULL(T2.TopSoil,0) as TotalTrip, (ISNULL(T1.OverBurden,0)*ISNULL(T1.OverBurdenFactor,0))+(ISNULL(T2.TopSoil,0)*ISNULL(T2.TopSoilFactor,0)) as QtyBcm,
    0 as MapioTrip,0 as MapioQty,(0-ISNULL(T1.OverBurden,0)+ISNULL(T2.TopSoil,0)) as Diff
    from WasteHandlingTable T0
    Outer apply (select SUM(NoofTrip) as OverBurden,QtyTrip as OverBurdenFactor from WasteHandlingTable where MaterialId=@OBId and EquipmentGroupId=T0.EquipmentGroupId group by QtyTrip) T1
    Outer apply (select SUM(NoofTrip) as TopSoil,QtyTrip as TopSoilFactor from WasteHandlingTable where MaterialId=@TopSoilId and EquipmentGroupId=T0.EquipmentGroupId group by QtyTrip) T2
    group by T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,T1.OverBurden,T1.OverBurdenFactor,T2.TopSoil,T2.TopSoilFactor;

    -- 2. Coal Production
    select *,Convert(decimal(18,2), A.RomCoal*A.Factor) as Qty,0 as MapioTrip,0 as MapioQty,(0-(Convert(decimal(18,2), A.RomCoal*A.Factor))) as Diff  from (
    select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,T0.MaterialId,SUM(T0.NoofTrip) AS RomCoal,T0.QtyTrip as Factor
    from Trans.TblLoading T0 WITH(NOLOCK)
    Join Master.TblEquipment T1 WITH(NOLOCK) on T1.SlNo=T0.HaulerEquipmentId
    Join Master.TblEquipmentGroup T2 WITH(NOLOCK) on T2.SlNo=T1.EquipmentGroupId
    Where T0.IsDelete=0 and T0.MaterialId in (@RomCoalId) and CAST(T0.LoadingDate as Date)=@Date and T0.ShiftId=@ShiftId
    group by T1.EquipmentGroupId,T2.Name,T0.MaterialId,T0.QtyTrip) A;

    -- 3. WP-3 Quantity (Modified with SectorId=5 and Coal)
    -- CTE to ID Equipment in Sector 5
    ;WITH Sector5Equipment AS (
        SELECT DISTINCT EquipmentId
        FROM Trans.TblEquipmentReading WITH(NOLOCK)
        WHERE SectorId = 5
          AND CAST([Date] AS DATE) = @Date
          AND ShiftId = @ShiftId
          AND IsDelete = 0
    ),
    WP3Table As( 
        select 
            T1.EquipmentGroupId,
            T2.Name as EquipmentGroup,
            T3.Name as Scale,
            T0.MaterialId,
            SUM(T0.NoofTrip) AS NoofTrip,
            T0.QtyTrip
        from Trans.TblLoading T0 WITH(NOLOCK)
        Join Master.TblEquipment T1 WITH(NOLOCK) on T1.SlNo=T0.HaulerEquipmentId
        Join Master.TblEquipmentGroup T2 WITH(NOLOCK) on T2.SlNo=T1.EquipmentGroupId
        Join Master.TblScale T3 WITH(NOLOCK) on T3.SlNo=T1.ScaleId
        Where T0.IsDelete = 0
          -- Include Coal, OB, TopSoil
          AND T0.MaterialId in (@TopSoilId, @OBId, @RomCoalId)
          -- Filter by Sector 5 Equipment
          AND T0.HaulerEquipmentId IN (SELECT EquipmentId FROM Sector5Equipment)
          AND CAST(T0.LoadingDate as Date)=@Date and T0.ShiftId=@ShiftId
        group by T1.EquipmentGroupId, T2.Name, T3.Name, T0.MaterialId, T0.QtyTrip
    )
    select 
        T0.EquipmentGroupId,
        T0.EquipmentGroup,
        T0.Scale,
        ISNULL(T1.OverBurden,0) as OverBurden,
        ISNULL(T1.OverBurdenFactor,0) as OverBurdenFactor,
        ISNULL(T2.TopSoil,0) AS TopSoil,
        ISNULL(T2.TopSoilFactor,0) AS TopSoilFactor,
        
        -- New Coal Columns
        ISNULL(T3.Coal, 0) AS Coal,
        ISNULL(T3.CoalFactor, 0) AS CoalFactor,
        CONVERT(DECIMAL(18,2), ISNULL(T3.Coal, 0) * ISNULL(T3.CoalFactor, 0)) AS CoalQty,

        -- Totals
        ISNULL(T1.OverBurden,0) + ISNULL(T2.TopSoil,0) + ISNULL(T3.Coal,0) as TotalTrip,
        (ISNULL(T1.OverBurden,0)*ISNULL(T1.OverBurdenFactor,0)) + (ISNULL(T2.TopSoil,0)*ISNULL(T2.TopSoilFactor,0)) as QtyBcm
        
    from WP3Table T0
    Outer apply (select SUM(NoofTrip) as OverBurden,QtyTrip as OverBurdenFactor from WP3Table where MaterialId=@OBId and EquipmentGroupId=T0.EquipmentGroupId group by QtyTrip) T1
    Outer apply (select SUM(NoofTrip) as TopSoil,QtyTrip as TopSoilFactor from WP3Table where MaterialId=@TopSoilId and EquipmentGroupId=T0.EquipmentGroupId group by QtyTrip) T2
    Outer apply (select SUM(NoofTrip) as Coal,QtyTrip as CoalFactor from WP3Table where MaterialId=@RomCoalId and EquipmentGroupId=T0.EquipmentGroupId group by QtyTrip) T3
    group by 
        T0.EquipmentGroupId, T0.EquipmentGroup, T0.Scale, 
        T1.OverBurden, T1.OverBurdenFactor, 
        T2.TopSoil, T2.TopSoilFactor,
        T3.Coal, T3.CoalFactor;

    -- 4. OB Rehandling/Carpeting Quantity
    select A.EquipmentGroupId,A.EquipmentGroup,SUM(A.Trip) as Trip,A.Factor,Convert(decimal(18,2),SUM(A.Trip*A.Factor)) as Qty from (
    select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,SUM(T0.NoofTrip) AS Trip,T0.QtyTrip as Factor
    from Trans.TblMaterialRehandling T0 WITH(NOLOCK)
    Join Master.TblEquipment T1 WITH(NOLOCK) on T1.SlNo=T0.HaulerEquipmentId
    Join Master.TblEquipmentGroup T2 WITH(NOLOCK) on T2.SlNo=T1.EquipmentGroupId
    Where T0.IsDelete=0 and T0.MaterialId in (@ObRehandlingId) and CAST(T0.RehandlingDate as Date)=@Date and T0.ShiftId=@ShiftId
    group by T1.EquipmentGroupId,T2.Name,T0.QtyTrip
    Union all
    select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,SUM(T0.NoofTrip) AS Trip,T0.QtyTrip as Factor
    from Trans.TblLoading T0 WITH(NOLOCK)
    Join Master.TblEquipment T1 WITH(NOLOCK) on T1.SlNo=T0.HaulerEquipmentId
    Join Master.TblEquipmentGroup T2 WITH(NOLOCK) on T2.SlNo=T1.EquipmentGroupId
    Where T0.DestinationId=@DestinationCarpetingWorkId and CAST(T0.LoadingDate as Date)=@Date and T0.ShiftId=@ShiftId
    group by T1.EquipmentGroupId,T2.Name,T0.QtyTrip
    ) A group by A.EquipmentGroupId,A.EquipmentGroup,A.Factor;

    -- 5. Coal Rehandling Quantity
    select *,Convert(decimal(18,2),A.Trip*A.Factor) as Qty from (
    select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,T0.MaterialId,SUM(T0.NoofTrip) AS Trip,T0.QtyTrip as Factor
    from Trans.TblMaterialRehandling T0 WITH(NOLOCK)
    Join Master.TblEquipment T1 WITH(NOLOCK) on T1.SlNo=T0.HaulerEquipmentId
    Join Master.TblEquipmentGroup T2 WITH(NOLOCK) on T2.SlNo=T1.EquipmentGroupId
    Where T0.IsDelete=0 and T0.MaterialId in (@RomCoalId) and CAST(T0.RehandlingDate as Date)=@Date and T0.ShiftId=@ShiftId
    group by T1.EquipmentGroupId,T2.Name,T0.MaterialId,T0.QtyTrip) A;
        
    -- 6. Header Info (Updated Logic)
    WITH CTE_Incharges AS (
        SELECT ShiftInchargeId AS OperatorId, 'Large' AS Type
        FROM Trans.TblLoading WITH(NOLOCK)
        WHERE IsDelete=0 AND CAST(LoadingDate AS DATE)=@Date AND ShiftId=@ShiftId AND ShiftInchargeId IS NOT NULL
        UNION
        SELECT MidScaleInchargeId AS OperatorId, 'Mid' AS Type
        FROM Trans.TblLoading WITH(NOLOCK)
        WHERE IsDelete=0 AND CAST(LoadingDate AS DATE)=@Date AND ShiftId=@ShiftId AND MidScaleInchargeId IS NOT NULL
        UNION
        SELECT ShiftInchargeId AS OperatorId, 'Large' AS Type
        FROM Trans.TblMaterialRehandling WITH(NOLOCK)
        WHERE IsDelete=0 AND CAST(RehandlingDate AS DATE)=@Date AND ShiftId=@ShiftId AND ShiftInchargeId IS NOT NULL
        UNION
        SELECT MidScaleInchargeId AS OperatorId, 'Mid' AS Type
        FROM Trans.TblMaterialRehandling WITH(NOLOCK)
        WHERE IsDelete=0 AND CAST(RehandlingDate AS DATE)=@Date AND ShiftId=@ShiftId AND MidScaleInchargeId IS NOT NULL
    ),
    CTE_Relays AS (
        SELECT DISTINCT RelayId FROM Trans.TblLoading WITH(NOLOCK) WHERE IsDelete=0 AND CAST(LoadingDate AS DATE)=@Date AND ShiftId=@ShiftId AND RelayId IS NOT NULL
        UNION
        SELECT DISTINCT RelayId FROM Trans.TblMaterialRehandling WITH(NOLOCK) WHERE IsDelete=0 AND CAST(RehandlingDate AS DATE)=@Date AND ShiftId=@ShiftId AND RelayId IS NOT NULL
    )
    SELECT 
        (
            STUFF(
                (
                    SELECT ', ' + O.OperatorName + '(Large Scale)'
                    FROM (SELECT DISTINCT OperatorId FROM CTE_Incharges WHERE Type='Large') X
                    JOIN Master.TblOperator O WITH(NOLOCK) ON X.OperatorId = O.SlNo
                    FOR XML PATH('')
                ), 1, 2, ''
            )
            + 
            CASE 
                WHEN EXISTS(SELECT 1 FROM CTE_Incharges WHERE Type='Large') AND EXISTS(SELECT 1 FROM CTE_Incharges WHERE Type='Mid') THEN ', ' 
                ELSE '' 
            END
            +
            ISNULL(STUFF(
                (
                    SELECT ', ' + O.OperatorName + '(Mid Scale)'
                    FROM (SELECT DISTINCT OperatorId FROM CTE_Incharges WHERE Type='Mid') X
                    JOIN Master.TblOperator O WITH(NOLOCK) ON X.OperatorId = O.SlNo
                    FOR XML PATH('')
                ), 1, 2, ''
            ), '')
        ) AS ShiftIncharge,
        
        (SELECT STRING_AGG(R.Name, ', ') FROM CTE_Relays CR JOIN Master.TblRelay R WITH(NOLOCK) ON CR.RelayId = R.SlNo) AS Relay,
        (Select TOP 1 ShiftName from Master.TblShift WITH(NOLOCK) where SlNo=@ShiftId) as ShiftName,
        FORMAT(@Date,'dd-MMM-yyyy') as Date,
        '' as Logo;

END
