'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,Chip,IconButton} from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import Clamp from '@/components/Clamp';
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
  <Pane id={tabId} not name="New tracker"><Box sx={{display:'grid',gap:2,gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,320px),1fr))',alignItems:'start'}}>{ms.map(m=>{
   const e=[...(m.metric_entries||[])].sort((a,b)=>a.date.localeCompare(b.date)),l=e[e.length-1],has=m.range_lo!=null&&m.range_hi!=null,ok=l&&has?(+l.value>=m.range_lo&&+l.value<=m.range_hi):null;
   return <Card key={m.id} sx={{p:2.5,minWidth:0}}>
    <Box sx={{display:'flex',alignItems:'flex-start',gap:1}}><Clamp lines={2} sx={{typography:'h6',flex:1}}>{m.name}</Clamp><IconButton size="small" aria-label={`Delete ${m.name}`} onClick={()=>del(m)} sx={{mt:-.5,mr:-.75}}><DeleteRounded fontSize="small"/></IconButton></Box>
    <Box sx={{display:'flex',alignItems:'center',columnGap:1.5,rowGap:.5,flexWrap:'wrap',mt:1}}><Typography variant="h4" sx={{lineHeight:1.1}}>{l?+l.value:'–'}</Typography>{m.unit&&<Typography color="text.secondary">{m.unit}</Typography>}{ok!==null&&<Chip size="small" color={ok?'success':'error'} label={ok?'In range':'Out of range'}/>}</Box>
    {has&&<Typography variant="caption" color="text.secondary" sx={{display:'block',mt:.75}}>Normal {m.range_lo} to {m.range_hi} {m.unit}</Typography>}
    <Pane id={tabId} name="Trends"><Box sx={{mt:1.5}}>{e.length>1?<LineChart height={150} margin={{left:40,right:10,top:10,bottom:20}} xAxis={[{scaleType:'time',data:e.map(x=>new Date(x.date+'T00:00')),valueFormatter:d=>d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}]} series={[{data:e.map(x=>+x.value),area:true,color:'#14A38B'}]}/>:<Typography variant="body2" color="text.secondary" sx={{py:2}}>Log two or more readings to see a chart.</Typography>}</Box></Pane>
    <Pane id={tabId} name="Readings"><Box sx={{mt:2,display:'grid',gap:1.5,gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))'}}>
     <TextField fullWidth label="Date" type="date" InputLabelProps={{shrink:true}} value={dt[m.id]||iso(new Date())} onChange={ev=>setDt({...dt,[m.id]:ev.target.value})}/>
     <TextField fullWidth label={m.unit?`Reading (${m.unit})`:'Reading'} type="number" inputProps={{step:'any',inputMode:'decimal'}} value={v[m.id]??''} onChange={ev=>setV({...v,[m.id]:ev.target.value})} onKeyDown={ev=>ev.key==='Enter'&&log(m)}/>
     <Button variant="contained" onClick={()=>log(m)} sx={{gridColumn:'1 / -1'}}>Log reading</Button></Box></Pane></Card>})}</Box></Pane>
  <Pane id={tabId} name="New tracker"><Card sx={{p:2.5,maxWidth:640}}><Typography variant="subtitle1" fontWeight={700} sx={{mb:2}}>Track something new</Typography>
   <Box sx={{display:'grid',gap:2,gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))'}}>
    <TextField label="Name" value={n.name} onChange={e=>setN({...n,name:e.target.value})} sx={{gridColumn:'1 / -1'}}/>
    <TextField label="Unit" value={n.unit} onChange={e=>setN({...n,unit:e.target.value})}/>
    <TextField label="Normal low" type="number" value={n.lo} onChange={e=>setN({...n,lo:e.target.value})}/>
    <TextField label="Normal high" type="number" value={n.hi} onChange={e=>setN({...n,hi:e.target.value})}/>
    <Button variant="contained" onClick={add} sx={{gridColumn:'1 / -1',justifySelf:'start',px:4}}>Add tracker</Button></Box></Card></Pane></Stack>}
