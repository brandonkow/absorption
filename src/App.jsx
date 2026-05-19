import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine } from "recharts";
import { useSheetData } from "./useSheetData";
import SHEET_DATA from "./data.json";

const G="#17E88F",G2="#80BBAD",DK="#F5F7F6",CD="#FFFFFF",BD="#DDE4E2",
  TX="#1C2828",MU="#6A7E7A",GR="#003F2D",RE="#C0392B",BL="#538184";
const TP={background:"#1C2828",border:"1px solid #2E3C3A",borderRadius:6,padding:"10px 14px",boxShadow:"0 4px 20px rgba(0,0,0,0.3)",fontSize:12,color:"#fff"};
const pct=v=>`${v.toFixed(1)}%`;
const fmt=v=>v>=1e6?`RM ${(v/1e6).toFixed(2)}M`:`RM ${(v/1e3).toFixed(0)}K`;
const rc=r=>r>=75?GR:r>=40?BL:RE;
const MONTHS={2023:30,2024:18,2025:6,2026:2};
const td=(extra={})=>({padding:"9px 12px",...extra});

// Data is sourced from src/data.json (generated from public/Master_File.xlsx).
// To update: edit the Excel, run `npm run update-data`, then commit & push.
const FALLBACK = { active: SHEET_DATA.active, annual: SHEET_DATA.ann, completed: SHEET_DATA.completed };
const CRD={"Noordinz Suites":{x:367,y:128},"Queens Residences Q3":{x:320,y:217},"The Lume":{x:328,y:62},"Maris":{x:342,y:70},"Westin Residences":{x:315,y:78},"G'Vinton":{x:355,y:97},"Lumina Residence":{x:350,y:104},"The Anton":{x:308,y:104},"The Crown":{x:303,y:64},"Scott @ Logan":{x:333,y:116},"Alton Skyvillas":{x:332,y:149},"Lightwater Residences":{x:335,y:175},"The Lighthauz":{x:344,y:110},"Avea":{x:352,y:75},"Setia SV2":{x:317,y:140},"Keeperz Suites":{x:363,y:122},"Avion":{x:233,y:267},"Bayan Suite":{x:322,y:196}};
const ZMAP={"Tanjung Tokong/North":["The Lume","Maris","Westin Residences","The Crown","Avea"],"Georgetown/Gurney":["Noordinz Suites","G'Vinton","Lumina Residence","The Anton","Scott @ Logan","The Lighthauz","Keeperz Suites"],"Jelutong/Gelugor":["Alton Skyvillas","Setia SV2","Lightwater Residences"],"Bayan Lepas":["Queens Residences Q3","Avion","Bayan Suite"]};
const ZC={"Tanjung Tokong/North":G,"Georgetown/Gurney":BL,"Jelutong/Gelugor":GR,"Bayan Lepas":RE};
const gz=n=>{for(const[z,ns]of Object.entries(ZMAP))if(ns.includes(n))return z;return"Georgetown/Gurney";};
const TABS=["Overview","Sales Performance","Pricing","Absorption Rate","Location Map","Value Positioning","Buyer Segments"];
const PERF_LEGEND=[{c:GR,l:"≥75% Take-Up"},{c:BL,l:"40–74% Take-Up"},{c:RE,l:"<40% Take-Up"}];
const ANN_LEGEND=[{c:BL,l:"2024"},{c:G,l:"2025"},{c:GR,l:"1H 2026"}];
const MONTHLY_LEGEND=[{c:GR,l:"≥3%/month"},{c:BL,l:"1–3%/month"},{c:RE,l:"<1%/month"}];

function Badge({color,text}){
  return (<span style={{background:color+"22",color:color,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{text}</span>);
}
function DBtn({onClick,label}){
  return (
    <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:5,background:G+"15",border:"1px solid "+G+"44",borderRadius:6,padding:"5px 12px",color:G,fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0}}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke={G} strokeWidth="1.5"><path d="M6 1v7M3 6l3 3 3-3"/><path d="M1 10h10"/></svg>
      {label||"Download"}
    </button>
  );
}
function CardHead({title,sub,onDl,dlLabel}){
  return (
    <div style={{padding:"14px 18px",borderBottom:"1px solid "+BD,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:GR,letterSpacing:0.2}}>{title}</div>
        {sub && <div style={{fontSize:11,color:MU,marginTop:2}}>{sub}</div>}
      </div>
      {onDl && <DBtn onClick={onDl} label={dlLabel||"Download"} />}
    </div>
  );
}
function LegendRow({items}){
  return (
    <div style={{display:"flex",gap:18,fontSize:11,color:MU,padding:"0 18px 10px",flexWrap:"wrap"}}>
      {items.map((it,i)=>(
        <span key={i} style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{display:"inline-block",width:11,height:11,background:it.c,borderRadius:2,flexShrink:0}}/>
          {it.l}
        </span>
      ))}
    </div>
  );
}
function SortTh({col,label,sc,sd,fn}){
  return (<th onClick={()=>fn(col)} style={{padding:"9px 12px",color:sc===col?G:"#B0D4CC",fontSize:10,textTransform:"uppercase",letterSpacing:1,fontWeight:600,cursor:"pointer",textAlign:"left",whiteSpace:"nowrap",userSelect:"none",background:"none"}}>{label}{sc===col?(sd==="desc"?" ▾":" ▴"):""}</th>);
}

function Tip({name,dev,rows}){
  return (
    <div style={TP}>
      <p style={{color:"#FFFFFF",fontWeight:700,fontSize:13,margin:"0 0 3px"}}>{name}</p>
      {dev && <p style={{color:"#FFFFFF",fontSize:11,margin:"0 0 8px",opacity:0.8}}>{dev}</p>}
      {rows.map((r,i)=>(<p key={i} style={{margin:"2px 0",color:"#FFFFFF",fontSize:12}}>{r.label}: <strong style={{color:r.c||"#FFFFFF"}}>{r.v}</strong></p>))}
    </div>
  );
}
function BarTip({active,payload}){
  if(!active||!payload||!payload.length) return null;
  const d=payload[0].payload;
  return (<Tip name={d.full||d.name} dev={d.dev} rows={[{label:"Sales Rate",v:`${d.v}%`,c:rc(d.v)}]} />);
}
function PSFTip({active,payload}){
  if(!active||!payload||!payload.length) return null;
  const d=payload[0].payload;
  return (<Tip name={d.full} dev={d.dev} rows={[{label:"PSF Range",v:`RM ${d.lo?.toLocaleString()} – RM ${d.hi?.toLocaleString()}`,c:G2},{label:"Midpoint",v:`RM ${d.mid?.toLocaleString()}`,c:G}]} />);
}
function AnnTotTip({active,payload,label}){
  if(!active||!payload||!payload.length) return null;
  return (<Tip name={label} dev={null} rows={[{label:"Units Absorbed",v:payload[0].value.toLocaleString(),c:G}]} />);
}
function AnnProjTip({active,payload}){
  if(!active||!payload||!payload.length) return null;
  const d=payload[0].payload;
  const tot=(d.y4||0)+(d.y5||0)+(d.y6||0);
  return (<Tip name={d.name} dev={d.dev} rows={[{label:"2024",v:d.y4||"—",c:BL},{label:"2025",v:d.y5||"—",c:G},{label:"1H 2026",v:d.y6||"—",c:GR},{label:"Total",v:tot,c:TX}]} />);
}
function AbsTip({active,payload}){
  if(!active||!payload||!payload.length) return null;
  const d=payload[0].payload;
  return (<Tip name={d.full} dev={d.dev} rows={[{label:"Monthly Abs",v:`${d.v}%`,c:GR}]} />);
}
function ScatTip({active,payload}){
  if(!active||!payload||!payload.length) return null;
  const d=payload[0].payload;
  return (<Tip name={d.name} dev={d.dev} rows={[{label:"Avg Size",v:`${d.x?.toLocaleString()} sf`},{label:"Avg PSF",v:`RM ${d.y?.toLocaleString()}`,c:G2},{label:"Units",v:d.z},{label:"Sales Rate",v:`${d.rate}%`,c:rc(d.rate)}]} />);
}

function MapHover({p,c}){
  if(!p||!c) return null;
  const bx=c.x>430?c.x-168:c.x+14,by=c.y>290?c.y-108:c.y-6;
  return (
    <g>
      <rect x={bx} y={by} width={162} height={100} rx="6" fill="#1C2828" stroke="#2E3C3A" strokeWidth="1"/>
      <text x={bx+10} y={by+15} fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif">{p.name}</text>
      <text x={bx+10} y={by+28} fill="#FFFFFF" fillOpacity="0.75" fontSize="8.5" fontFamily="sans-serif">{p.dev} · {p.comp}</text>
      <text x={bx+10} y={by+42} fill="#FFFFFF" fontSize="8.5" fontFamily="sans-serif">{p.units} units · RM {p.psfMin}–{p.psfMax} psf</text>
      <text x={bx+10} y={by+56} fill={rc(p.rate)} fontSize="9" fontFamily="sans-serif" fontWeight="bold">Sales Rate: {p.rate}%</text>
      <text x={bx+10} y={by+70} fill="#FFFFFF" fontSize="8.5" fontFamily="sans-serif">Monthly: {p.monthly}%/mo</text>
      <text x={bx+10} y={by+84} fill="#FFFFFF" fontSize="8.5" fontFamily="sans-serif">Sell-Out: {p.so<=0?"Sold Out":`~${p.so} months`}</text>
      <text x={bx+10} y={by+97} fill={ZC[p.zone]||"#FFFFFF"} fontSize="8" fontFamily="sans-serif">{p.zone}</text>
    </g>
  );
}

export default function App(){
  const[tab,setTab]=useState("Overview");
  const[sc,setSc]=useState("rate");
  const[sd,setSd]=useState("desc");
  const[hov,setHov]=useState(null);

  const{data,syncing,syncError}=useSheetData(FALLBACK);
  const ACTIVE = data.active    ?? [];
  const ANN    = data.annual    ?? [];
  const DONE   = data.completed ?? [];
  const ATOT   = useMemo(()=>[
    {p:"2024",   u:ANN.reduce((s,r)=>s+(r.y4||0),0)},
    {p:"2025",   u:ANN.reduce((s,r)=>s+(r.y5||0),0)},
    {p:"1H 2026",u:ANN.reduce((s,r)=>s+(r.y6||0),0)},
  ],[ANN]);

  const en=useMemo(()=>ACTIVE.map(p=>{
    const mo=MONTHS[p.launch]||6,sold=Math.round(p.units*p.rate/100),monthly=parseFloat((p.rate/mo).toFixed(2));
    return{...p,mo,sold,monthly,psfMid:Math.round((p.psfMin+p.psfMax)/2),sfMid:Math.round((p.sfMin+p.sfMax)/2),rem:p.units-sold,so:monthly>0?Math.ceil((100-p.rate)/monthly):999,zone:gz(p.name)};
  }),[]);

  const avgR=(ACTIVE.reduce((s,p)=>s+p.rate,0)/ACTIVE.length).toFixed(1);
  const avgM=(en.reduce((s,p)=>s+p.monthly,0)/en.length).toFixed(2);
  const sorted=[...en].sort((a,b)=>{const av=a[sc],bv=b[sc];if(typeof av==="string")return sd==="desc"?bv.localeCompare(av):av.localeCompare(bv);return sd==="desc"?bv-av:av-bv;});
  const ds=col=>{if(sc===col)setSd(d=>d==="desc"?"asc":"desc");else{setSc(col);setSd("desc");}};

  const bD=[...en].sort((a,b)=>b.rate-a.rate).map(p=>({name:p.name,full:p.name,dev:p.dev,v:p.rate,color:p.rate>=75?GR:p.rate>=40?BL:RE}));
  const aB=[...en].sort((a,b)=>b.monthly-a.monthly).map(p=>({name:p.name,full:p.name,dev:p.dev,v:p.monthly,color:p.monthly>=3?GR:p.monthly>=1?BL:RE}));
  const sc2=en.map(p=>({x:p.sfMid,y:p.psfMid,z:p.units,name:p.name,dev:p.dev,rate:p.rate}));
  const SEGS=[
    {label:"Entry Luxury",range:"< RM 800K",color:BL,persona:"First-time luxury buyers, young professionals and investors seeking rental yield. Price-sensitive but aspirational.",proj:en.filter(p=>p.pMin<800000)},
    {label:"Mid Luxury",range:"RM 800K–1.5M",color:GR,persona:"Upgraders, dual-income households and regional investors. Seeking lifestyle amenities and brand credibility.",proj:en.filter(p=>p.pMin>=800000&&p.pMin<1500000)},
    {label:"Premium Luxury",range:"RM 1.5M–3M",color:G,persona:"Affluent families, HNWIs and foreign buyers (MM2H, Singapore). Prioritise exclusivity, sea views and concierge services.",proj:en.filter(p=>p.pMin>=1500000&&p.pMin<3000000)},
    {label:"Ultra Luxury",range:"RM 3M+",color:"#E5B8D0",persona:"Ultra-HNWIs and trophy property collectors. Cash-heavy transactions driven by scarcity and prestige.",proj:en.filter(p=>p.pMin>=3000000)},
  ];

  const dlPNG=(id,fn,legend=[])=>{
    const el=document.getElementById(id);if(!el)return;
    const svg=el.querySelector("svg");if(!svg)return;
    const w=svg.clientWidth||800,h=svg.clientHeight||400;
    const lh=legend.length?34:0;
    const str=new XMLSerializer().serializeToString(svg);
    const blob=new Blob([str],{type:"image/svg+xml;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const img=new Image();
    img.onload=()=>{
      const cv=document.createElement("canvas");cv.width=w*2;cv.height=(h+lh)*2;
      const ctx=cv.getContext("2d");ctx.scale(2,2);
      ctx.fillStyle="#FFFFFF";ctx.fillRect(0,0,w,h+lh);
      ctx.drawImage(img,0,0,w,h);
      if(legend.length){
        const iw=Math.min(130,w/legend.length),totalW=legend.length*iw,lx=(w-totalW)/2;
        legend.forEach((it,i)=>{
          ctx.fillStyle=it.c;ctx.fillRect(lx+i*iw,h+11,11,11);
          ctx.fillStyle="#6A7E7A";ctx.font="11px 'Segoe UI',sans-serif";
          ctx.fillText(it.l,lx+i*iw+15,h+21);
        });
      }
      cv.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=fn+".png";a.click();},"image/png");
      URL.revokeObjectURL(url);
    };img.src=url;
  };
  const dlCSV=(rows,cols,fn)=>{
    const csv=[cols.map(c=>c.label),...rows.map(r=>cols.map(c=>{const v=r[c.key];return typeof v==="string"&&v.includes(",")? `"${v}"`:v??"";}))].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=fn+".csv";a.click();
  };

  const hovP=en.find(q=>q.name===hov)||null;
  const hovC=hov?CRD[hov]:null;

  return (
    <div style={{background:DK,minHeight:"100vh",color:TX,fontFamily:"'Segoe UI',sans-serif",fontSize:14}}>
      {/* Header */}
      <div style={{background:"#003F2D",padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"3px solid "+G}}>
        <div>
          <div style={{fontSize:10,color:G,letterSpacing:3,textTransform:"uppercase",marginBottom:4,fontWeight:600}}>Penang High-Rise Residential Market</div>
          <div style={{fontSize:22,fontWeight:700,color:"#FFFFFF"}}>Market Absorption Study</div>
          <div style={{fontSize:11,color:"#80BBAD",marginTop:3}}>18 Active Projects · 2 Completed Benchmarks · As of May 2026</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"#80BBAD",marginBottom:2}}>Prepared by</div>
          <div style={{fontSize:16,fontWeight:700,color:G}}>CBRE | WTW</div>
          <div style={{fontSize:11,color:"#80BBAD",marginTop:2}}>Internal Research Use Only</div>
          {syncing&&<div style={{marginTop:6,fontSize:10,color:"#80BBAD",display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end"}}><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",border:"1.5px solid #80BBAD",borderTopColor:G,animation:"spin 0.9s linear infinite"}}/> Syncing…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
          {syncError&&!syncing&&<div style={{marginTop:6,fontSize:10,color:"#FF8080",textAlign:"right"}}>⚠ Offline — showing saved data</div>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:"#FFFFFF",borderBottom:"1px solid "+BD,padding:"0 28px",display:"flex",overflowX:"auto",boxShadow:"0 1px 0 "+BD}}>
        {TABS.map(t=>{const act=tab===t;return(
          <button key={t} onClick={()=>setTab(t)} style={{position:"relative",background:"transparent",color:act?GR:MU,border:"none",padding:"14px 18px 12px",fontWeight:act?600:400,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",letterSpacing:act?0.8:0.3,outline:"none",transition:"color 0.2s"}}>
            {t}<span style={{position:"absolute",bottom:0,left:act?"12px":"50%",right:act?"12px":"50%",height:2,background:"linear-gradient(90deg,"+G+"00,"+G+","+G+"00)",borderRadius:2,transition:"left 0.25s,right 0.25s,opacity 0.2s",opacity:act?1:0,boxShadow:act?"0 0 8px "+G+"88":"none"}}/>
          </button>
        );})}
      </div>

      <div style={{padding:"22px 28px"}}>

        {/* ── OVERVIEW ── */}
        {tab==="Overview" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              {[{l:"Active Projects",v:18,s:"Penang market",c:G},{l:"Total Units",v:ACTIVE.reduce((s,p)=>s+p.units,0).toLocaleString(),s:"Active pipeline",c:BL},{l:"Avg Sales Rate",v:`${avgR}%`,s:"All projects",c:G2},{l:"Avg Monthly Abs.",v:`${avgM}%`,s:"Launch-adjusted",c:GR}].map((k,i)=>(
                <div key={i} style={{background:CD,border:"1px solid "+BD,borderRadius:10,padding:"16px 18px",borderTop:"2px solid "+k.c}}>
                  <div style={{fontSize:10,color:MU,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{k.l}</div>
                  <div style={{fontSize:24,fontWeight:700,color:k.c}}>{k.v}</div>
                  <div style={{fontSize:11,color:MU,marginTop:3}}>{k.s}</div>
                </div>
              ))}
            </div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden",marginBottom:16}}>
              <CardHead title="Active Market — Full Snapshot" sub="Click headers to sort" onDl={()=>dlCSV(sorted,[{key:"no",label:"#"},{key:"dev",label:"Developer"},{key:"name",label:"Project"},{key:"units",label:"Units"},{key:"psfMid",label:"Avg PSF"},{key:"launch",label:"Launch"},{key:"comp",label:"Completion"},{key:"rate",label:"Sales Rate %"},{key:"sold",label:"Sold"},{key:"monthly",label:"Monthly Abs %"}],"market_snapshot")} dlLabel="Export CSV"/>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead style={{background:"#003F2D"}}><tr><SortTh col="no" label="#" sc={sc} sd={sd} fn={ds}/><SortTh col="dev" label="Developer" sc={sc} sd={sd} fn={ds}/><SortTh col="name" label="Project" sc={sc} sd={sd} fn={ds}/><SortTh col="units" label="Units" sc={sc} sd={sd} fn={ds}/><SortTh col="psfMid" label="Avg PSF" sc={sc} sd={sd} fn={ds}/><SortTh col="launch" label="Launch" sc={sc} sd={sd} fn={ds}/><SortTh col="comp" label="Comp." sc={sc} sd={sd} fn={ds}/><SortTh col="rate" label="Sales Rate %" sc={sc} sd={sd} fn={ds}/><SortTh col="sold" label="Sold" sc={sc} sd={sd} fn={ds}/><SortTh col="monthly" label="Monthly Abs." sc={sc} sd={sd} fn={ds}/></tr></thead>
                  <tbody>{sorted.map((p,i)=>(
                    <tr key={p.no} style={{background:i%2===0?"#FFFFFF":"#F6F8F7",borderBottom:"1px solid "+BD}}>
                      <td style={td({color:MU,fontSize:11})}>{p.no}</td>
                      <td style={td({color:TX,fontSize:12})}>{p.dev}</td>
                      <td style={td({color:TX,fontSize:12})}>{p.name}</td>
                      <td style={td({color:MU})}>{p.units}</td>
                      <td style={td({color:TX})}>RM {p.psfMid.toLocaleString()}</td>
                      <td style={td({color:MU})}>{p.launch}</td>
                      <td style={td({color:MU})}>{p.comp}</td>
                      <td style={td()}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{flex:1,height:5,background:"#DDE4E2",borderRadius:3}}><div style={{height:"100%",width:`${Math.min(p.rate,100)}%`,background:rc(p.rate),borderRadius:3}}/></div>
                          <span style={{color:rc(p.rate),fontWeight:600,fontSize:12,minWidth:42}}>{pct(p.rate)}</span>
                        </div>
                      </td>
                      <td style={td({color:TX})}>{p.sold}</td>
                      <td style={td({color:p.monthly>=3?GR:p.monthly>=1?G:RE,fontWeight:600})}>{p.monthly}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,padding:"14px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:GR}}>📌 Completed Benchmarks</div>
                <DBtn onClick={()=>dlCSV(DONE,[{key:"name",label:"Project"},{key:"dev",label:"Developer"},{key:"units",label:"Units"},{key:"psfMin",label:"PSF Min"},{key:"psfMax",label:"PSF Max"},{key:"rate",label:"Take-Up %"}],"completed_benchmarks")} label="Export CSV"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {DONE.map((p,i)=>(
                  <div key={i} style={{background:"#FFFFFF",borderRadius:8,padding:"12px 16px",border:"1px solid "+BD}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontWeight:600,color:TX}}>{p.name}</span><span style={{fontSize:11,color:MU}}>{p.dev}</span></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      {[["Units",p.units,TX],["PSF",`RM ${p.psfMin}–${p.psfMax}`,TX],["Take-Up",pct(p.rate),rc(p.rate)]].map(([l,v,c],j)=>(
                        <div key={j}><div style={{fontSize:10,color:MU,marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:600,color:c}}>{v}</div></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SALES PERFORMANCE ── */}
        {tab==="Sales Performance" && (
          <div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden",marginBottom:16}}>
              <CardHead title="Sales Take-Up Rate by Project (%)" sub="Dark Green ≥75% · Sage 40–74% · Red <40%" onDl={()=>dlPNG("ch-sales","sales_rate",PERF_LEGEND)} dlLabel="Download PNG"/>
              <div id="ch-sales" style={{padding:"18px 18px 8px"}}>
                <ResponsiveContainer width="100%" height={430}>
                  <BarChart data={bD} layout="vertical" margin={{left:8}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4E2" horizontal={false}/>
                    <XAxis type="number" domain={[0,100]} tick={{fill:MU,fontSize:11}} unit="%"/>
                    <YAxis dataKey="name" type="category" tick={{fill:MU,fontSize:9}} width={190} interval={0}/>
                    <Tooltip content={<BarTip/>}/>
                    <ReferenceLine x={parseFloat(avgR)} stroke={G} strokeDasharray="4 4" label={{value:`Avg ${avgR}%`,fill:G,fontSize:10,position:"top"}}/>
                    <Bar dataKey="v" radius={[0,4,4,0]}>{bD.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <LegendRow items={PERF_LEGEND}/>
            </div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden"}}>
              <CardHead title="Developer Performance Summary" onDl={()=>dlCSV(Object.entries(en.reduce((a,p)=>{if(!a[p.dev])a[p.dev]={dev:p.dev,n:0,u:0,s:0};a[p.dev].n++;a[p.dev].u+=p.units;a[p.dev].s+=p.sold;return a;},{})).map(([,d])=>({...d,rate:((d.s/d.u)*100).toFixed(1)})),[{key:"dev",label:"Developer"},{key:"n",label:"Projects"},{key:"u",label:"Units"},{key:"s",label:"Sold"},{key:"rate",label:"Take-Up %"}],"dev_performance")} dlLabel="Export CSV"/>
              <div style={{padding:"0 18px 18px"}}>
                {Object.entries(en.reduce((a,p)=>{if(!a[p.dev])a[p.dev]={n:0,u:0,s:0};a[p.dev].n++;a[p.dev].u+=p.units;a[p.dev].s+=p.sold;return a;},{})).sort((a,b)=>(b[1].s/b[1].u)-(a[1].s/a[1].u)).map(([dev,d],i)=>{
                  const r=d.s/d.u*100;
                  return (<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+BD}}>
                    <div style={{width:130,fontSize:12,color:TX}}>{dev}</div>
                    <div style={{fontSize:11,color:MU,width:55}}>{d.n} proj.</div>
                    <div style={{flex:1,height:7,background:"#DDE4E2",borderRadius:4}}><div style={{height:"100%",width:`${Math.min(r,100)}%`,background:rc(r),borderRadius:4}}/></div>
                    <div style={{width:50,textAlign:"right",color:rc(r),fontWeight:700,fontSize:13}}>{r.toFixed(1)}%</div>
                    <div style={{width:90,textAlign:"right",fontSize:11,color:MU}}>{d.s}/{d.u} units</div>
                  </div>);
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PRICING ── */}
        {tab==="Pricing" && (
          <div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden",marginBottom:16}}>
              <CardHead title="PSF Price Range by Project (RM)" sub="Min–Max range · Color indicates sales performance" onDl={()=>dlPNG("ch-psf","psf_range",PERF_LEGEND)} dlLabel="Download PNG"/>
              <div id="ch-psf" style={{padding:"18px 18px 8px"}}>
                <ResponsiveContainer width="100%" height={430}>
                  <BarChart data={[...en].sort((a,b)=>a.psfMid-b.psfMid).map(p=>({name:p.name,full:p.name,dev:p.dev,base:p.psfMin,range:p.psfMax-p.psfMin,mid:p.psfMid,lo:p.psfMin,hi:p.psfMax,rate:p.rate}))} layout="vertical" margin={{left:8}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4E2" horizontal={false}/>
                    <XAxis type="number" tick={{fill:MU,fontSize:11}} tickFormatter={v=>`RM ${v}`}/>
                    <YAxis dataKey="name" type="category" tick={{fill:MU,fontSize:9}} width={190} interval={0}/>
                    <Tooltip content={<PSFTip/>}/>
                    <Bar dataKey="base" stackId="a" fill="transparent"/>
                    <Bar dataKey="range" stackId="a" radius={[0,4,4,0]}>{[...en].sort((a,b)=>a.psfMid-b.psfMid).map((p,i)=><Cell key={i} fill={rc(p.rate)} fillOpacity={0.8}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <LegendRow items={PERF_LEGEND}/>
            </div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden"}}>
              <CardHead title="Price vs Performance Matrix" onDl={()=>dlCSV([...en].sort((a,b)=>b.psfMid-a.psfMid),[{key:"name",label:"Project"},{key:"dev",label:"Developer"},{key:"psfMin",label:"PSF Min"},{key:"psfMax",label:"PSF Max"},{key:"psfMid",label:"PSF Mid"},{key:"rate",label:"Sales Rate %"}],"price_matrix")} dlLabel="Export CSV"/>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead style={{background:"#003F2D"}}><tr>{["Project","Developer","PSF Min","PSF Max","PSF Mid","Sales Rate","Tier"].map(h=><th key={h} style={{padding:"8px 12px",color:"#B0D4CC",fontSize:10,textTransform:"uppercase",letterSpacing:1,textAlign:"left"}}>{h}</th>)}</tr></thead>
                <tbody>{[...en].sort((a,b)=>b.psfMid-a.psfMid).map((p,i)=>{
                  const tier=p.psfMid>=1600?"Ultra Luxury":p.psfMid>=1200?"Luxury":p.psfMid>=900?"Premium":"Mid-Range";
                  const tc=p.psfMid>=1600?G:p.psfMid>=1200?G2:p.psfMid>=900?BL:MU;
                  return (<tr key={i} style={{borderBottom:"1px solid "+BD,background:i%2===0?"#FFFFFF":"#F6F8F7"}}>
                    <td style={td({color:TX,fontSize:12})}>{p.name}</td>
                    <td style={td({color:MU,fontSize:12})}>{p.dev}</td>
                    <td style={td({color:MU})}>RM {p.psfMin.toLocaleString()}</td>
                    <td style={td({color:MU})}>RM {p.psfMax.toLocaleString()}</td>
                    <td style={td({color:TX,fontWeight:600})}>RM {p.psfMid.toLocaleString()}</td>
                    <td style={td({color:rc(p.rate),fontWeight:600})}>{pct(p.rate)}</td>
                    <td style={td()}><Badge color={tc} text={tier}/></td>
                  </tr>);
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ABSORPTION RATE ── */}
        {tab==="Absorption Rate" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {[{l:"Market Avg Monthly",v:`${avgM}%`,s:"All 18 projects",c:G},{l:"Top Performer",v:"The Anton",s:"4.71%/month",c:GR},{l:"2025 Market Total",v:"1,884",s:"Units absorbed",c:BL},{l:"High Performers",v:`${en.filter(p=>p.rate>=75).length}`,s:"Projects ≥75% take-up",c:G2}].map((k,i)=>(
                <div key={i} style={{background:CD,border:"1px solid "+BD,borderRadius:10,padding:"16px 18px",borderTop:"2px solid "+k.c}}>
                  <div style={{fontSize:10,color:MU,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{k.l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
                  <div style={{fontSize:11,color:MU,marginTop:3}}>{k.s}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:14,marginBottom:14}}>
              <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden"}}>
                <CardHead title="Annual Market Total" onDl={()=>dlPNG("ch-atot","annual_total",ANN_LEGEND)} dlLabel="PNG"/>
                <div id="ch-atot" style={{padding:"14px 18px"}}>
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={ATOT}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DDE4E2"/>
                      <XAxis dataKey="p" tick={{fill:MU,fontSize:11}}/>
                      <YAxis tick={{fill:MU,fontSize:11}}/>
                      <Tooltip content={<AnnTotTip/>}/>
                      <Bar dataKey="u" radius={[4,4,0,0]} label={({x,y,width,value})=><text x={x+width/2} y={y-5} fill={TX} textAnchor="middle" fontSize={11} fontWeight="600">{value.toLocaleString()}</text>}><Cell fill={BL}/><Cell fill={G}/><Cell fill={GR}/></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
                    {[{l:"2024",v:386,c:BL},{l:"2025",v:1884,c:G},{l:"1H 2026",v:1406,c:GR}].map((r,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#F6F8F7",borderRadius:6,padding:"6px 10px",border:"1px solid "+BD}}>
                        <span style={{fontSize:11,color:MU}}>{r.l}</span><span style={{fontSize:13,fontWeight:700,color:r.c}}>{r.v.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <LegendRow items={ANN_LEGEND}/>
              </div>
              <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden"}}>
                <CardHead title="Annual Units Absorbed — Per Project" onDl={()=>dlPNG("ch-aproj","annual_per_project",ANN_LEGEND)} dlLabel="Download PNG"/>
                <div id="ch-aproj" style={{padding:"14px 18px"}}>
                  <div style={{display:"flex",gap:16,fontSize:11,color:MU,marginBottom:12}}>
                    {[{c:BL,l:"2024"},{c:G,l:"2025"},{c:GR,l:"1H 2026"}].map((it,i)=>(
                      <span key={i} style={{display:"flex",alignItems:"center",gap:5}}><span style={{display:"inline-block",width:10,height:10,background:it.c,borderRadius:2}}/>{it.l}</span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={420}>
                    <BarChart data={ANN} layout="vertical" margin={{left:4}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DDE4E2" horizontal={false}/>
                      <XAxis type="number" tick={{fill:MU,fontSize:10}}/>
                      <YAxis dataKey="sh" type="category" width={90} interval={0} tick={{fill:MU,fontSize:9}}/>
                      <Tooltip content={<AnnProjTip/>}/>
                      <Bar dataKey="y4" name="2024" stackId="a" fill={BL} fillOpacity={0.85}/>
                      <Bar dataKey="y5" name="2025" stackId="a" fill={G} fillOpacity={0.9}/>
                      <Bar dataKey="y6" name="1H 2026" stackId="a" fill={GR} fillOpacity={0.9} radius={[0,3,3,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden",marginBottom:14}}>
              <CardHead title="Annual Breakdown" sub="— = N/A or pre-launch" onDl={()=>dlCSV(ANN.map(p=>({...p,tot:(p.y4||0)+(p.y5||0)+(p.y6||0)})),[{key:"name",label:"Project"},{key:"dev",label:"Developer"},{key:"y4",label:"2024"},{key:"y5",label:"2025"},{key:"y6",label:"1H 2026"},{key:"tot",label:"Total"}],"annual_breakdown")} dlLabel="Export CSV"/>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead style={{background:"#003F2D"}}><tr>{["#","Project","Developer","2024","2025","1H 2026","Total","Trend"].map(h=><th key={h} style={{padding:"9px 12px",color:"#B0D4CC",fontSize:10,textTransform:"uppercase",letterSpacing:1,textAlign:"left"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {ANN.map((p,i)=>{
                    const tot=(p.y4||0)+(p.y5||0)+(p.y6||0);
                    const trend=p.y5>0&&p.y4>0?(p.y5>p.y4?"↑ Accel":"↓ Slow"):p.y5>0?"→ Launch":"→ New";
                    const tc=trend.startsWith("↑")?GR:trend.startsWith("↓")?RE:BL;
                    return (<tr key={i} style={{borderBottom:"1px solid "+BD,background:i%2===0?"#FFFFFF":"#F6F8F7"}}>
                      <td style={td({color:MU,fontSize:11})}>{i+1}</td>
                      <td style={td({color:TX,fontSize:12})}>{p.name}</td>
                      <td style={td({color:MU,fontSize:12})}>{p.dev}</td>
                      <td style={td({color:p.y4?BL:MU,fontWeight:p.y4?700:400})}>{p.y4||"—"}</td>
                      <td style={td({color:p.y5?G:MU,fontWeight:p.y5?700:400})}>{p.y5||"—"}</td>
                      <td style={td({color:p.y6?GR:MU,fontWeight:p.y6?700:400})}>{p.y6||"—"}</td>
                      <td style={td({color:TX,fontWeight:700})}>{tot||"—"}</td>
                      <td style={td()}><Badge color={tc} text={trend}/></td>
                    </tr>);
                  })}
                  <tr style={{background:"#F6F8F7",borderTop:"1px solid "+BD}}>
                    <td colSpan={3} style={td({color:GR,fontWeight:700,fontSize:12})}>Market Total</td>
                    <td style={td({color:BL,fontWeight:700})}>386</td><td style={td({color:G,fontWeight:700})}>1,884</td>
                    <td style={td({color:GR,fontWeight:700})}>1,406</td><td style={td({color:TX,fontWeight:700})}>3,676</td><td/>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden",marginBottom:14}}>
              <CardHead title="Monthly Absorption Rate — All Projects" sub="Sales Rate ÷ Months since launch" onDl={()=>dlPNG("ch-monthly","monthly_abs",MONTHLY_LEGEND)} dlLabel="Download PNG"/>
              <div id="ch-monthly" style={{padding:"18px 18px 8px"}}>
                <ResponsiveContainer width="100%" height={430}>
                  <BarChart data={aB} layout="vertical" margin={{left:8}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4E2" horizontal={false}/>
                    <XAxis type="number" tick={{fill:MU,fontSize:11}} unit="%"/>
                    <YAxis dataKey="name" type="category" tick={{fill:MU,fontSize:9}} width={190} interval={0}/>
                    <Tooltip content={<AbsTip/>}/>
                    <ReferenceLine x={parseFloat(avgM)} stroke={G} strokeDasharray="4 4" label={{value:`Avg ${avgM}%`,fill:G,fontSize:10}}/>
                    <Bar dataKey="v" radius={[0,4,4,0]}>{aB.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <LegendRow items={MONTHLY_LEGEND}/>
            </div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden"}}>
              <CardHead title="Absorption Detail & Sell-Out Projection" onDl={()=>dlCSV([...en].sort((a,b)=>b.monthly-a.monthly).map(p=>({...p,sl:p.so<=0?"Sold Out":`~${p.so} mo.`})),[{key:"name",label:"Project"},{key:"dev",label:"Developer"},{key:"launch",label:"Launch"},{key:"units",label:"Units"},{key:"sold",label:"Sold"},{key:"rem",label:"Remaining"},{key:"monthly",label:"Monthly %"},{key:"sl",label:"Est. Sell-Out"}],"sellout")} dlLabel="Export CSV"/>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead style={{background:"#003F2D"}}><tr>{["Project","Developer","Launch","Units","Sold","Rem.","Monthly","Est. Sell-Out"].map(h=><th key={h} style={{padding:"9px 12px",color:"#B0D4CC",fontSize:10,textTransform:"uppercase",letterSpacing:1,textAlign:"left"}}>{h}</th>)}</tr></thead>
                <tbody>{[...en].sort((a,b)=>b.monthly-a.monthly).map((p,i)=>{
                  const sl=p.monthly<=0?"N/A":p.so<=0?"Sold Out":`~${p.so} mo.`;
                  const sc3=p.so<=0?GR:p.so<=12?G:RE;
                  return (<tr key={i} style={{borderBottom:"1px solid "+BD,background:i%2===0?"#FFFFFF":"#F6F8F7"}}>
                    <td style={td({color:TX,fontSize:12})}>{p.name}</td>
                    <td style={td({color:MU,fontSize:12})}>{p.dev}</td>
                    <td style={td({color:MU})}>{p.launch}</td>
                    <td style={td({color:MU})}>{p.units}</td>
                    <td style={td({color:TX})}>{p.sold}</td>
                    <td style={td({color:MU})}>{p.rem}</td>
                    <td style={td({color:p.monthly>=3?GR:p.monthly>=1?G:RE,fontWeight:700})}>{p.monthly}%</td>
                    <td style={td()}><Badge color={sc3} text={sl}/></td>
                  </tr>);
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LOCATION MAP ── */}
        {tab==="Location Map" && (
          <div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden",marginBottom:16}}>
              <CardHead title="Project Location Map — Penang Island" sub="Hover over markers · Color = sales performance" onDl={()=>dlPNG("ch-map","penang_map")} dlLabel="Download PNG"/>
              <div id="ch-map" style={{padding:"0 18px 18px"}}>
                <svg viewBox="0 0 580 400" style={{width:"100%",height:"auto",display:"block",borderRadius:8}}>
                  <rect width="580" height="400" fill="#D6E8E4"/>
                  {[60,120,180,240,300,360].map(y=><line key={y} x1="0" y1={y} x2="580" y2={y} stroke="#C4DAD6" strokeWidth="1"/>)}
                  {[100,200,300,400,500].map(x=><line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#C4DAD6" strokeWidth="1"/>)}
                  <rect x="540" y="20" width="38" height="360" rx="2" fill="#B8D0CC" stroke="#A0BEB8" strokeWidth="1"/>
                  <text x="556" y="210" fill="#6A8A84" fontSize="8" fontFamily="sans-serif" textAnchor="middle" transform="rotate(90,556,210)">MAINLAND</text>
                  <line x1="465" y1="305" x2="542" y2="330" stroke="#7A9A94" strokeWidth="2.5" strokeDasharray="5 3"/>
                  <text x="508" y="355" fill="#6A8A84" fontSize="8" fontFamily="sans-serif" textAnchor="middle">Penang Bridge</text>
                  <path d="M 504,86 C 498,74 482,58 458,46 C 432,34 398,28 358,27 C 318,26 278,31 242,40 C 206,49 174,62 148,76 C 122,90 102,106 86,124 C 70,142 61,162 58,184 C 55,206 58,228 65,248 C 72,268 83,285 97,300 C 114,318 136,332 162,343 C 192,355 228,362 268,364 C 308,366 346,360 378,348 C 408,337 432,320 450,300 C 464,284 472,264 478,242 C 486,216 494,184 500,156 C 506,128 510,106 504,86 Z" fill="#EAF3F0" stroke="#B0CCC8" strokeWidth="1.5"/>
                  <path d="M 504,86 C 510,78 518,72 522,80 C 526,90 518,102 510,100 C 506,99 504,94 504,86 Z" fill="#EAF3F0" stroke="#B0CCC8" strokeWidth="1"/>
                  <path d="M 86,124 C 74,116 64,108 62,118 C 60,128 70,138 82,136 C 86,134 88,130 86,124 Z" fill="#EAF3F0" stroke="#B0CCC8" strokeWidth="1"/>
                  <ellipse cx="330" cy="72" rx="45" ry="22" fill={G} opacity="0.14"/>
                  <ellipse cx="340" cy="114" rx="46" ry="30" fill={BL} opacity="0.14"/>
                  <ellipse cx="327" cy="152" rx="30" ry="18" fill={GR} opacity="0.14"/>
                  <ellipse cx="295" cy="228" rx="58" ry="40" fill={RE} opacity="0.10"/>
                  {[{l:"Tg. Tokong / North",x:218,y:52,c:G},{l:"Georgetown / Gurney",x:428,y:100,c:BL},{l:"Jelutong / Gelugor",x:428,y:160,c:GR},{l:"Bayan Lepas",x:196,y:262,c:RE}].map((z,i)=>(
                    <text key={i} x={z.x} y={z.y} fill={z.c} fillOpacity={0.85} fontSize="8" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">{z.l}</text>
                  ))}
                  {en.map((p,i)=>{
                    const c=CRD[p.name];if(!c)return null;
                    const isH=hov===p.name;
                    const r=Math.max(6,Math.min(13,p.units/55));
                    const fill=rc(p.rate);
                    return (
                      <g key={i} onMouseEnter={()=>setHov(p.name)} onMouseLeave={()=>setHov(null)} style={{cursor:"pointer"}}>
                        {isH && <circle cx={c.x} cy={c.y} r={r+10} fill={fill} opacity={0.2}/>}
                        <circle cx={c.x} cy={c.y} r={isH?r+3:r} fill={fill} opacity={isH?1:0.85} stroke={"#FFFFFF"} strokeWidth={isH?2:1.5}/>
                      </g>
                    );
                  })}
                  <MapHover p={hovP} c={hovC}/>
                  {[{c:GR,l:"≥75% Take-Up"},{c:BL,l:"40–74% Take-Up"},{c:RE,l:"<40% Take-Up"}].map((it,i)=>(
                    <g key={i}><circle cx={18+i*110} cy={387} r={5} fill={it.c}/><text x={27+i*110} y={391} fill={TX} fontSize="9" fontFamily="sans-serif">{it.l}</text></g>
                  ))}
                </svg>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {Object.entries(en.reduce((acc,p)=>{if(!acc[p.zone])acc[p.zone]={ps:[],u:0,s:0};acc[p.zone].ps.push(p.name);acc[p.zone].u+=p.units;acc[p.zone].s+=p.sold;return acc;},{})).map(([zone,d],i)=>{
                const r=d.s/d.u*100,c=ZC[zone]||BL;
                return (<div key={i} style={{background:CD,border:"1px solid "+BD,borderRadius:10,padding:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:c,marginBottom:6}}>{zone}</div>
                  <div style={{fontSize:11,color:MU,marginBottom:6}}>{d.ps.length} project{d.ps.length>1?"s":""} · {d.u.toLocaleString()} units</div>
                  <div style={{height:5,background:"#DDE4E2",borderRadius:3,marginBottom:6}}><div style={{height:"100%",width:`${Math.min(r,100)}%`,background:c,borderRadius:3}}/></div>
                  <div style={{fontSize:12,color:rc(r),fontWeight:700,marginBottom:6}}>{r.toFixed(1)}% take-up</div>
                  <div style={{fontSize:10,color:MU,lineHeight:1.7}}>{d.ps.slice(0,3).join(", ")}{d.ps.length>3?` +${d.ps.length-3} more`:""}</div>
                </div>);
              })}
            </div>
          </div>
        )}

        {/* ── VALUE POSITIONING ── */}
        {tab==="Value Positioning" && (
          <div>
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden",marginBottom:16}}>
              <CardHead title="Floor Area vs PSF — Value Positioning Matrix" sub="X=avg size · Y=avg PSF · Bubble=units · Color=sales performance" onDl={()=>dlPNG("ch-scat","value_positioning",PERF_LEGEND)} dlLabel="Download PNG"/>
              <div id="ch-scat" style={{padding:"18px 18px 8px"}}>
                <ResponsiveContainer width="100%" height={360}>
                  <ScatterChart margin={{top:10,right:40,bottom:30,left:20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4E2"/>
                    <XAxis dataKey="x" type="number" name="Size" unit=" sf" domain={[200,3200]} tick={{fill:MU,fontSize:11}} label={{value:"Avg Unit Size (sq ft)",position:"insideBottom",offset:-15,fill:MU,fontSize:11}}/>
                    <YAxis dataKey="y" type="number" name="PSF" domain={[700,2400]} tick={{fill:MU,fontSize:11}} tickFormatter={v=>`RM ${v}`} label={{value:"RM PSF",angle:-90,position:"insideLeft",fill:MU,fontSize:11}}/>
                    <ZAxis dataKey="z" range={[60,700]}/>
                    <Tooltip content={<ScatTip/>}/>
                    <ReferenceLine x={900} stroke={BD} strokeDasharray="4 4" label={{value:"← Compact | Spacious →",fill:MU,fontSize:9,position:"top"}}/>
                    <ReferenceLine y={1300} stroke={BD} strokeDasharray="4 4" label={{value:"↑ Premium",fill:MU,fontSize:9,position:"right"}}/>
                    <Scatter name="All Projects" data={sc2}>
                      {sc2.map((d,i)=><Cell key={i} fill={rc(d.rate)} fillOpacity={0.75}/>)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <LegendRow items={PERF_LEGEND}/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,margin:"0 18px 18px"}}>
                {[{q:"🏢 Compact Premium",d:"Small, high-PSF. Investor & yield appeal.",c:G},{q:"🌟 Spacious Premium",d:"Large luxury. HNW segment.",c:G2},{q:"💰 Compact Value",d:"Affordable compact. High volume.",c:BL},{q:"🏡 Spacious Value",d:"Large but accessible. Owner-occ.",c:GR}].map((q,i)=>(
                  <div key={i} style={{background:"#F6F8F7",borderRadius:8,padding:"10px 12px",border:"1px solid "+BD}}>
                    <div style={{fontSize:11,fontWeight:600,color:q.c,marginBottom:4}}>{q.q}</div>
                    <div style={{fontSize:10,color:MU,lineHeight:1.6}}>{q.d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:"#F6F8F7",border:"1px solid "+BD,borderRadius:10,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:GR}}>📊 Market Positioning Insights</div>
                <DBtn onClick={()=>dlCSV([...en].sort((a,b)=>b.rate-a.rate).slice(0,6).map(p=>({name:p.name,dev:p.dev,sfMid:p.sfMid,psfMid:p.psfMid,quad:p.sfMid>900&&p.psfMid>1300?"Spacious Premium":p.sfMid<=900&&p.psfMid>1300?"Compact Premium":p.sfMid>900?"Spacious Value":"Compact Value",rate:p.rate})),[{key:"name",label:"Project"},{key:"dev",label:"Developer"},{key:"sfMid",label:"Avg SF"},{key:"psfMid",label:"Avg PSF"},{key:"quad",label:"Quadrant"},{key:"rate",label:"Sales Rate %"}],"positioning_insights")} label="Export CSV"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[...en].sort((a,b)=>b.rate-a.rate).slice(0,6).map((p,i)=>{
                  const quad=p.sfMid>900&&p.psfMid>1300?"Spacious Premium":p.sfMid<=900&&p.psfMid>1300?"Compact Premium":p.sfMid>900?"Spacious Value":"Compact Value";
                  return (<div key={i} style={{background:"#FFFFFF",borderRadius:8,padding:12,border:"1px solid "+BD}}>
                    <div style={{fontSize:12,fontWeight:700,color:GR,marginBottom:2}}>{p.name}</div>
                    <div style={{fontSize:11,color:MU,marginBottom:4}}>{p.dev}</div>
                    <div style={{fontSize:11,color:MU,marginBottom:6}}>Avg {p.sfMid.toLocaleString()} sf · RM {p.psfMid.toLocaleString()} psf</div>
                    <div style={{fontSize:11,fontWeight:600,color:quad.includes("Premium")?G:BL}}>📍 {quad}</div>
                    <div style={{fontSize:11,color:rc(p.rate),marginTop:4}}>Sales Rate: {pct(p.rate)}</div>
                  </div>);
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── BUYER SEGMENTS ── */}
        {tab==="Buyer Segments" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              {SEGS.map((s,i)=>(
                <div key={i} style={{background:CD,border:"1px solid "+BD,borderRadius:10,padding:"16px 18px",borderTop:"2px solid "+s.color}}>
                  <div style={{fontSize:10,color:MU,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
                  <div style={{fontSize:11,color:s.color,fontWeight:600,marginBottom:8}}>{s.range}</div>
                  <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.proj.length} <span style={{fontSize:12,fontWeight:400,color:MU}}>projects</span></div>
                  <div style={{fontSize:11,color:MU,marginTop:4}}>{s.proj.reduce((a,p)=>a+p.units,0).toLocaleString()} units</div>
                  <div style={{fontSize:12,color:rc(s.proj.reduce((a,p)=>a+p.rate,0)/s.proj.length),fontWeight:600,marginTop:6}}>Avg {(s.proj.reduce((a,p)=>a+p.rate,0)/s.proj.length).toFixed(1)}% take-up</div>
                </div>
              ))}
            </div>
            {SEGS.map((s,si)=>(
              <div key={si} style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden",marginBottom:14}}>
                <div style={{padding:"14px 18px",borderBottom:"1px solid "+BD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{fontSize:13,fontWeight:600,color:s.color}}>{s.label}</span><span style={{fontSize:11,color:MU,marginLeft:10}}>{s.range}</span></div>
                  <DBtn onClick={()=>dlCSV(s.proj,[{key:"name",label:"Project"},{key:"dev",label:"Developer"},{key:"pMin",label:"Price Min"},{key:"pMax",label:"Price Max"},{key:"units",label:"Units"},{key:"rate",label:"Sales Rate %"},{key:"monthly",label:"Monthly %"}],`seg_${si}`)} label="Export CSV"/>
                </div>
                <div style={{padding:"14px 18px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
                    {s.proj.map((p,i)=>(
                      <div key={i} style={{background:"#FFFFFF",borderRadius:8,padding:"10px 14px",border:"1px solid "+BD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:12,color:TX}}>{p.name}</div>
                          <div style={{fontSize:10,color:MU,marginTop:2}}>{fmt(p.pMin)} – {fmt(p.pMax)} · {p.units} units</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:13,fontWeight:700,color:rc(p.rate)}}>{pct(p.rate)}</div>
                          <div style={{fontSize:10,color:MU}}>{p.monthly}%/mo</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:s.color+"0d",borderRadius:8,padding:"12px 14px",border:"1px solid "+s.color+"22"}}>
                    <div style={{fontSize:11,fontWeight:600,color:s.color,marginBottom:6}}>👤 Typical Buyer Profile</div>
                    <div style={{fontSize:11,color:MU,lineHeight:1.8}}>{s.persona}</div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{background:CD,border:"1px solid "+BD,borderRadius:10,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid "+BD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:GR}}>🎯 Top Performer Strategy Notes</div>
                <DBtn onClick={()=>dlCSV([{name:"Noordinz Suites",seg:"Entry Luxury",note:"99.83% sold. Consider higher ASP on future phases."},{name:"The Lighthauz",seg:"Mid Luxury",note:"469 units absorbed 2025–1H26. Differentiate via design."},{name:"Keeperz Suites",seg:"Entry–Mid Luxury",note:"Launched at RM 1,723 max PSF. Lead with investor-yield narrative."}],[{key:"name",label:"Project"},{key:"seg",label:"Segment"},{key:"note",label:"Strategy Note"}],"performer_strategy")} label="Export CSV"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,padding:16}}>
                {[{name:"Noordinz Suites",seg:"Entry Luxury",note:"99.83% sold — validates strong sub-RM 1M demand. Consider higher ASP on future phases.",c:GR},{name:"The Lighthauz",seg:"Mid Luxury",note:"469 units absorbed 2025–1H26. Differentiate via design and lifestyle programming.",c:G},{name:"Keeperz Suites",seg:"Entry–Mid Luxury",note:"Launched at highest PSF in segment (RM 1,723 max). Lead with investor-yield narrative.",c:BL}].map((item,i)=>(
                  <div key={i} style={{background:"#FFFFFF",borderRadius:8,padding:14,border:"1px solid "+BD}}>
                    <div style={{fontSize:12,fontWeight:700,color:GR,marginBottom:2}}>{item.name}</div>
                    <div style={{fontSize:10,color:item.c,marginBottom:8,fontWeight:600}}>{item.seg}</div>
                    <div style={{fontSize:11,color:MU,lineHeight:1.7}}>{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
