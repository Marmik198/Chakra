'use client';
import {useEffect,useState,useCallback,useMemo} from 'react';
import {Card,Typography,Tabs,Tab,TextField,Button,Select,MenuItem,ToggleButton,ToggleButtonGroup,FormControlLabel,Switch,Checkbox,IconButton,Stack,Box,Chip,Dialog,DialogTitle,DialogContent,DialogActions,Table,TableBody,TableCell,TableHead,TableRow} from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import {rescheduleSoon} from '@/lib/native';
import {TabBar,Pane} from '@/components/Tabs';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {isDue,iso,lastDays} from '@/lib/due';
const WD=['Su','Mo','Tu','We','Th','Fr','Sa'],CY={daily:'Daily',interval:'Every N days',weekly:'Weekly',monthly:'Monthly',yearly:'Yearly',once:'One time',todo:'To-do (no repeat)'};
const blank={start_date:iso(new Date()),title:'',cycle:'daily',interval_n:2,weekdays:[],month_day:1,remind_time:'',remind:false};
export default function Tasks(){
 const D=useMemo(()=>lastDays(14),[]),T=D[13];
 const [lists,setLists]=useState([]),[tasks,setTasks]=useState([]),[log,setLog]=useState({}),[cur,setCur]=useState(0),[nl,setNl]=useState(''),[f,setF]=useState(blank),[sel,setSel]=useState(null),[openL,setOpenL]=useState(false);
 const load=useCallback(async()=>{
  const[a,b,c]=await Promise.all([supabase.from('task_lists').select('*').order('created_at'),supabase.from('tasks').select('*').order('created_at'),supabase.from('task_log').select('task_id,date').gte('date',D[0])]);
  setLists(a.data||[]);setTasks(b.data||[]);const m={};(c.data||[]).forEach(r=>m[r.task_id+r.date]=1);setLog(m);rescheduleSoon()},[D]);
 useEffect(()=>{load()},[load]);
 const L=lists[cur],mine=tasks.filter(t=>L&&t.list_id===L.id),set=(k,v)=>setF(p=>({...p,[k]:v}));
 const addList=async()=>{if(!nl.trim())return;await supabase.from('task_lists').insert({name:nl.trim()});setNl('');setOpenL(false);await load();setCur(lists.length)};
 const addTask=async()=>{if(!f.title.trim()||!L)return;await supabase.from('tasks').insert({list_id:L.id,title:f.title.trim(),cycle:f.cycle,start_date:f.start_date||iso(new Date()),interval_n:+f.interval_n||1,weekdays:f.weekdays.length?f.weekdays:[new Date().getDay()],month_day:+f.month_day||1,remind:!!f.remind&&!!f.remind_time,remind_time:f.remind_time||null});setF(blank);load()};
 const cell=async(t,d)=>{const k=t.id+d,on=!!log[k];if(!on&&!(isDue(t,d)&&d<=T))return;setLog(l=>{const n={...l};on?delete n[k]:n[k]=1;return n});const r=await(on?supabase.from('task_log').delete().match({task_id:t.id,date:d}):supabase.from('task_log').insert({task_id:t.id,date:d}));if(r?.error)load()};
 const del=t=>undoable('Task',()=>supabase.from('tasks').delete().eq('id',t.id),{id:t.id,hide:()=>setTasks(r=>r.filter(y=>y.id!==t.id)),restore:load});
 return <Stack spacing={3}>
  <Box><Typography variant="h4">Tasks</Typography><Typography color="text.secondary">Task lists with repeats, reminders and a day-by-day log.</Typography></Box>
  <Box><Button variant="contained" startIcon={<AddRounded/>} onClick={()=>setOpenL(true)}>New list</Button></Box>
  <Card sx={{p:1.5,display:'flex',alignItems:'center',gap:2,flexWrap:'wrap'}}>
   <Tabs value={lists.length?cur:false} onChange={(_,v)=>setCur(v)} variant="scrollable" sx={{flex:1,minWidth:200}}>{lists.map(l=><Tab key={l.id} label={l.name}/>)}</Tabs>
   </Card>
  {!L?<Card sx={{p:3}}><Typography color="text.secondary">Create your first list, for example Skin care, Hair care, Gut health or Meditation.</Typography></Card>:<>
   <TabBar id="tasks" tabs={["Check", "Log", "Manage"]}/>
<Pane id="tasks" name="Manage"><Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:2}}>Add a task to {L.name}</Typography>
    <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
     <TextField label="Task" value={f.title} onChange={e=>set('title',e.target.value)} sx={{flex:2,minWidth:200}}/>
     <Select value={f.cycle} onChange={e=>set('cycle',e.target.value)}>{Object.entries(CY).map(([k,v])=><MenuItem key={k} value={k}>{v}</MenuItem>)}</Select>
     {f.cycle==='interval'&&<TextField label="Every N days" type="number" value={f.interval_n} onChange={e=>set('interval_n',e.target.value)} sx={{width:130}}/>}
     {f.cycle==='monthly'&&<TextField label="Day of month" type="number" value={f.month_day} onChange={e=>set('month_day',e.target.value)} sx={{width:130}}/>}
     {['interval','yearly','once'].includes(f.cycle)&&<TextField label={f.cycle==='interval'?'Starting from':'Date'} type="date" InputLabelProps={{shrink:true}} value={f.start_date} onChange={e=>set('start_date',e.target.value)} sx={{width:170}}/>}
     {f.cycle==='weekly'&&<ToggleButtonGroup size="small" value={f.weekdays} onChange={(_,v)=>set('weekdays',v)}>{WD.map((d,i)=><ToggleButton key={i} value={i}>{d}</ToggleButton>)}</ToggleButtonGroup>}
     {f.cycle!=='todo'&&<><TextField label="Time" type="time" InputLabelProps={{shrink:true}} value={f.remind_time} onChange={e=>set('remind_time',e.target.value)}/>
      <FormControlLabel control={<Switch checked={f.remind} onChange={e=>set('remind',e.target.checked)}/>} label="Remind me"/></>}
     <Button variant="contained" onClick={addTask}>Add task</Button></Stack></Card>
   </Pane><Pane id="tasks" name="Check"><Card sx={{p:2.5}}>{(()=>{const day=sel||T,du=mine.filter(t=>t.cycle!=='todo'&&isDue(t,day));return <>
     <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:1.5}}><Typography variant="h6">Check tasks for a day</Typography><Chip size="small" color={du.length&&du.every(t=>log[t.id+day])?'success':'default'} label={`${du.filter(t=>log[t.id+day]).length} of ${du.length} done`}/></Box>
     <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mb:1}}>{D.slice(-7).map(d=><Chip key={d} clickable color={d===day?'primary':'default'} variant={d===day?'filled':'outlined'} label={d===T?'Today':new Date(d+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric'})} onClick={()=>setSel(d)}/>)}</Stack>
     {du.map(t=><Box key={t.id} sx={{display:'flex',alignItems:'center',gap:1,py:.5,borderTop:1,borderColor:'divider'}}><Checkbox checked={!!log[t.id+day]} onChange={()=>cell(t,day)}/><Typography sx={{flex:1,textDecoration:log[t.id+day]?'line-through':'none'}}>{t.title}</Typography><Typography variant="caption" color="text.secondary">{t.remind_time?t.remind_time.slice(0,5):''}</Typography></Box>)}
     {!du.length&&<Typography color="text.secondary">Nothing due in {L.name} on this day.</Typography>}</>})()}</Card>
   </Pane><Pane id="tasks" name="Log"><Card sx={{p:2.5,overflowX:'auto'}}><Typography variant="h6" sx={{mb:1}}>Day-by-day log, last 14 days</Typography>
    <Typography variant="caption" color="text.secondary">Ticked means done. A red box means due and missed. Click a day to correct it.</Typography>
    <Table size="small"><TableHead><TableRow><TableCell>Task</TableCell>{D.map(d=><TableCell key={d} align="center" sx={{px:.5,fontWeight:d===T?800:500}}>{d.slice(8)}</TableCell>)}<TableCell/></TableRow></TableHead>
     <TableBody>{mine.length?mine.map(t=><TableRow key={t.id}><TableCell sx={{whiteSpace:'nowrap'}}>{t.title}<Typography variant="caption" color="text.secondary" display="block">{CY[t.cycle]}{t.remind_time?` · ${t.remind_time.slice(0,5)}`:''}{t.remind?' 🔔':''}</Typography></TableCell>
      {D.map(d=>{const du=t.cycle!=='todo'&&isDue(t,d),dn=!!log[t.id+d];return <TableCell key={d} align="center" sx={{p:0}}>
       <Checkbox size="small" checked={dn} disabled={!du&&!dn} onChange={()=>cell(t,d)} sx={du&&!dn&&d<T?{color:'error.main'}:undefined}/></TableCell>})}
      <TableCell><IconButton size="small" aria-label="Delete task" onClick={()=>del(t)}><DeleteRounded fontSize="small"/></IconButton></TableCell></TableRow>)
      :<TableRow><TableCell colSpan={16}><Typography color="text.secondary">No tasks in this list yet.</Typography></TableCell></TableRow>}</TableBody></Table></Card></Pane></>}
 <Dialog open={openL} onClose={()=>setOpenL(false)} fullWidth maxWidth="xs"><DialogTitle>New list</DialogTitle><DialogContent><TextField autoFocus fullWidth label="List name, e.g. Skin care" value={nl} onChange={e=>setNl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addList()} sx={{mt:1}}/></DialogContent><DialogActions><Button onClick={()=>setOpenL(false)}>Cancel</Button><Button variant="contained" onClick={addList}>Create list</Button></DialogActions></Dialog>
 </Stack>}
