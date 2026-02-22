module.exports=[193695,(a,b,c)=>{b.exports=a.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},19325,a=>{a.n(a.i(362925))},43619,a=>{a.n(a.i(379962))},13718,a=>{a.n(a.i(685523))},118198,a=>{a.n(a.i(545518))},262212,a=>{a.n(a.i(866114))},296867,a=>{a.n(a.i(545169))},373551,a=>{a.n(a.i(581516))},995242,a=>{"use strict";let b=(0,a.i(211857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/components/TransactionForm.js <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/TransactionForm.js <module evaluation>","default");a.s(["default",0,b])},499586,a=>{"use strict";let b=(0,a.i(211857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/components/TransactionForm.js from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/components/TransactionForm.js","default");a.s(["default",0,b])},562067,a=>{"use strict";a.i(995242);var b=a.i(499586);a.n(b)},941848,a=>{"use strict";var b=a.i(907997),c=a.i(562067);a.i(570396);var d=a.i(673727),e=a.i(401183),f=a.i(704462);async function g(a){try{let b=parseInt(a);if(console.log(`🔍 Edit Page: Fetching data for ID: ${a} (Parsed: ${b})`),isNaN(b))return console.error("❌ Edit Page: Invalid ID format"),null;let c=`
            SELECT 
                SlNo,
                LoadingDate,
                ShiftId,
                ManPowerInShift AS ManPower,
                RelayId,
                SourceId,
                DestinationId,
                MaterialId,
                HaulerEquipmentId AS HaulerId,
                LoadingMachineEquipmentId AS LoadingMachineId,
                NoofTrip AS NoOfTrips,
                QtyTrip,
                NtpcQtyTrip, 
                UnitId,
                TotalQty,
                TotalNtpcQty,
                Remarks,
                ShiftInchargeId,
                MidScaleInchargeId
            FROM [Trans].[TblLoading] 
            WHERE SlNo = @id AND IsDelete = 0
        `,d=(await (0,e.executeQuery)(c,[{name:"id",type:f.sql.Int,value:b}]))[0];if(!d)return console.error(`❌ Edit Page: No record found for ID ${b}`),null;return console.log("✅ Edit Page: Data Fetched",d),d}catch(a){return console.error("❌ Edit Page: getData CRITICAL FAIL. Error: "+a.message),null}}async function h({params:a}){let{id:e}=await a,f=await g(e);if(!f)return(0,d.notFound)();let h=JSON.parse(JSON.stringify(f));return(0,b.jsx)(c.default,{isEdit:!0,initialData:h})}a.s(["default",()=>h])}];

//# sourceMappingURL=%5Broot-of-the-server%5D__a10ebe8d._.js.map