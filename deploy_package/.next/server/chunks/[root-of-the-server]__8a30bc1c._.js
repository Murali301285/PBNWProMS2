module.exports=[628191,(e,t,r)=>{t.exports=e.x("mssql",()=>require("mssql"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},834668,e=>{"use strict";var t=e.i(628191),r=e.i(493458);process.env.DB_DATABASE;let a={},n=async(e=null)=>{try{let n=e;if(!n){let e=await (0,r.cookies)();n=e.get("current_db")?.value||process.env.DB_DATABASE||"ProMS2_Serv"}let o=n.replace(/[^a-zA-Z0-9_.]/g,"");if(a[o]&&a[o].connected)return a[o];let s={...{user:process.env.DB_USER||"sa",password:process.env.DB_PASSWORD||"Chennai@42",server:process.env.DB_SERVER||"localhost",port:parseInt(process.env.DB_PORT||"1433"),options:{encrypt:!1,trustServerCertificate:!0,enableArithAbort:!0},connectionTimeout:3e5,requestTimeout:3e5},database:o};console.log("------------------------------------------------"),console.log("[DB DEBUG] Attempting Connection..."),console.log(`[DB DEBUG] Config Server: '${s.server}'`),console.log(`[DB DEBUG] Config Port: '${s.port}'`),console.log(`[DB DEBUG] Config Database: '${s.database}'`),console.log(`[DB DEBUG] Config User: '${s.user}'`),console.log("------------------------------------------------");let i=await new t.default.ConnectionPool(s).connect();return a[o]=i,console.log(`[DB SUCCESS] Connected to ${o}`),i}catch(e){throw console.error("------------------------------------------------"),console.error("[DB FATAL ERROR] Connection Failed!"),console.error("Error Code:",e.code),console.error("Error Message:",e.message),console.error("Original Error:",e.originalError?.message),console.error("------------------------------------------------"),e}},o=async(e,r=[],a=null)=>{try{let o=(await n(a)).request();return Array.isArray(r)?r.forEach(e=>{if(e.type){let r="string"==typeof e.type?t.default[e.type]:e.type;o.input(e.name,r,e.value)}else o.input(e.name,e.value)}):r&&"object"==typeof r&&Object.keys(r).forEach(e=>{o.input(e,r[e])}),(await o.query(e)).recordset}catch(e){throw console.error("Query Execution Error:",e),e}},s=async(e,r=[],a=null)=>{try{let o=(await n(a)).request();return Array.isArray(r)&&r.forEach(e=>{if(e.type){let r="string"==typeof e.type?t.default[e.type]:e.type;o.input(e.name,r,e.value)}else o.input(e.name,e.value)}),(await o.execute(e)).recordsets}catch(e){throw console.error("SP Execution Error:",e),e}};e.s(["executeQuery",0,o,"executeStoredProcedure",0,s,"getDbConnection",0,n])},704462,e=>{"use strict";var t=e.i(628191);e.s(["sql",()=>t.default])},59894,e=>{"use strict";var t=e.i(747909),r=e.i(174017),a=e.i(996250),n=e.i(759756),o=e.i(561916),s=e.i(114444),i=e.i(837092),l=e.i(869741),u=e.i(316795),c=e.i(487718),d=e.i(995169),p=e.i(47587),T=e.i(666012),h=e.i(570101),E=e.i(626937),m=e.i(10372),g=e.i(193695);e.i(52474);var R=e.i(600220),S=e.i(89171),f=e.i(834668),N=e.i(704462);async function C(e){let{searchParams:t}=new URL(e.url),r=parseInt(t.get("offset")||"0"),a=parseInt(t.get("limit")||"100"),n=t.get("fromDate"),o=t.get("toDate");try{let e=await (0,f.getDbConnection)(),t=e.request(),s="WHERE T.IsDelete = 0";n&&(s+=" AND CAST(T.[Date] AS DATE) >= @fromDate",t.input("fromDate",N.sql.Date,n)),o&&(s+=" AND CAST(T.[Date] AS DATE) <= @toDate",t.input("toDate",N.sql.Date,o)),t.input("offset",N.sql.Int,r),t.input("limit",N.sql.Int,a);let i=`
            SELECT 
                T.SlNo,
                T.[Date],
                T.ShiftId,
                T.ShiftInChargeId,
                T.MidScaleInchargeId,
                T.PlantId,
                T.ProductionUnitId,
                T.HaulerEquipmentId as EquipmentId,
                T.TripQtyUnitId,
                
                S.ShiftName,
                
                O_Large.OperatorName as ShiftInChargeName,
                O_Mid.OperatorName as MidScaleInchargeName,
                
                T.ManPowerInShift,
                
                P.Name as PlantName,
                
                T.BeltScaleOHMR,
                T.BeltScaleCHMR,
                
                U1.Name as ProductionUnitName,
                T.ProductionQty,
                
                H.EquipmentName as HaulerName,
                
                T.NoofTrip,
                T.QtyTrip,
                U2.Name as TripQtyUnitName,
                
                T.TotalQty,
                T.OHMR,
                T.CHMR,
                T.RunningHr,
                T.TotalStoppageHours,
                T.Remarks,

                CU.EmpName as CreatedByName,
                T.CreatedDate,
                UU.EmpName as UpdatedByName,
                T.UpdatedDate
            
            FROM [Trans].[TblCrusher] T
            LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
            LEFT JOIN [Master].[TblOperator] O_Large ON T.ShiftInChargeId = O_Large.SlNo
            LEFT JOIN [Master].[TblOperator] O_Mid ON T.MidScaleInchargeId = O_Mid.SlNo
            LEFT JOIN [Master].[TblPlant] P ON T.PlantId = P.SlNo
            LEFT JOIN [Master].[TblUnit] U1 ON T.ProductionUnitId = U1.SlNo
            LEFT JOIN [Master].[TblEquipment] H ON T.HaulerEquipmentId = H.SlNo
            LEFT JOIN [Master].[TblUnit] U2 ON T.TripQtyUnitId = U2.SlNo
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            
            ${s}
            ORDER BY T.[Date] DESC, T.SlNo DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `,l=(await t.query(i)).recordset;if(l.length>0){let t=l.map(e=>e.SlNo).join(","),r=`
                SELECT 
                    CS.CrusherId,
                    CS.FromTime,
                    CS.ToTime,
                    R.BDReasonName as ReasonName,
                    CS.StoppageHours,
                    CS.Remarks
                FROM [Trans].[TblCrusherStoppage] CS
                LEFT JOIN [Master].[TblBDReason] R ON CS.StoppageId = R.SlNo
                WHERE CS.CrusherId IN (${t})
            `,a=(await e.request().query(r)).recordset;l=l.map(e=>({...e,stoppages:a.filter(t=>t.CrusherId===e.SlNo)}))}return S.NextResponse.json({success:!0,data:l})}catch(e){return console.error("Error fetching Crusher list:",e),S.NextResponse.json({success:!1,message:e.message},{status:500})}}e.s(["GET",()=>C,"dynamic",0,"force-dynamic"],154621);var y=e.i(154621);let x=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/transaction/crusher/list/route",pathname:"/api/transaction/crusher/list",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/transaction/crusher/list/route.js",nextConfigOutput:"standalone",userland:y}),{workAsyncStorage:v,workUnitAsyncStorage:O,serverHooks:D}=x;function w(){return(0,a.patchFetch)({workAsyncStorage:v,workUnitAsyncStorage:O})}async function I(e,t,a){x.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let S="/api/transaction/crusher/list/route";S=S.replace(/\/index$/,"")||"/";let f=await x.prepare(e,t,{srcPage:S,multiZoneDraftMode:!1});if(!f)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:N,params:C,nextConfig:y,parsedUrl:v,isDraftMode:O,prerenderManifest:D,routerServerContext:w,isOnDemandRevalidate:I,revalidateOnlyGenerated:A,resolvedPathname:U,clientReferenceManifest:b,serverActionsManifest:P}=f,q=(0,l.normalizeAppPath)(S),M=!!(D.dynamicRoutes[q]||D.routes[U]),_=async()=>((null==w?void 0:w.render404)?await w.render404(e,t,v,!1):t.end("This page could not be found"),null);if(M&&!O){let e=!!D.routes[U],t=D.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(y.experimental.adapterPath)return await _();throw new g.NoFallbackError}}let B=null;!M||x.isDev||O||(B="/index"===(B=U)?"/":B);let H=!0===x.isDev||!M,F=M&&!H;P&&b&&(0,s.setReferenceManifestsSingleton)({page:S,clientReferenceManifest:b,serverActionsManifest:P,serverModuleMap:(0,i.createServerModuleMap)({serverActionsManifest:P})});let k=e.method||"GET",j=(0,o.getTracer)(),L=j.getActiveScopeSpan(),$={params:C,prerenderManifest:D,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts},cacheComponents:!!y.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:y.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a)=>x.onRequestError(e,t,a,w)},sharedContext:{buildId:N}},J=new u.NodeNextRequest(e),G=new u.NodeNextResponse(t),K=c.NextRequestAdapter.fromNodeNextRequest(J,(0,c.signalFromNodeResponse)(t));try{let s=async e=>x.handle(K,$).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=j.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${k} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${k} ${S}`)}),i=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var o,l;let u=async({previousCacheEntry:r})=>{try{if(!i&&I&&A&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await s(n);e.fetchMetrics=$.renderOpts.fetchMetrics;let l=$.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let u=$.renderOpts.collectedTags;if(!M)return await (0,T.sendResponse)(J,G,o,$.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(o.headers);u&&(t[m.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==$.renderOpts.collectedRevalidate&&!($.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&$.renderOpts.collectedRevalidate,a=void 0===$.renderOpts.collectedExpire||$.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:$.renderOpts.collectedExpire;return{value:{kind:R.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await x.onRequestError(e,t,{routerKind:"App Router",routePath:S,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:I})},w),t}},c=await x.handleResponse({req:e,nextConfig:y,cacheKey:B,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:D,isRoutePPREnabled:!1,isOnDemandRevalidate:I,revalidateOnlyGenerated:A,responseGenerator:u,waitUntil:a.waitUntil,isMinimalMode:i});if(!M)return null;if((null==c||null==(o=c.value)?void 0:o.kind)!==R.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",I?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),O&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,h.fromNodeOutgoingHttpHeaders)(c.value.headers);return i&&M||d.delete(m.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,E.getCacheControlHeader)(c.cacheControl)),await (0,T.sendResponse)(J,G,new Response(c.value.body,{headers:d,status:c.value.status||200})),null};L?await l(L):await j.withPropagatedContext(e.headers,()=>j.trace(d.BaseServerSpan.handleRequest,{spanName:`${k} ${S}`,kind:o.SpanKind.SERVER,attributes:{"http.method":k,"http.target":e.url}},l))}catch(t){if(t instanceof g.NoFallbackError||await x.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:I})}),M)throw t;return await (0,T.sendResponse)(J,G,new Response(null,{status:500})),null}}e.s(["handler",()=>I,"patchFetch",()=>w,"routeModule",()=>x,"serverHooks",()=>D,"workAsyncStorage",()=>v,"workUnitAsyncStorage",()=>O],59894)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__8a30bc1c._.js.map