'use client';
import {useEffect,useState,useCallback} from 'react';
import {Card,Typography,Stack,Box,TextField,Chip,Button} from '@mui/material';
import {LineChart} from '@/components/Charts';
import {supabase} from '@/lib/supabase';
import {iso} from '@/lib/due';
const cat=b=>b<18.5?['Underweight','info']:b<25?['Healthy','success']:b<30?['Overweight','warning']:['Obese','error'];
const ZONES=[['Underweight','under 18.5',15,18.5,'#38BDF8'],['Healthy','18.5 to 24.9',18.5,25,'#22C55E'],['Overweight','25 to 29.9',25,30,'#F59E0B'],['Obese','30 and above',30,40,'#EF4467']];
const toCm=(v,u)=>{const x=(u||'cm').trim().toLowerCase();return x==='m'?v*100:/^(ft|feet|foot)/.test(x)?v*30.48:/^in/.test(x)?v*2.54:v};
const toKg=(v,u)=>/^lb/i.test((u||'').trim())?v*0.45359237:v;
const fd=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
const Stat=({label,children,note})=><Box><Typography variant="caption" color="text.secondary" sx={{display:'block',mb:.75}}>{label}</Typography>{children}{note&&<Typography variant="body2" color="text.secondary" sx={{mt:.75}}>{note}</Typography>}</Box>;
// BMI is worked out from your latest logged Height and Weight measurements (Body measurements below).
export default function BmiCard({refresh,onSaved}){
 const [hs,setHs]=useState([]),[ws,setWs]=useState([]),[hid,setHid]=useState(null),[hv,setHv]=useState(''),[legacy,setLegacy]=useState(0);
 const load=useCallback(async()=>{
  const{data}=await supabase.from('metrics').select('id,name,unit,metric_entries(date,value)').eq('section','fitness');
  const find=re=>(data||[]).find(m=>re.test((m.name||'').trim())),hm=find(/^height/i),wm=find(/^weight/i);
  const ser=(m,conv)=>m?[...(m.metric_entries||[])].sort((a,b)=>a.date.localeCompare(b.date)).map(e=>({date:e.date,v:conv(+e.value,m.unit)})):[];
  setHs(ser(hm,toCm));setWs(ser(wm,toKg));setHid(hm?.id||null)},[]);
 useEffect(()=>{load()},[load,refresh]);
 useEffect(()=>{const x=+localStorage.getItem('chakra-height');if(x>0){setLegacy(x);setHv(String(x))}},[]);
 const saveH=async()=>{const x=parseFloat(hv);if(!(x>50&&x<260))return;let id=hid;
  if(!id){const{data}=await supabase.from('metrics').insert({name:'Height',unit:'cm',section:'fitness'}).select('id').single();id=data?.id}
  if(!id)return;await supabase.from('metric_entries').upsert({metric_id:id,date:iso(new Date()),value:x},{onConflict:'metric_id,date'});setHv('');await load();onSaved&&onSaved()};
 const hNow=hs.length?hs[hs.length-1].v:legacy,m=hNow/100,ok=m>0.5&&m<2.6,lw=ws[ws.length-1],bmi=ok&&lw?+(lw.v/(m*m)).toFixed(1):null,c=bmi?cat(bmi):null;
 const lo=ok?18.5*m*m:0,hi=ok?24.9*m*m:0,diff=bmi?(lw.v>hi?`${(lw.v-hi).toFixed(1)} kg above`:lw.v<lo?`${(lo-lw.v).toFixed(1)} kg below`:'within'):'';
 // each weight uses the height that was current on that day
 const hAt=d=>{let h=hs.length?hs[0].v:legacy;hs.forEach(x=>{if(x.date<=d)h=x.v});return h};
 const trend=ok?ws.map(w=>({date:w.date,v:+(w.v/Math.pow(hAt(w.date)/100,2)).toFixed(1)})):[];
 const vals=trend.map(x=>x.v),yMin=Math.floor(Math.min(17,...vals)),yMax=Math.ceil(Math.max(26,...vals)),xs=trend.map(x=>new Date(x.date+'T00:00'));
 const pos=bmi?Math.min(100,Math.max(0,(bmi-15)/25*100)):0;
 return <Card sx={{p:{xs:2.5,sm:3.5}}}><Typography variant="h6">Body and BMI</Typography>
  <Typography variant="body2" color="text.secondary" sx={{mt:.5}}>Worked out from your latest Height and Weight under Body measurements.</Typography>
  {bmi?<>
   <Box sx={{display:'grid',gap:{xs:3,sm:4},gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',mt:3.5}}>
    <Stat label="BMI"><Box sx={{display:'flex',alignItems:'center',gap:1.5,flexWrap:'wrap'}}><Typography variant="h3" sx={{lineHeight:1}}>{bmi}</Typography><Chip size="small" color={c[1]} label={c[0]}/></Box></Stat>
    <Stat label="Weight now" note={`Logged ${fd(lw.date)}`}><Typography variant="h5">{+lw.v.toFixed(1)} kg</Typography></Stat>
    <Stat label="Height" note={hs.length?`Logged ${fd(hs[hs.length-1].date)}`:'Saved earlier. Log it below to keep a history.'}><Typography variant="h5">{+hNow.toFixed(1)} cm</Typography></Stat>
    <Stat label="Healthy weight for your height" note={`You are ${diff} the range`}><Typography variant="h6">{lo.toFixed(1)} to {hi.toFixed(1)} kg</Typography></Stat></Box>
   <Box sx={{mt:6,px:1}}>
    <Box sx={{position:'relative',pt:5,pb:4}}>
     <Box sx={{display:'flex',height:16,borderRadius:8,overflow:'hidden',gap:'2px'}}>{ZONES.map(z=><Box key={z[0]} sx={{flex:z[3]-z[2],bgcolor:z[4]}}/>)}</Box>
     <Box sx={{position:'absolute',left:`${pos}%`,top:0,transform:'translateX(-50%)',textAlign:'center'}}><Typography variant="body2" fontWeight={800}>{bmi}</Typography><Box sx={{width:0,height:0,mx:'auto',mt:.25,borderLeft:'7px solid transparent',borderRight:'7px solid transparent',borderTop:'9px solid',borderTopColor:'text.primary'}}/></Box>
     {[18.5,25,30].map(t=><Typography key={t} variant="caption" color="text.secondary" sx={{position:'absolute',left:`${(t-15)/25*100}%`,bottom:0,transform:'translateX(-50%)'}}>{t}</Typography>)}</Box>
    <Box sx={{display:'flex',flexWrap:'wrap',columnGap:3,rowGap:1,mt:1}}>{ZONES.map(z=><Box key={z[0]} sx={{display:'flex',alignItems:'center',gap:1}}><Box sx={{width:10,height:10,borderRadius:'50%',bgcolor:z[4]}}/><Typography variant="body2" color="text.secondary"><b>{z[0]}</b> {z[1]}</Typography></Box>)}</Box></Box>
   <Typography variant="subtitle2" sx={{mt:6,mb:1.5}}>BMI over time</Typography>
   {trend.length>1?<LineChart height={280} margin={{left:50,right:24,top:56,bottom:36}} yAxis={[{min:yMin,max:yMax}]} xAxis={[{scaleType:'time',data:xs,valueFormatter:d=>d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}]}
     series={[{data:vals,area:true,color:'#14A38B',label:'Your BMI'},{data:vals.map(()=>18.5),color:'#22C55E',label:'Healthy from 18.5',showMark:false},{data:vals.map(()=>24.9),color:'#F59E0B',label:'Healthy up to 24.9',showMark:false}]}/>
    :<Typography color="text.secondary" sx={{py:3}}>Log your weight on another date to see how your BMI changes.</Typography>}
  </>:<Box sx={{mt:3}}>
   <Typography color="text.secondary" sx={{mb:2}}>{ws.length?'Add your height to see your BMI.':hs.length||legacy?'Log your weight in Body measurements below to see your BMI.':'Add your height, then log your weight in Body measurements below.'}</Typography>
   {!hs.length&&<Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" alignItems="flex-start"><TextField label="Height (cm)" type="number" value={hv} onChange={e=>setHv(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveH()} sx={{width:160}}/><Button variant="contained" onClick={saveH} sx={{height:56}}>Save height</Button></Stack>}</Box>}
 </Card>}
