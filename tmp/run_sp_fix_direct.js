require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '127.0.0.1',
    database: process.env.DB_DATABASE || 'ProMS2_1203',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

async function main() {
    try {
        await sql.connect(config);
        console.log("Connected directly using .env.local!");
        
        const loadSP = `
        ALTER PROCEDURE [dbo].[PMS2_New_Sp_OperatorPerformanceLoadingReport]
            @FromDate DATE,
            @ToDate DATE,
            @ShiftIds NVARCHAR(MAX) = NULL,
            @OperatorIds NVARCHAR(MAX) = NULL,
            @LoadingMachineIds NVARCHAR(MAX) = NULL,
            @ActivityIds NVARCHAR(MAX) = NULL
        AS
        BEGIN
            SET NOCOUNT ON;

            DECLARE @CoalMatrialId INT = 7; 
            DECLARE @RomCoalId INT = 7; -- ROM Coal

            IF @ShiftIds = '' SET @ShiftIds = NULL;
            IF @OperatorIds = '' SET @OperatorIds = NULL;
            IF @LoadingMachineIds = '' SET @LoadingMachineIds = NULL;
            IF @ActivityIds = '' SET @ActivityIds = NULL;

            SELECT 
                ROW_NUMBER() OVER(ORDER BY T0.Date DESC, T0.ShiftId) as SlNo,
                -- Return raw date string for JS or format it? The JS says 'new Date(r.Date).toLocaleDateString()' so raw datetime/date is fine
                T0.Date as Date,
                T1.ShiftName as [SHIFT],
                R.Name as [RELAY],
                
                CONCAT(Op.OperatorName, '(', Op.OperatorId, ')') as [OPERATOR'S NAME],
                
                Eq.EquipmentName as [LOADING EQUIPMENT],
                Eq.Model as [MODEL],
                Sec.SectorName as [SECTOR],
                
                T0.OHMR as [Open HMR],
                T0.CHMR as [Close HMR],
                T0.NetHMR as [Net HMR],
                
                T0.TotalWorkingHr as [WORKING HR],
                T0.IdleHr as [IDLE HR],
                T0.MaintenanceHr as [MAINTENANCE HR],
                T0.BDHr as [BREAKDOWN HR],
                
                ISNULL(L.OBTrips, 0) as [OB TRIPS],
                ISNULL(L.OBQty, 0) as [QUANTITY (BCM)],
                
                ISNULL(L.CoalTrips, 0) as [COAL TRIPS],
                ISNULL(L.CoalQty, 0) as [QUANTITY (MT)],
                
                -- Decimal casting for frontend
                CASE WHEN T0.NetHMR > 0 THEN CAST(ROUND((ISNULL(L.CoalTrips, 0) + ISNULL(L.OBTrips, 0)) / T0.NetHMR, 2) AS decimal(10,2)) ELSE 0 END AS [TOTAL TRIPS PER HR],
                CASE WHEN T0.NetHMR > 0 THEN CAST(ROUND(((ISNULL(L.CoalQty, 0) / 1.55) + ISNULL(L.OBQty, 0)) / T0.NetHMR, 2) AS decimal(10,2)) ELSE 0 END AS [TOTAL BCM/HR],

                O_Large.OperatorName as [Shift Incharge(Large Scale)],
                O_Mid.OperatorName as [Shift Incharge - Mid Scale],

                T0.Remarks as [REMARKS]

            FROM [Trans].[TblEquipmentReading] T0 WITH(NOLOCK)
            JOIN [Master].[TblShift] T1 WITH(NOLOCK) ON T0.ShiftId = T1.SlNo
            LEFT JOIN [Master].[TblOperator] Op WITH(NOLOCK) ON T0.OperatorId = Op.SlNo
            LEFT JOIN [Master].[TblRelay] R WITH(NOLOCK) ON T0.RelayId = R.SlNo
            LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON T0.EquipmentId = Eq.SlNo
            LEFT JOIN [Master].[TblSector] Sec WITH(NOLOCK) ON T0.SectorId = Sec.SlNo
            LEFT JOIN [Master].TblOperator O_Large WITH(NOLOCK) ON O_Large.SlNo = T0.ShiftInchargeId
            LEFT JOIN [Master].TblOperator O_Mid WITH(NOLOCK) ON O_Mid.SlNo = T0.MidScaleInchargeId
            
            -- Loading joins on LoadingMachineEquipmentId instead of HaulerEquipmentId
            OUTER APPLY (
                SELECT 
                    SUM(CASE WHEN MaterialId = @RomCoalId THEN NoofTrip ELSE 0 END) as CoalTrips,
                    SUM(CASE WHEN MaterialId = @RomCoalId THEN TotalQty ELSE 0 END) as CoalQty,
                    SUM(CASE WHEN MaterialId != @RomCoalId THEN NoofTrip ELSE 0 END) as OBTrips,
                    SUM(CASE WHEN MaterialId != @RomCoalId THEN TotalQty ELSE 0 END) as OBQty
                FROM [Trans].[TblLoading] L WITH(NOLOCK)
                WHERE L.IsDelete = 0 
                  AND CAST(L.LoadingDate AS DATE) = CAST(T0.Date AS DATE)
                  AND L.ShiftId = T0.ShiftId
                  AND L.LoadingMachineEquipmentId = T0.EquipmentId
            ) L

            WHERE T0.IsDelete = 0
              AND T0.Date BETWEEN @FromDate AND @ToDate
              
              AND (@ActivityIds IS NULL OR Eq.ActivityId IN (SELECT value FROM STRING_SPLIT(@ActivityIds, ',')))
              AND (@ShiftIds IS NULL OR T0.ShiftId IN (SELECT value FROM STRING_SPLIT(@ShiftIds, ',')))
              AND (@OperatorIds IS NULL OR T0.OperatorId IN (SELECT value FROM STRING_SPLIT(@OperatorIds, ',')))
              AND (@LoadingMachineIds IS NULL OR T0.EquipmentId IN (SELECT value FROM STRING_SPLIT(@LoadingMachineIds, ',')))

            ORDER BY T0.Date DESC, T1.SlNo ASC;
        END
        `;
        await sql.query(loadSP);
        console.log("Loading SP Restored and Fixed!");

        const haulSP = `
        ALTER PROCEDURE [dbo].[PMS2_New_Sp_OperatorPerformanceHaulingReport]
            @FromDate DATE,
            @ToDate DATE,
            @ShiftIds NVARCHAR(MAX) = NULL,
            @OperatorIds NVARCHAR(MAX) = NULL,
            @HaulingMachineIds NVARCHAR(MAX) = NULL,
            @RelayIds NVARCHAR(MAX) = NULL
        AS
        BEGIN
            SET NOCOUNT ON;

            DECLARE @CoalMatrialId INT = 7; 
            DECLARE @RomCoalId INT = 7;
            
            IF @ShiftIds = '' SET @ShiftIds = NULL;
            IF @OperatorIds = '' SET @OperatorIds = NULL;
            IF @HaulingMachineIds = '' SET @HaulingMachineIds = NULL;
            IF @RelayIds = '' SET @RelayIds = NULL;

            SELECT 
                ROW_NUMBER() OVER(ORDER BY T0.Date DESC, T0.ShiftId) as SlNo,
                T0.Date as Date,
                T1.ShiftName as [SHIFT],
                R.Name as [RELAY],
                
                CONCAT(Op.OperatorName, '(', Op.OperatorId, ')') as [OPERATOR'S NAME],
                
                Eq.EquipmentName as [EQUIPMENT NO.],
                Eq.Model as [MODEL],
                
                T0.OHMR as [Open HMR],
                T0.CHMR as [Close HMR],
                T0.NetHMR as [Net HMR],
                
                T0.OKMR as [Open KMR],
                T0.CKMR as [Close KMR],
                T0.NetKMR as [Net KMR],
                
                T0.TotalWorkingHr as [WORKING HR],
                T0.IdleHr as [IDLE HR],
                T0.MaintenanceHr as [MAINTENANCE HR],
                T0.BDHr as [BREAKDOWN HR],
                
                ISNULL(L.CoalTrips, 0) as [COAL TRIPS],
                ISNULL(L.CoalQty, 0) as [COAL QTY],
                
                ISNULL(L.OBTrips, 0) as [OB TRIPS],
                ISNULL(L.OBQty, 0) as [OB QTY],

                CASE WHEN T0.NetHMR > 0 THEN CAST(ROUND((ISNULL(L.CoalTrips, 0) + ISNULL(L.OBTrips, 0)) / T0.NetHMR, 2) AS decimal(10,2)) ELSE 0 END AS [TOTAL TRIPS PER HR],
                CASE WHEN T0.NetHMR > 0 THEN CAST(ROUND(((ISNULL(L.CoalQty, 0) / 1.55) + ISNULL(L.OBQty, 0)) / T0.NetHMR, 2) AS decimal(10,2)) ELSE 0 END AS [TOTAL BCM/HR],

                O_Large.OperatorName as [Shift Incharge(Large Scale)],
                O_Mid.OperatorName as [Shift Incharge - Mid Scale],

                T0.Remarks as [REMARKS]

            FROM [Trans].[TblEquipmentReading] T0 WITH(NOLOCK)
            JOIN [Master].[TblShift] T1 WITH(NOLOCK) ON T0.ShiftId = T1.SlNo
            LEFT JOIN [Master].[TblOperator] Op WITH(NOLOCK) ON T0.OperatorId = Op.SlNo
            LEFT JOIN [Master].[TblRelay] R WITH(NOLOCK) ON T0.RelayId = R.SlNo
            LEFT JOIN [Master].[TblEquipment] Eq WITH(NOLOCK) ON T0.EquipmentId = Eq.SlNo
            LEFT JOIN [Master].TblOperator O_Large WITH(NOLOCK) ON O_Large.SlNo = T0.ShiftInchargeId
            LEFT JOIN [Master].TblOperator O_Mid WITH(NOLOCK) ON O_Mid.SlNo = T0.MidScaleInchargeId
            
            OUTER APPLY (
                SELECT 
                    SUM(CASE WHEN MaterialId = @RomCoalId THEN NoofTrip ELSE 0 END) as CoalTrips,
                    SUM(CASE WHEN MaterialId = @RomCoalId THEN TotalQty ELSE 0 END) as CoalQty,
                    SUM(CASE WHEN MaterialId != @RomCoalId THEN NoofTrip ELSE 0 END) as OBTrips,
                    SUM(CASE WHEN MaterialId != @RomCoalId THEN TotalQty ELSE 0 END) as OBQty
                FROM [Trans].[TblLoading] L WITH(NOLOCK)
                WHERE L.IsDelete = 0 
                  AND CAST(L.LoadingDate AS DATE) = CAST(T0.Date AS DATE)
                  AND L.ShiftId = T0.ShiftId
                  AND L.HaulerEquipmentId = T0.EquipmentId
            ) L

            WHERE T0.IsDelete = 0
              AND T0.Date BETWEEN @FromDate AND @ToDate
           
              AND (Eq.ActivityId = 4 ) 
              
              AND (@ShiftIds IS NULL OR T0.ShiftId IN (SELECT value FROM STRING_SPLIT(@ShiftIds, ',')))
              AND (@OperatorIds IS NULL OR T0.OperatorId IN (SELECT value FROM STRING_SPLIT(@OperatorIds, ',')))
              AND (@HaulingMachineIds IS NULL OR T0.EquipmentId IN (SELECT value FROM STRING_SPLIT(@HaulingMachineIds, ',')))
              AND (@RelayIds IS NULL OR T0.RelayId IN (SELECT value FROM STRING_SPLIT(@RelayIds, ',')))

            ORDER BY T0.Date DESC, T1.SlNo ASC;
        END
        `;
        await sql.query(haulSP);
        console.log("Hauling SP Restored and Fixed!");

    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
}
main();
