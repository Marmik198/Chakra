'use client';
import {useEffect,useState,useCallback} from 'react';
import {Card,Typography,TextField,Button,MenuItem,Chip,Stack,Box,IconButton} from '@mui/material';
import {LineChart} from '@/components/Charts';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import Metrics from '@/components/Metrics';
import BmiCard from '@/components/BmiCard';
import {TabBar,Pane} from '@/components/Tabs';
import {usePaged,Pager} from '@/components/Pager';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso} from '@/lib/due';
const LIB={Chest:['Bench press','Incline press','Decline press','Pec deck','Cable fly','Dips','Push-ups'],Triceps:['Triceps pushdown','Skull crushers','Overhead triceps extension','Close-grip bench press','Triceps kickback','Bench dips','Diamond push-ups'],Core:['Plank','Forearm plank','Side plank','Pull-ups','Crunches','Leg raises','Hanging leg raises','Russian twists','Ab wheel rollout'],Biceps:['Barbell curl','Dumbbell curl','Hammer curl','Preacher curl','Concentration curl','Incline dumbbell curl','Cable curl','Reverse curl'],Legs:['Lunges','Sumo squats','Squats','Power squats','Leg press','Leg extension','Leg curl','Calf raises','Glute bridge','Hip thrust'],Back:['Deadlift','Lat pulldown','Seated cable row','Barbell row','T-bar row','Dumbbell row','Chin-ups','Straight-arm pulldown','Hyperextension'],Shoulder:['Overhead press','Lateral raise','Front raise','Rear delt fly','Arnold press','Upright row','Face pull','Shrugs'],Cardio:['Cycle','Run','Swim']};
const fd=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}),fdl=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
const n0=n=>Math.round(n).toLocaleString('en-IN');
export default function Fitness(){
 const [k,setK]=useState(0),[g,setG]=useState('Chest'),[ex,setEx]=useState('Bench press'),[wd,setWd]=useState(iso(new Date())),[r,setR]=useState(''),[w,setW]=useState(''),[sets,setSets]=useState([]),[rows,setRows]=useState([]),[pg,setPg]=useState('Chest');
 const cardio=g==='Cardio',u=cardio?'km':'kg';
 const load=useCallback(async()=>{const{data}=await supabase.from('workouts').select('*').gte('date',iso(new Date(Date.now()-365*864e5))).order('date');setRows(data||[])},[]);
 useEffect(()=>{load()},[load]);
 const exList=c=>[...LIB[c],...new Set(rows.filter(x=>x.muscle_group===c&&!LIB[c].includes(x.exercise)).map(x=>x.exercise))];
 const addSet=()=>{if(r==='')return;setSets(s=>[...s,{r:+r,w:+w||0}]);setR('');setW('')};
 const save=async()=>{if(!sets.length||!ex)return;await supabase.from('workouts').insert({date:wd,muscle_group:g,exercise:ex,sets});setSets([]);load()};
 const del=x=>undoable('Workout',()=>supabase.from('workouts').delete().eq('id',x.id),{id:x.id,hide:()=>setRows(r=>r.filter(y=>y.id!==x.id)),restore:load});
 const sortedW=[...rows].sort((a,b)=>b.date.localeCompare(a.date)),pgW=usePaged(sortedW),dates=[...new Set(pgW.slice.map(x=>x.date))];
 const sessions=e=>{const m={};rows.filter(x=>x.exercise===e).forEach(x=>{(m[x.date]=m[x.date]||[]).push(...x.sets)});return Object.entries(m).map(([date,s])=>({date,sets:s})).sort((a,b)=>a.date.localeCompare(b.date))};
 return <Stack spacing={3}>
  <Box><Typography variant="h4">Fitness</Typography><Typography color="text.secondary">Track your body, log sets by day, and see your progress.</Typography></Box>
  <TabBar id="fitness" tabs={['Measurements','Log workout','Progress']}/>
  <Pane id="fitness" name="Measurements"><Stack spacing={3}><BmiCard refresh={k}/>
   <Metrics onLog={()=>setK(x=>x+1)} section="fitness" title="Body measurements" defaults={[['Weight','kg',null,null],['Waist','cm',null,null],['Body fat','%',null,null]]}/></Stack></Pane>
  <Pane id="fitness" name="Log workout"><Stack spacing={3}>
   <Card sx={{p:2.5,maxWidth:760}}><Typography variant="h6" sx={{mb:2}}>Log sets</Typography>
    <Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr',md:'1fr 1fr 1.4fr'}}}>
     <TextField label="Date" type="date" InputLabelProps={{shrink:true}} value={wd} onChange={e=>setWd(e.target.value)}/>
     <TextField select label="Category" value={g} onChange={e=>{setG(e.target.value);setEx(LIB[e.target.value][0]);setSets([])}}>{Object.keys(LIB).map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField>
     <TextField select label="Exercise" value={ex} onChange={e=>setEx(e.target.value)}>{exList(g).map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Box>
    <Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr 1fr',sm:'1fr 1fr auto'},mt:2,alignItems:'center'}}>
     <TextField label={cardio?'Minutes':'Reps'} type="number" value={r} onChange={e=>setR(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSet()}/>
     <TextField label={cardio?'Distance (km)':'Weight (kg)'} type="number" value={w} onChange={e=>setW(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSet()}/>
     <Button variant="outlined" onClick={addSet} sx={{gridColumn:{xs:'1 / -1',sm:'auto'}}}>Add set</Button></Box>
    {sets.length>0&&<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mt:2}}>{sets.map((s,i)=><Chip key={i} label={`Set ${i+1}: ${s.r}${cardio?' min':' reps'} · ${s.w} ${u}`} onDelete={()=>setSets(sets.filter((_,q)=>q!==i))}/>)}</Stack>}
    {sets.length>0&&<Button variant="contained" fullWidth sx={{mt:2}} onClick={save}>Save {ex} on {fd(wd)}</Button>}</Card>
   <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1}}>Workout log</Typography>
    {dates.map(d=><Box key={d} sx={{py:1.5,borderTop:1,borderColor:'divider'}}><Typography fontWeight={700} sx={{mb:.5}}>{fdl(d)}</Typography>
     {pgW.slice.filter(x=>x.date===d).map(x=><Box key={x.id} sx={{display:'flex',alignItems:'center',gap:1,py:.5}}><Box sx={{flex:1}}><Typography><b>{x.exercise}</b> <Typography component="span" variant="body2" color="text.secondary">{x.muscle_group}</Typography></Typography><Typography variant="body2" color="text.secondary">{x.sets.map((s,i)=>x.muscle_group==='Cardio'?`${s.r} min${s.w?` · ${s.w} km`:''}`:`${s.r} × ${s.w} kg`).join('  ·  ')}</Typography></Box><IconButton size="small" aria-label="Delete" onClick={()=>del(x)}><DeleteRounded fontSize="small"/></IconButton></Box>)}</Box>)}
    {!dates.length&&<Typography color="text.secondary" sx={{py:2}}>No workouts logged yet.</Typography>}<Pager pg={pgW}/></Card></Stack></Pane>
  <Pane id="fitness" name="Progress"><Stack spacing={3}>
   <Card sx={{p:2.5}}><TextField select label="Category" value={pg} onChange={e=>setPg(e.target.value)} sx={{minWidth:220}}>{Object.keys(LIB).map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField>
    <Typography variant="body2" color="text.secondary" sx={{mt:1}}>Every exercise you have logged under {pg}, with your best result and a chart by date.</Typography></Card>
   <Box sx={{display:'grid',gap:2,gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))'}}>{exList(pg).map(e=>{const ss=sessions(e);if(!ss.length)return null;const cd=pg==='Cardio';
    const mx=ss.map(s=>({date:s.date,v:cd?s.sets.reduce((a,x)=>a+x.w,0):Math.max(...s.sets.map(x=>x.w))}));
    let best=null,vol=null,lon=null;ss.forEach(s=>{s.sets.forEach(x=>{if(!best||x.w>best.w||(x.w===best.w&&x.r>best.r))best={...x,date:s.date}});const v=s.sets.reduce((a,x)=>a+x.r*x.w,0),m=s.sets.reduce((a,x)=>a+x.r,0);if(!vol||v>vol.v)vol={v,date:s.date};if(!lon||m>lon.v)lon={v:m,date:s.date}});
    const far=mx.reduce((a,b)=>b.v>a.v?b:a,mx[0]);
    return <Card key={e} sx={{p:2.5}}><Typography variant="h6">{e}</Typography>
     <Stack spacing={.5} sx={{my:1}}>{cd?<><Typography variant="body2"><b>Farthest:</b> {far.v} km on {fd(far.date)}</Typography><Typography variant="body2"><b>Longest:</b> {lon.v} min on {fd(lon.date)}</Typography></>:<><Typography variant="body2"><b>Best lift:</b> {best.w} kg × {best.r} on {fd(best.date)}</Typography><Typography variant="body2"><b>Best session volume:</b> {n0(vol.v)} kg on {fd(vol.date)}</Typography></>}<Typography variant="body2" color="text.secondary">{ss.length} session{ss.length>1?'s':''}</Typography></Stack>
     {ss.length>1?<LineChart height={170} margin={{left:40,right:10,top:10,bottom:20}} xAxis={[{scaleType:'time',data:mx.map(m=>new Date(m.date+'T00:00')),valueFormatter:d=>d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}]} series={[{data:mx.map(m=>m.v),area:true,color:'#14A38B',label:cd?'km':'Best set (kg)'}]} slotProps={{legend:{hidden:true}}}/>:<Typography variant="body2" color="text.secondary" sx={{py:1}}>Log this on two or more dates to see a chart.</Typography>}</Card>})}</Box>
   {!exList(pg).some(e=>sessions(e).length)&&<Typography color="text.secondary">Nothing logged under {pg} yet.</Typography>}</Stack></Pane>
 </Stack>}
