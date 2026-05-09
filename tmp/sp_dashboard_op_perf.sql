
CREATE   PROCEDURE [dbo].[PMS2_New_Dash_SP_Performance_OperatorPerformance]
    @FromDate DATE,
    @ToDate DATE,
    @Model VARCHAR(100) = NULL,
    @Capacity VARCHAR(100) = NULL,
    @ShiftId INT = NULL,
    @ActivityType VARCHAR(20) = 'Both' -- 'Loading', 'Hauling', 'Both'
AS
BEGIN
    SET NOCOUNT ON;

    -- Store aggregated data
    CREATE TABLE #OpPerf (
        Type VARCHAR(20),
        OperatorName VARCHAR(200),
        OperatorId VARCHAR(50),
        Equipment VARCHAR(200),
        Model VARCHAR(100),
        Capacity VARCHAR(100),
        Date DATE,
        ShiftId INT,
        Trip INT,
        Qty DECIMAL(18,2),
        Hrs DECIMAL(18,2)
    )

    IF @ActivityType IN ('Both', 'Loading')
    BEGIN
        INSERT INTO #OpPerf
        SELECT 
            'Loading' AS Type,
            O.OperatorName,
            CAST(O.OperatorId AS VARCHAR(50)),
            E.EquipmentName AS Equipment,
            E.Model,
            E.Capacity,
            L.LoadingDate,
            L.ShiftId,
            SUM(L.NoofTrip) AS Trip,
            SUM(CASE 
                WHEN Mt.MaterialName IN ('ROM COAL') THEN L.TotalQty / 1.55 
                WHEN Mt.MaterialName IN ('OB', 'OVER BURDEN') THEN L.TotalQty 
                ELSE 0 
            END) AS Qty,
            MAX(ER.TotalWorkingHr) AS Hrs
        FROM Trans.TblLoading L WITH(NOLOCK)
        JOIN Trans.TblEquipmentReading ER WITH(NOLOCK) 
            ON L.LoadingMachineEquipmentId = ER.EquipmentId 
            AND L.LoadingDate = ER.Date 
            AND L.ShiftId = ER.ShiftId
            AND ER.ActivityId = 3 
        JOIN Master.TblOperator O WITH(NOLOCK) ON ER.OperatorId = O.SlNo
        JOIN Master.TblEquipment E WITH(NOLOCK) ON L.LoadingMachineEquipmentId = E.SlNo
        LEFT JOIN Master.TblMaterial Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
        WHERE L.IsDelete = 0 
          AND L.LoadingDate BETWEEN @FromDate AND @ToDate
          AND (@Model IS NULL OR E.Model = @Model)
          AND (@Capacity IS NULL OR E.Capacity = @Capacity)
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
        GROUP BY O.OperatorName, O.OperatorId, E.EquipmentName, E.Model, E.Capacity, L.LoadingDate, L.ShiftId
    END

    IF @ActivityType IN ('Both', 'Hauling')
    BEGIN
        INSERT INTO #OpPerf
        SELECT 
            'Hauling' AS Type,
            O.OperatorName,
            CAST(O.OperatorId AS VARCHAR(50)),
            E.EquipmentName AS Equipment,
            E.Model,
            E.Capacity,
            L.LoadingDate,
            L.ShiftId,
            SUM(L.NoofTrip) AS Trip,
            SUM(CASE 
                WHEN Mt.MaterialName IN ('ROM COAL') THEN L.TotalQty / 1.55 
                WHEN Mt.MaterialName IN ('OB', 'OVER BURDEN') THEN L.TotalQty 
                ELSE 0 
            END) AS Qty,
            MAX(ER.TotalWorkingHr) AS Hrs
        FROM Trans.TblLoading L WITH(NOLOCK)
        JOIN Trans.TblEquipmentReading ER WITH(NOLOCK) 
            ON L.HaulerEquipmentId = ER.EquipmentId 
            AND L.LoadingDate = ER.Date 
            AND L.ShiftId = ER.ShiftId
            AND ER.ActivityId = 4
        JOIN Master.TblOperator O WITH(NOLOCK) ON ER.OperatorId = O.SlNo
        JOIN Master.TblEquipment E WITH(NOLOCK) ON L.HaulerEquipmentId = E.SlNo
        LEFT JOIN Master.TblMaterial Mt WITH(NOLOCK) ON L.MaterialId = Mt.SlNo
        WHERE L.IsDelete = 0 
          AND L.LoadingDate BETWEEN @FromDate AND @ToDate
          AND (@Model IS NULL OR E.Model = @Model)
          AND (@Capacity IS NULL OR E.Capacity = @Capacity)
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
        GROUP BY O.OperatorName, O.OperatorId, E.EquipmentName, E.Model, E.Capacity, L.LoadingDate, L.ShiftId
    END

    -- Final Aggregation
    SELECT 
        Type,
        CONCAT(OperatorName, ' (', OperatorId, ')') AS OperatorName,
        Equipment,
        Model,
        Capacity,
        SUM(Trip) AS Trip,
        ROUND(SUM(Qty), 0) AS Qty,
        ROUND(SUM(Hrs), 2) AS Hrs,
     ROUND(CASE WHEN SUM(Hrs) > 0 THEN SUM(Trip) / SUM(Hrs) ELSE 0 END, 0) AS TripsPerHr,
        ROUND(CASE WHEN SUM(Hrs) > 0 THEN SUM(Qty) / SUM(Hrs) ELSE 0 END, 0) AS BCMPerHr
    FROM #OpPerf
    GROUP BY OperatorName, OperatorId, Equipment, Model, Capacity, Type
    
    DROP TABLE #OpPerf;
END

