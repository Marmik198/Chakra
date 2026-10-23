'use client';
import {useEffect,useState,useCallback,useMemo} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,Rating,IconButton,Tooltip} from '@mui/material';
import {BarChart} from '@/components/Charts';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {TabBar,Pane} from '@/components/Tabs';
import {usePaged,Pager} from '@/components/Pager';
import EditDialog from '@/components/EditDialog';
import EditRounded from '@mui/icons-material/EditRounded';
import DataTable from '@/components/DataTable';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso} from '@/lib/due';
import {dur,hm,avgTime,spread,mins} from '@/lib/sleep';
const BLUE='#6D8EF5',t5=t=>(t||'').slice(0,5);
const Stat=({l,v,s,c})=><Card sx={{p:2.5}}><Typography variant="body2" color="text.secondary">{l}</Typography><Typography variant="h5" sx={{color:c}}>{v}</Typography><Typography variant="caption" color="text.secondary">{s}</Typography></Card>;
const fday=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
export default function Sleep(){
 const T=iso(new Date()),from=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-29);return iso(d)},[]);
 const [rows,setRows]=useState([]),[f,setF]=useState({date:T,bed:'23:00',wake:'07:00',q:4,note:''}),[gmin,setGmin]=useState(7.5),[gmax,setGmax]=useState(8.5);
 useEffect(()=>{try{const x=JSON.parse(localStorage.getItem('chakra-sleep-range')||'null');if(x){setGmin(x[0]);setGmax(x[1])}}catch{}},[]);
 const saveR=(a,b)=>{setGmin(a);setGmax(b);try{localStorage.setItem('chakra-sleep-range',JSON.stringify([a,b]))}catch{}};
 const load=useCallback(async()=>{const{data}=await supabase.from('sleep_logs').select('*').gte('date',from).order('date');setRows((data||[]).map(r=>({...r,bedtime:t5(r.bedtime),wake_time:t5(r.wake_time)})))},[from]);
 useEffect(()=>{load()},[load]);
 const [editR,setEditR]=useState(null);
 const save=async()=>{await supabase.from('sleep_logs').upsert({date:f.date,bedtime:f.bed,wake_time:f.wake,minutes:dur(f.bed,f.wake),quality:f.q||null,note:f.note},{onConflict:'user_id,date'});setF({...f,note:''});load()};
 const del=r=>undoable('Night',()=>supabase.from('sleep_logs').delete().eq('id',r.id),{id:r.id,hide:()=>setRows(r=>r.filter(y=>y.id!==r.id)),restore:load});
 const pgR=usePaged([...rows].reverse());
 const d7=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-6);return iso(d)},[]),days14=useMemo(()=>Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);return iso(d)}),[]),byDay=useMemo(()=>Object.fromEntries(rows.map(r=>[r.date,r])),[rows]);
 // the last 7 calendar days, counting a night as met when you slept at least your minimum (more than the maximum still counts as met)
 const l7=rows.filter(r=>r.date>=d7),last=rows[rows.length-1],lo=gmin*60,hi=gmax*60,avg=l7.length?l7.reduce((a,r)=>a+r.minutes,0)/l7.length:0,sta=m=>m<lo?'Less':m>hi?'More':'On target',scol=m=>sta(m)==='On target'?'success.main':sta(m)==='Less'?'warning.main':'info.main',metN=l7.filter(r=>r.minutes>=lo).length,inN=l7.filter(r=>r.minutes>=lo&&r.minutes<=hi).length,aboveN=l7.filter(r=>r.minutes>hi).length,belowN=l7.length-metN;
 const winPos=r=>{const s0=(mins(r.bedtime)-1200+1440)%1440,st=Math.min(s0,950),len=Math.min(r.minutes,960-st);return{top:st/9.6,h:Math.max(len/9.6,1.5)}};
 const TICKS=[['8 PM',0],['10 PM',12.5],['12 AM',25],['2 AM',37.5],['4 AM',50],['6 AM',62.5],['8 AM',75],['10 AM',87.5],['12 PM',100]],wd=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{weekday:'short'}).slice(0,2);
 const ser=(id,label,color,test)=>({id,label,stack:'s',color,data:days14.map(d=>{const r=byDay[d];return r&&test(r.minutes)?+(r.minutes/60).toFixed(2):0}),valueFormatter:v=>v?hm(v*60):null}),ymax=Math.max(10,Math.ceil(Math.max(0,...days14.map(d=>byDay[d]?byDay[d].minutes/60:0))+1));
 return <Stack spacing={3}>
  <Box><Typography variant="h4">Sleep</Typography><Typography color="text.secondary">Log when you went to bed and woke up. Total hours and 90-minute sleep cycles are worked out for you.</Typography></Box>
  <TabBar id="sleep" tabs={["Overview", "Charts", "History"]}/>
<Pane id="sleep" name="Overview"><Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr 1fr',md:'repeat(4,1fr)'}}}>
   <Stat l="Last night" v={last?hm(last.minutes):'-'} s={last?`${(last.minutes/90).toFixed(1)} cycles · ${sta(last.minutes)}`:'No data yet'} c={last?scol(last.minutes):undefined}/>
   <Stat l="7-day average" v={l7.length?hm(avg):'-'} s={`Target ${hm(gmin*60)} to ${hm(gmax*60)} · ${l7.length?sta(avg):'-'}`} c={l7.length?scol(avg):undefined}/>
   <Stat l="Nights target met" v={`${metN} of ${l7.length}`} s={`Last 7 days · ${inN} in range · ${aboveN} above · ${belowN} below`} c={metN>=5?'success.main':metN>0?'info.main':'warning.main'}/>
   <Stat l="Average bed / wake" v={`${avgTime(rows.map(r=>({b:r.bedtime,w:r.wake_time})),'b')} / ${avgTime(rows.map(r=>({b:r.bedtime,w:r.wake_time})),'w')}`} s={`Bedtime varies by about ${spread(rows.map(r=>({b:r.bedtime})),'b')} min`}/></Box>
  <Card sx={{p:2.5}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:2}}><Typography variant="h6">Log a night</Typography><Stack direction="row" spacing={1}><TextField label="Min hours" type="number" inputProps={{step:.25}} value={gmin} onChange={e=>saveR(+e.target.value,gmax)} sx={{width:110}}/><TextField label="Max hours" type="number" inputProps={{step:.25}} value={gmax} onChange={e=>saveR(gmin,+e.target.value)} sx={{width:110}}/></Stack></Box>
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
    <TextField label="Woke up on" type="date" InputLabelProps={{shrink:true}} value={f.date} onChange={e=>setF({...f,date:e.target.value})}/>
    <TextField label="Bedtime" type="time" InputLabelProps={{shrink:true}} value={f.bed} onChange={e=>setF({...f,bed:e.target.value})}/>
    <TextField label="Wake time" type="time" InputLabelProps={{shrink:true}} value={f.wake} onChange={e=>setF({...f,wake:e.target.value})}/>
    <Box><Typography variant="caption" color="text.secondary">Quality</Typography><br/><Rating value={f.q} onChange={(_,v)=>setF({...f,q:v||0})}/></Box>
    <TextField label="Note" value={f.note} onChange={e=>setF({...f,note:e.target.value})} sx={{flex:1,minWidth:160}}/>
    <Button variant="contained" onClick={save}>Save · {hm(dur(f.bed,f.wake))}</Button></Stack></Card>
  </Pane><Pane id="sleep" name="Charts"><Stack spacing={3}>
   <Card sx={{p:{xs:2.5,md:3.5}}}><Typography variant="h6">Hours slept</Typography><Typography variant="body2" color="text.secondary" sx={{mb:1}}>Last 14 days · target {hm(lo)} to {hm(hi)}</Typography>
    <BarChart height={340} margin={{left:52,right:16,top:60,bottom:44}} grid={{horizontal:true}} yAxis={[{min:0,max:ymax,tickMinStep:1,valueFormatter:v=>`${v}h`}]}
     xAxis={[{scaleType:'band',data:days14,categoryGapRatio:.35,valueFormatter:(d,c)=>c.location==='tick'?d.slice(8):new Date(d+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}]}
     series={[ser('l',`Less than ${hm(lo)}`,'#F59E0B',m=>m<lo),ser('o',`${hm(lo)} to ${hm(hi)}`,'#14A38B',m=>m>=lo&&m<=hi),ser('m',`More than ${hm(hi)}`,BLUE,m=>m>hi)]}
     slotProps={{legend:{direction:'row',position:{vertical:'top',horizontal:'middle'},padding:0,itemMarkWidth:12,itemMarkHeight:12,labelStyle:{fontSize:13}}}}/></Card>
   <Card sx={{p:{xs:2.5,md:3.5}}}><Typography variant="h6">Sleep window</Typography><Typography variant="body2" color="text.secondary" sx={{mb:2.5}}>When you fell asleep and woke up each night, from 8 PM to noon. Hover or tap a bar for the times.</Typography>
    <Box sx={{overflowX:'auto'}}><Box sx={{minWidth:560,display:'grid',gridTemplateColumns:'56px 1fr',columnGap:1.5}}>
     <Box sx={{position:'relative',height:300}}>{TICKS.map(([t,p])=><Typography key={t} variant="caption" color="text.secondary" sx={{position:'absolute',right:0,top:`calc(${p}% - 9px)`,whiteSpace:'nowrap'}}>{t}</Typography>)}</Box>
     <Box><Box sx={{position:'relative',height:300}}>
       {TICKS.map(([t,p])=><Box key={t} sx={{position:'absolute',left:0,right:0,top:`${p}%`,borderTop:'1px dashed',borderColor:'divider'}}/>)}
       <Box sx={{position:'absolute',inset:0,display:'grid',gridTemplateColumns:`repeat(${days14.length},1fr)`,columnGap:'10px',px:'6px'}}>{days14.map(d=>{const r=byDay[d],w=r&&winPos(r);return <Box key={d} sx={{position:'relative'}}>{r&&<Tooltip title={`${fday(d)} · ${r.bedtime} to ${r.wake_time} · ${hm(r.minutes)}`} arrow><Box sx={{position:'absolute',left:'10%',right:'10%',top:`${w.top}%`,height:`${w.h}%`,borderRadius:'8px',bgcolor:r.minutes<lo?'#F59E0B':r.minutes<=hi?'#14A38B':BLUE,cursor:'pointer'}}/></Tooltip>}</Box>})}</Box></Box>
      <Box sx={{display:'grid',gridTemplateColumns:`repeat(${days14.length},1fr)`,columnGap:'10px',px:'6px',mt:1.5}}>{days14.map(d=><Typography key={d} variant="caption" color="text.secondary" align="center" sx={{lineHeight:1.25}}>{d.slice(8)}<br/>{wd(d)}</Typography>)}</Box></Box></Box></Box>
    <Box sx={{display:'flex',flexWrap:'wrap',columnGap:3,rowGap:1,mt:2.5}}>{[['#F59E0B',`Less than ${hm(lo)}`],['#14A38B',`${hm(lo)} to ${hm(hi)}`],[BLUE,`More than ${hm(hi)}`]].map(([c,t])=><Box key={t} sx={{display:'flex',alignItems:'center',gap:1}}><Box sx={{width:12,height:12,borderRadius:'4px',bgcolor:c}}/><Typography variant="body2" color="text.secondary">{t}</Typography></Box>)}</Box></Card></Stack>
  </Pane><Pane id="sleep" name="History"><Card sx={{p:2.5}}><Typography variant="h6">Recent nights</Typography>
   <DataTable rows={pgR.slice} empty="No nights logged yet." actionsWidth={96} actions={r=><Stack direction="row" spacing={.5}><IconButton size="small" aria-label="Edit" onClick={()=>setEditR(r)}><EditRounded fontSize="small"/></IconButton><IconButton size="small" aria-label="Delete" onClick={()=>del(r)}><DeleteRounded fontSize="small"/></IconButton></Stack>}
    columns={[{label:'Date',render:r=>fday(r.date)},{label:'Bedtime',render:r=>String(r.bedtime).slice(0,5)},{label:'Wake up',render:r=>String(r.wake_time).slice(0,5)},{label:'Slept',render:r=>`${hm(r.minutes)} · ${(r.minutes/90).toFixed(1)} cycles`},{label:'Quality',render:r=>r.quality?<Rating size="small" readOnly value={r.quality}/>:'–'},{label:'Note',render:r=>r.note||'–'}]}/><Pager pg={pgR}/></Card>
 </Pane><EditDialog open={!!editR} title="Edit night" initial={editR&&{date:editR.date,bed:String(editR.bedtime).slice(0,5),wake:String(editR.wake_time).slice(0,5),q:editR.quality||0,note:editR.note||''}}
   fields={[{key:'date',label:'Date',type:'date',required:true},{key:'bed',label:'Bedtime',type:'time',required:true},{key:'wake',label:'Wake up',type:'time',required:true},{key:'q',label:'Quality',type:'rating'},{key:'note',label:'Note',type:'multiline'}]}
   onSave={async v=>{const r=await supabase.from('sleep_logs').update({date:v.date,bedtime:v.bed,wake_time:v.wake,minutes:dur(v.bed,v.wake),quality:v.q||null,note:v.note||null}).eq('id',editR.id);if(r?.error)throw new Error('Could not save. Is another night already logged on that date?');setEditR(null);load()}} onClose={()=>setEditR(null)}/>
 </Stack>}
