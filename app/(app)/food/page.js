'use client';
import {useEffect,useState,useCallback,useMemo} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,Select,MenuItem,Chip,LinearProgress,List,ListItem,ListItemText,IconButton,FormControlLabel,Checkbox} from '@mui/material';
import {BarChart} from '@/components/Charts';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {TabBar,Pane} from '@/components/Tabs';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso,lastDays} from '@/lib/due';
const MEALS=['Breakfast','Lunch','Snack','Dinner'];
export default function Food(){
 const T=iso(new Date()),D=useMemo(()=>lastDays(7),[]),W28=useMemo(()=>lastDays(28),[]);
 const [rows,setRows]=useState([]),[goal,setGoal]=useState(2200),[f,setF]=useState({meal:'Lunch',item:'',kcal:'',protein:'',eo:false});
 useEffect(()=>{const g=+localStorage.getItem('chakra-goal');if(g)setGoal(g)},[]);
 const load=useCallback(async()=>{const{data}=await supabase.from('food_log').select('*').gte('date',W28[0]).order('date',{ascending:false});setRows(data||[])},[W28]);
 useEffect(()=>{load()},[load]);
 const ins=async x=>{await supabase.from('food_log').insert({date:T,...x});load()};
 const add=()=>{const k=+f.kcal;if(!f.item.trim()||!(k>=0)||f.kcal==='')return;ins({meal:f.meal,item:f.item.trim(),kcal:k,protein:+f.protein||0,eaten_out:f.eo});setF({...f,item:'',kcal:'',protein:'',eo:false})};
 const del=x=>undoable('Food entry',()=>supabase.from('food_log').delete().eq('id',x.id),{id:x.id,hide:()=>setRows(r=>r.filter(y=>y.id!==x.id)),restore:load});
 const today=rows.filter(x=>x.date===T),sum=(l,k)=>l.reduce((a,x)=>a+ +x[k],0),kc=sum(today,'kcal');
 const recent=[...new Map(rows.map(x=>[x.item,x])).values()].slice(0,6);
 const isEo=x=>x.eaten_out||x.meal==='Eaten out',eoDay=D.map(d=>rows.filter(x=>x.date===d&&isEo(x)).length),wk=n=>{const to=new Date();to.setDate(to.getDate()-7*n);const fr=new Date(to);fr.setDate(fr.getDate()-6);return rows.filter(x=>x.date>=iso(fr)&&x.date<=iso(to)&&isEo(x)).length},weeks=[3,2,1,0].map(n=>wk(n));
 const eoCard=<Card sx={{p:2.5,mt:3}}><Typography variant="h6">Eating out</Typography><Typography variant="h4" sx={{my:.5}}>{weeks[3]} {weeks[3]===1?'time':'times'} <Typography component="span" color="text.secondary">this week</Typography></Typography><Typography variant="body2" color="text.secondary">{weeks[2]} last week{weeks[3]>weeks[2]?' · more than last week':weeks[3]<weeks[2]?' · less than last week':' · same as last week'}</Typography>
  <BarChart height={200} xAxis={[{scaleType:'band',data:D,valueFormatter:(d,c)=>c.location==='tick'?d.slice(8):new Date(d+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}]} series={[{data:eoDay,color:'#F97316',label:'Times eaten out'}]} slotProps={{legend:{hidden:true}}}/>
  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mt:1}}>{weeks.map((n,i)=><Chip key={i} size="small" variant={i===3?'filled':'outlined'} label={`${i===3?'This week':i===2?'Last week':`${3-i} weeks ago`}: ${n}`}/>)}</Stack></Card>;
 return <Stack spacing={3}><Box><Typography variant="h4">Food</Typography><Typography color="text.secondary">Log meals by type and watch your daily calories.</Typography></Box>
  <TabBar id="food" tabs={["Today", "Trends", "Favourites"]}/>
<Pane id="food" name="Today"><Card sx={{p:2.5}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Typography variant="h6">Today</Typography><TextField label="Daily goal (kcal)" type="number" value={goal} onChange={e=>{setGoal(+e.target.value);localStorage.setItem('chakra-goal',e.target.value)}} sx={{width:160}}/></Box>
   <Typography variant="h4" sx={{my:1}}>{Math.round(kc)} <Typography component="span" color="text.secondary">/ {goal} kcal · {Math.round(sum(today,'protein'))} g protein</Typography></Typography>
   <LinearProgress variant="determinate" color={kc>goal?'error':'secondary'} value={Math.min(100,kc/goal*100)} sx={{height:10,borderRadius:5}}/></Card>
  <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1.5}}>Add food</Typography>
   {recent.length>0&&<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mb:2}}>{recent.map(x=><Chip key={x.item} label={`+ ${x.item} · ${x.kcal}`} onClick={()=>ins({meal:x.meal==='Eaten out'?'Lunch':x.meal,item:x.item,kcal:x.kcal,protein:x.protein,eaten_out:!!x.eaten_out||x.meal==='Eaten out'})}/>)}</Stack>}
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap"><Select value={f.meal} onChange={e=>setF({...f,meal:e.target.value})}>{MEALS.map(m=><MenuItem key={m} value={m}>{m}</MenuItem>)}</Select>
    <TextField label="Food item" value={f.item} onChange={e=>setF({...f,item:e.target.value})} sx={{flex:1,minWidth:180}}/><TextField label="kcal" type="number" value={f.kcal} onChange={e=>setF({...f,kcal:e.target.value})} sx={{width:100}}/><TextField label="Protein g" type="number" value={f.protein} onChange={e=>setF({...f,protein:e.target.value})} sx={{width:110}}/><FormControlLabel control={<Checkbox checked={f.eo} onChange={e=>setF({...f,eo:e.target.checked})}/>} label="Eaten out"/><Button variant="contained" onClick={add}>Add</Button></Stack></Card>
  <Box sx={{display:'grid',gap:2,gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>{MEALS.map(m=>{const l=today.filter(x=>(x.meal==='Eaten out'?'Lunch':x.meal)===m);return <Card key={m} sx={{p:2}}><Box sx={{display:'flex',justifyContent:'space-between'}}><Typography fontWeight={700}>{m}</Typography><Typography color="text.secondary">{Math.round(sum(l,'kcal'))} kcal</Typography></Box>
   <List dense>{l.map(x=><ListItem key={x.id} disableGutters secondaryAction={<IconButton size="small" aria-label="Delete" onClick={()=>del(x)}><DeleteRounded fontSize="small"/></IconButton>}><ListItemText primary={x.item} secondary={`${Math.round(x.kcal)} kcal${x.eaten_out||x.meal==='Eaten out'?' · eaten out':''}`}/></ListItem>)}{!l.length&&<Typography variant="body2" color="text.secondary">Nothing yet.</Typography>}</List></Card>})}</Box>
  </Pane><Pane id="food" name="Favourites"><Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1.5}}>Foods you eat often</Typography><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{recent.map(x=><Chip key={x.item} label={`+ ${x.item} · ${x.kcal}`} onClick={()=>ins({meal:x.meal==='Eaten out'?'Lunch':x.meal,item:x.item,kcal:x.kcal,protein:x.protein,eaten_out:!!x.eaten_out||x.meal==='Eaten out'})}/>)}</Stack>{!recent.length&&<Typography color="text.secondary">Foods you log will appear here.</Typography>}</Card></Pane><Pane id="food" name="Trends"><Card sx={{p:2.5}}><Typography variant="h6">Calories, last 7 days</Typography><BarChart height={220} xAxis={[{scaleType:'band',data:D.map(d=>d.slice(5))}]} series={[{data:D.map(d=>sum(rows.filter(x=>x.date===d),'kcal')),color:'#14A38B'}]}/></Card>{eoCard}</Pane></Stack>}
