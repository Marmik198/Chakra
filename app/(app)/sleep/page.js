'use client';
import {useEffect,useState,useCallback,useMemo} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,Rating,List,ListItem,ListItemText,IconButton} from '@mui/material';
import {BarChart} from '@/components/Charts';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {TabBar,Pane} from '@/components/Tabs';
import {usePaged,Pager} from '@/components/Pager';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso} from '@/lib/due';
import {dur,hm,avgTime,spread,winPos} from '@/lib/sleep';
const BLUE='#6D8EF5',t5=t=>(t||'').slice(0,5);
const Stat=({l,v,s,c})=><Card sx={{p:2.5}}><Typography variant="body2" color="text.secondary">{l}</Typography><Typography variant="h5" sx={{color:c}}>{v}</Typography><Typography variant="caption" color="text.secondary">{s}</Typography></Card>;
export default function Sleep(){
 const T=iso(new Date()),from=useMemo(()=>{const d=new Date();d.setDate(d.getDate()-29);return iso(d)},[]);
 const [rows,setRows]=useState([]),[f,setF]=useState({date:T,bed:'23:00',wake:'07:00',q:4,note:''}),[gmin,setGmin]=useState(7.5),[gmax,setGmax]=useState(8.5);
 useEffect(()=>{try{const x=JSON.parse(localStorage.getItem('chakra-sleep-range')||'null');if(x){setGmin(x[0]);setGmax(x[1])}}catch{}},[]);
 const saveR=(a,b)=>{setGmin(a);setGmax(b);try{localStorage.setItem('chakra-sleep-range',JSON.stringify([a,b]))}catch{}};
 const load=useCallback(async()=>{const{data}=await supabase.from('sleep_logs').select('*').gte('date',from).order('date');setRows((data||[]).map(r=>({...r,bedtime:t5(r.bedtime),wake_time:t5(r.wake_time)})))},[from]);
 useEffect(()=>{load()},[load]);
 const save=async()=>{await supabase.from('sleep_logs').upsert({date:f.date,bedtime:f.bed,wake_time:f.wake,minutes:dur(f.bed,f.wake),quality:f.q||null,note:f.note},{onConflict:'user_id,date'});setF({...f,note:''});load()};
 const del=r=>undoable('Night',()=>supabase.from('sleep_logs').delete().eq('id',r.id),{id:r.id,hide:()=>setRows(r=>r.filter(y=>y.id!==r.id)),restore:load});
 const pgR=usePaged([...rows].reverse());
 const l7=rows.slice(-7),l14=rows.slice(-14),last=rows[rows.length-1],avg=l7.length?l7.reduce((a,r)=>a+r.minutes,0)/l7.length:0,sta=m=>m<gmin*60?'Less':m>gmax*60?'More':'On target',scol=m=>sta(m)==='On target'?'success.main':sta(m)==='Less'?'warning.main':'info.main',ok7=l7.filter(r=>sta(r.minutes)==='On target').length;
 return <Stack spacing={3}>
  <Box><Typography variant="h4">Sleep</Typography><Typography color="text.secondary">Log when you went to bed and woke up. Total hours and 90-minute sleep cycles are worked out for you.</Typography></Box>
  <TabBar id="sleep" tabs={["Overview", "Charts", "History"]}/>
<Pane id="sleep" name="Overview"><Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr 1fr',md:'repeat(4,1fr)'}}}>
   <Stat l="Last night" v={last?hm(last.minutes):'-'} s={last?`${(last.minutes/90).toFixed(1)} cycles · ${sta(last.minutes)}`:'No data yet'} c={last?scol(last.minutes):undefined}/>
   <Stat l="7-night average" v={l7.length?hm(avg):'-'} s={`Target ${hm(gmin*60)} to ${hm(gmax*60)} · ${l7.length?sta(avg):'-'}`} c={l7.length?scol(avg):undefined}/>
   <Stat l="Nights on target" v={`${ok7} of ${l7.length}`} s="Last 7 nights" c={ok7>=5?'success.main':'warning.main'}/>
   <Stat l="Average bed / wake" v={`${avgTime(rows.map(r=>({b:r.bedtime,w:r.wake_time})),'b')} / ${avgTime(rows.map(r=>({b:r.bedtime,w:r.wake_time})),'w')}`} s={`Bedtime varies by about ${spread(rows.map(r=>({b:r.bedtime})),'b')} min`}/></Box>
  <Card sx={{p:2.5}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:2}}><Typography variant="h6">Log a night</Typography><Stack direction="row" spacing={1}><TextField label="Min hours" type="number" inputProps={{step:.25}} value={gmin} onChange={e=>saveR(+e.target.value,gmax)} sx={{width:110}}/><TextField label="Max hours" type="number" inputProps={{step:.25}} value={gmax} onChange={e=>saveR(gmin,+e.target.value)} sx={{width:110}}/></Stack></Box>
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
    <TextField label="Woke up on" type="date" InputLabelProps={{shrink:true}} value={f.date} onChange={e=>setF({...f,date:e.target.value})}/>
    <TextField label="Bedtime" type="time" InputLabelProps={{shrink:true}} value={f.bed} onChange={e=>setF({...f,bed:e.target.value})}/>
    <TextField label="Wake time" type="time" InputLabelProps={{shrink:true}} value={f.wake} onChange={e=>setF({...f,wake:e.target.value})}/>
    <Box><Typography variant="caption" color="text.secondary">Quality</Typography><br/><Rating value={f.q} onChange={(_,v)=>setF({...f,q:v||0})}/></Box>
    <TextField label="Note" value={f.note} onChange={e=>setF({...f,note:e.target.value})} sx={{flex:1,minWidth:160}}/>
    <Button variant="contained" onClick={save}>Save · {hm(dur(f.bed,f.wake))}</Button></Stack></Card>
  </Pane><Pane id="sleep" name="Charts"><Box sx={{display:'grid',gap:3,gridTemplateColumns:{md:'1fr 1fr'}}}>
   <Card sx={{p:2.5}}><Typography variant="h6">Hours slept</Typography><Typography variant="caption" color="text.secondary">Last 14 nights</Typography>
    <BarChart height={240} xAxis={[{scaleType:'band',data:l14.map(r=>r.date),valueFormatter:(d,c)=>c.location==='tick'?d.slice(8):new Date(d+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}]} series={[{id:'l',label:`Less than ${hm(gmin*60)}`,stack:'s',color:'#F59E0B',data:l14.map(r=>sta(r.minutes)==='Less'?+(r.minutes/60).toFixed(2):0),valueFormatter:v=>v?hm(v*60):null},{id:'o',label:`${hm(gmin*60)} to ${hm(gmax*60)}`,stack:'s',color:'#14A38B',data:l14.map(r=>sta(r.minutes)==='On target'?+(r.minutes/60).toFixed(2):0),valueFormatter:v=>v?hm(v*60):null},{id:'m',label:`More than ${hm(gmax*60)}`,stack:'s',color:BLUE,data:l14.map(r=>sta(r.minutes)==='More'?+(r.minutes/60).toFixed(2):0),valueFormatter:v=>v?hm(v*60):null}]}/></Card>
   <Card sx={{p:2.5}}><Typography variant="h6">Sleep window</Typography><Typography variant="caption" color="text.secondary">Bedtime to wake time, 8 PM to noon</Typography>
    <Box sx={{display:'flex',gap:.5,height:190,pl:5.5,mt:1.5,position:'relative'}}>{[['20:00',0],['00:00',25],['04:00',50],['08:00',75],['12:00',100]].map(([t,p])=><Typography key={t} variant="caption" color="text.secondary" sx={{position:'absolute',left:0,top:`calc(${p}% - 9px)`}}>{t}</Typography>)}
     {l14.map(r=>{const w=winPos(r.bedtime,r.minutes);return <Box key={r.id} title={`${r.bedtime} to ${r.wake_time}`} sx={{flex:1,position:'relative',bgcolor:'action.hover',borderRadius:1}}><Box sx={{position:'absolute',left:2,right:2,top:`${w.top}%`,height:`${w.h}%`,borderRadius:1,bgcolor:BLUE}}/></Box>})}</Box></Card></Box>
  </Pane><Pane id="sleep" name="History"><Card sx={{p:2.5}}><Typography variant="h6">Recent nights</Typography>
   <List dense>{pgR.slice.map(r=><ListItem key={r.id} disableGutters divider secondaryAction={<IconButton size="small" aria-label="Delete" onClick={()=>del(r)}><DeleteRounded fontSize="small"/></IconButton>}>
    <ListItemText primary={`${r.date.slice(5)} · ${r.bedtime} to ${r.wake_time}`} secondary={`${hm(r.minutes)} · ${(r.minutes/90).toFixed(1)} cycles${r.note?' · '+r.note:''}`}/>{r.quality?<Rating size="small" readOnly value={r.quality} sx={{mr:5}}/>:null}</ListItem>)}
    {!rows.length&&<Typography color="text.secondary" sx={{py:2}}>No nights logged yet.</Typography>}</List><Pager pg={pgR}/></Card>
 </Pane></Stack>}
