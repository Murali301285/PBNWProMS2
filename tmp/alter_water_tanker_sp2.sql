USE [ProMS2_2203];
GO

ALTER PROCEDURE [dbo].[ProMS2_SPReportWaterTankerEntry]
    @FromDate DATE,
    @ToDate DATE,
    @ShiftId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ROW_NUMBER() OVER(ORDER BY W.EntryDate DESC, Eq.EquipmentName) as SlNo,
        FORMAT(W.EntryDate, 'dd-MMM-yyyy') as Date,
        S.ShiftName as [Shift Name],
        Eq.EquipmentName as [Water Tanker Equipment],
        W.Capacity as [Tanker Capacity],

        ISNULL(W.NoOfTrip, 0) as [Trip],
        ISNULL(W.TotalQty, 0) as [Qty],

        FP.FillingPoint as [Filling Point],
        P.FillingPump as [Filling Pump],
        L.LocationName as [Destination],
        W.Remarks as [Remarks]

    FROM [Transaction].[TblWaterTankerEntry] W WITH(NOLOCK)
    LEFT JOIN [Master].[TblShift] S WITH(NOLOCK) ON W.ShiftId = S.SlNo
    LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON W.HaulerId = Eq.SlNo
    LEFT JOIN [Master].[tblFillingPoint] FP WITH(NOLOCK) ON W.FillingPointId = FP.SlNo
    LEFT JOIN [Master].[tblFillingPump] P WITH(NOLOCK) ON W.FillingPumpId = P.SlNo
    LEFT JOIN [Master].[TblLocation] L WITH(NOLOCK) ON W.DestinationId = L.SlNo

    WHERE W.IsDelete = 0
    AND CAST(W.EntryDate AS DATE) BETWEEN @FromDate AND @ToDate
    AND (@ShiftId IS NULL OR @ShiftId = 0 OR W.ShiftId = @ShiftId)

    ORDER BY
        W.EntryDate DESC, Eq.EquipmentName;
END
GO
