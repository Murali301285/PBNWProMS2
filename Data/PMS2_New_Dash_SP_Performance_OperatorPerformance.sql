CREATE OR ALTER PROCEDURE [dbo].[PMS2_New_Dash_SP_Performance_OperatorPerformance]
    @FromDate DATE,
    @ToDate DATE,
    @Model VARCHAR(100) = NULL,
    @Capacity VARCHAR(100) = NULL,
    @ShiftId INT = NULL,
    @ActivityType VARCHAR(20) = 'Both' -- 'Loading', 'Hauling', 'Both'
AS
BEGIN
    SET NOCOUNT ON;

    IF @ActivityType = 'Both'
    BEGIN
         -- Union of both
        SELECT 
            'Loading' AS Type,
            O.OperatorName,
            E.EquipmentName AS Equipment,
            E.Model,
            E.Capacity,
            S.ShiftName AS Shift,
            SUM(L.NoofTrip) AS Trip,
            SUM(L.TotalQty) AS Qty,
            MAX(ER.TotalWorkingHr) AS Hrs 
        FROM Trans.TblLoading L WITH(NOLOCK)
        JOIN Trans.TblEquipmentReading ER WITH(NOLOCK) 
            ON L.LoadingMachineEquipmentId = ER.EquipmentId 
            AND L.LoadingDate = ER.Date 
            AND L.ShiftId = ER.ShiftId
            AND ER.ActivityId = 3 -- Loading Activity
        JOIN Master.TblOperator O WITH(NOLOCK) ON ER.OperatorId = O.SlNo
        JOIN Master.TblEquipment E WITH(NOLOCK) ON L.LoadingMachineEquipmentId = E.SlNo
        JOIN Master.TblShift S WITH(NOLOCK) ON L.ShiftId = S.SlNo
        WHERE L.IsDelete = 0 
          AND L.LoadingDate BETWEEN @FromDate AND @ToDate
          AND (@Model IS NULL OR E.Model = @Model)
          AND (@Capacity IS NULL OR E.Capacity = @Capacity)
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
        GROUP BY O.OperatorName, E.EquipmentName, E.Model, E.Capacity, S.ShiftName

        UNION ALL

        SELECT 
            'Hauling' AS Type,
            O.OperatorName,
            E.EquipmentName AS Equipment,
            E.Model,
            E.Capacity,
            S.ShiftName AS Shift,
            SUM(L.NoofTrip) AS Trip,
            SUM(L.TotalQty) AS Qty,
            MAX(ER.TotalWorkingHr) AS Hrs
        FROM Trans.TblLoading L WITH(NOLOCK)
        JOIN Trans.TblEquipmentReading ER WITH(NOLOCK) 
            ON L.HaulerEquipmentId = ER.EquipmentId 
            AND L.LoadingDate = ER.Date 
            AND L.ShiftId = ER.ShiftId
            AND ER.ActivityId = 4 -- Hauling Activity
        JOIN Master.TblOperator O WITH(NOLOCK) ON ER.OperatorId = O.SlNo
        JOIN Master.TblEquipment E WITH(NOLOCK) ON L.HaulerEquipmentId = E.SlNo
        JOIN Master.TblShift S WITH(NOLOCK) ON L.ShiftId = S.SlNo
        WHERE L.IsDelete = 0 
          AND L.LoadingDate BETWEEN @FromDate AND @ToDate
          AND (@Model IS NULL OR E.Model = @Model)
          AND (@Capacity IS NULL OR E.Capacity = @Capacity)
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
        GROUP BY O.OperatorName, E.EquipmentName, E.Model, E.Capacity, S.ShiftName
    END
    ELSE IF @ActivityType = 'Loading'
    BEGIN
        SELECT 
            'Loading' AS Type,
            O.OperatorName,
            E.EquipmentName AS Equipment,
            E.Model,
            E.Capacity,
            S.ShiftName AS Shift,
            SUM(L.NoofTrip) AS Trip,
            SUM(L.TotalQty) AS Qty,
            MAX(ER.TotalWorkingHr) AS Hrs 
        FROM Trans.TblLoading L WITH(NOLOCK)
        JOIN Trans.TblEquipmentReading ER WITH(NOLOCK) 
            ON L.LoadingMachineEquipmentId = ER.EquipmentId 
            AND L.LoadingDate = ER.Date 
            AND L.ShiftId = ER.ShiftId
            AND ER.ActivityId = 3 -- Loading Activity
        JOIN Master.TblOperator O WITH(NOLOCK) ON ER.OperatorId = O.SlNo
        JOIN Master.TblEquipment E WITH(NOLOCK) ON L.LoadingMachineEquipmentId = E.SlNo
        JOIN Master.TblShift S WITH(NOLOCK) ON L.ShiftId = S.SlNo
        WHERE L.IsDelete = 0 
          AND L.LoadingDate BETWEEN @FromDate AND @ToDate
          AND (@Model IS NULL OR E.Model = @Model)
          AND (@Capacity IS NULL OR E.Capacity = @Capacity)
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
        GROUP BY O.OperatorName, E.EquipmentName, E.Model, E.Capacity, S.ShiftName
    END
    ELSE
    BEGIN
        SELECT 
            'Hauling' AS Type,
            O.OperatorName,
            E.EquipmentName AS Equipment,
            E.Model,
            E.Capacity,
            S.ShiftName AS Shift,
            SUM(L.NoofTrip) AS Trip,
            SUM(L.TotalQty) AS Qty,
            MAX(ER.TotalWorkingHr) AS Hrs
        FROM Trans.TblLoading L WITH(NOLOCK)
        JOIN Trans.TblEquipmentReading ER WITH(NOLOCK) 
            ON L.HaulerEquipmentId = ER.EquipmentId 
            AND L.LoadingDate = ER.Date 
            AND L.ShiftId = ER.ShiftId
            AND ER.ActivityId = 4 -- Hauling Activity
        JOIN Master.TblOperator O WITH(NOLOCK) ON ER.OperatorId = O.SlNo
        JOIN Master.TblEquipment E WITH(NOLOCK) ON L.HaulerEquipmentId = E.SlNo
        JOIN Master.TblShift S WITH(NOLOCK) ON L.ShiftId = S.SlNo
        WHERE L.IsDelete = 0 
          AND L.LoadingDate BETWEEN @FromDate AND @ToDate
          AND (@Model IS NULL OR E.Model = @Model)
          AND (@Capacity IS NULL OR E.Capacity = @Capacity)
          AND (@ShiftId IS NULL OR L.ShiftId = @ShiftId)
        GROUP BY O.OperatorName, E.EquipmentName, E.Model, E.Capacity, S.ShiftName
    END

END
