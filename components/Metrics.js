'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,Chip} from '@mui/material';
import {LineChart} from '@/components/Charts';
import {TabBar,Pane} from '@/components/Tabs';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso} from '@/lib/due';
export default function Metrics({section,defaults=[],title,onLog,tabId}){
 const [ms,setMs]=useState([]),[v,setV]=useState({}),[dt,setDt]=useState({}),[n,setN]=useState({name:'',unit:'',lo:'',hi:''}),seeded=useRef(false);
 const q=()=>supabase.from('metrics').select('*,metric_entries(date,value)').eq('section',section);
 const load=useCallback(async()=>{let{data}=await q();
  if(!data?.length&&defaults.length&&!seeded.current){seeded.current=true;await supabase.from('metrics').insert(defaults.map(([name,unit,range_lo,range_hi])=>({name,unit,range_lo,range_hi,section})));({data}=await q())}
  setMs((data||[]).sort((a,b)=>a.name.localeCompare(b.name)))},[section]);
 useEffect(()=>{load()},[load]);
 const log=async m=>{const x=parseFloat(v[m.id]);if(isNaN(x))return;await supabase.from('metric_entries').upsert({metric_id:m.id,date:dt[m.id]||iso(new Date()),value:x},{onConflict:'metric_id,date'});setV({...v,[m.id]:''});load();onLog&&onLog()};
 const add=async()=>{if(!n.name.trim())return;await supabase.from('metrics').insert({name:n.name.trim(),unit:n.unit,section,range_lo:n.lo===''?null:+n.lo,range_hi:n.hi===''?null:+n.hi});setN({name:'',unit:'',lo:'',hi:''});load()};
 const del=m=>undoable(`"${m.name}"`,()=>supabase.from('metrics').delete().eq('id',m.id),{id:m.id,hide:()=>setMs(r=>r.filter(y=>y.id!==m.id)),restore:load});
 return <Stack spacing={2}>{title&&<Typography variant="h6">{title}</Typography>}
  {tabId&&<TabBar id={tabId} tabs={['Readings','Trends','New tracker']}/>}
  <Pane id={tabId} not name="New tracker"><Box sx={{display:'grid',gap:2,gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))'}}>{ms.map(m=>{
   const e=[...(m.metric_entries||[])].sort((a,b)=>a.date.localeCompare(b.date)),l=e[e.length-1],has=m.range_lo!=null&&m.range_hi!=null,ok=l&&has?(+l.value>=m.range_lo&&+l.value<=m.range_hi):null;
   return <Card key={m.id} sx={{p:2.5}}>
    <Box sx={{display:'flex',justifyContent:'space-between'}}><Typography variant="h6">{m.name}</Typography><Button size="small" color="inherit" onClick={()=>del(m)}>Delete</Button></Box>
    {has&&<Typography variant="caption" color="text.secondary">Normal {m.range_lo} to {m.range_hi} {m.unit}</Typography>}
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{my:1}}><Typography variant="h4">{l?+l.value:'–'}</Typography><Typography color="text.secondary">{m.unit}</Typography>{ok!==null&&<Chip size="small" color={ok?'success':'error'} label={ok?'In range':'Out of range'}/>}</Stack>
    <Pane id={tabId} name="Trends">{e.length>1?<LineChart height={150} margin={{left:40,right:10,top:10,bottom:20}} xAxis={[{scaleType:'time',data:e.map(x=>new Date(x.date+'T00:00')),valueFormatter:d=>d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}]} series={[{data:e.map(x=>+x.value),area:true,color:'#14A38B'}]}/>:<Typography variant="body2" color="text.secondary" sx={{py:2}}>Log two or more readings to see a chart.</Typography>}</Pane>
    <Pane id={tabId} name="Readings"><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><TextField label="Date" type="date" InputLabelProps={{shrink:true}} value={dt[m.id]||iso(new Date())} onChange={e=>setDt({...dt,[m.id]:e.target.value})} sx={{width:150}}/><TextField label="New reading" type="number" value={v[m.id]??''} onChange={e=>setV({...v,[m.id]:e.target.value})} onKeyDown={e=>e.key==='Enter'&&log(m)} sx={{flex:1}}/><Button variant="contained" onClick={()=>log(m)}>Log</Button></Stack></Pane></Card>})}</Box></Pane>
  <Pane id={tabId} name="New tracker"><Card sx={{p:2.5}}><Typography variant="subtitle1" fontWeight={700} sx={{mb:1.5}}>Track something new</Typography>
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap"><TextField label="Name" value={n.name} onChange={e=>setN({...n,name:e.target.value})} sx={{flex:1,minWidth:160}}/><TextField label="Unit" value={n.unit} onChange={e=>setN({...n,unit:e.target.value})} sx={{width:90}}/><TextField label="Normal low" type="number" value={n.lo} onChange={e=>setN({...n,lo:e.target.value})} sx={{width:120}}/><TextField label="Normal high" type="number" value={n.hi} onChange={e=>setN({...n,hi:e.target.value})} sx={{width:120}}/><Button variant="contained" onClick={add}>Add</Button></Stack></Card></Pane></Stack>}
