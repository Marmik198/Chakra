'use client';
import {useEffect,useState,useCallback} from 'react';
import {Box,Card,Typography,Checkbox,Chip,CircularProgress,Stack,List,ListItem,ListItemIcon,ListItemText,TextField,Button,Skeleton} from '@mui/material';
import {supabase} from '@/lib/supabase';
import {AlertsPrompt} from '@/components/Reminders';
import {isDue,iso} from '@/lib/due';
const t5=t=>(t||'').slice(0,5),fd=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
export default function Today(){
 const T=iso(new Date()),dow=new Date().getDay(),[tasks,setTasks]=useState([]),[done,setDone]=useState(new Set()),[sched,setSched]=useState([]),[sdone,setSdone]=useState(new Set()),[win,setWin]=useState(''),[lrn,setLrn]=useState(''),[ready,setReady]=useState(false),[allT,setAllT]=useState([]),[doneMap,setDoneMap]=useState({});
 const load=useCallback(async()=>{
  const[a,b,c,d]=await Promise.all([supabase.from('tasks').select('*,task_lists(name)'),supabase.from('task_log').select('task_id').eq('date',T),supabase.from('schedule_items').select('*').order('start_time'),supabase.from('schedule_log').select('item_id').eq('date',T)]);
  setTasks((a.data||[]).filter(t=>isDue(t,T)).sort((x,y)=>(x.remind_time||'99').localeCompare(y.remind_time||'99')));
  setDone(new Set((b.data||[]).map(r=>r.task_id)));setSched((c.data||[]).filter(i=>i.days.includes(dow)));setSdone(new Set((d.data||[]).map(r=>r.item_id)));setAllT(a.data||[]);const nr=(a.data||[]).filter(t=>t.cycle==='todo'||t.cycle==='once').map(t=>t.id);if(nr.length){const l2=await supabase.from('task_log').select('task_id,date').in('task_id',nr);setDoneMap(Object.fromEntries((l2.data||[]).map(r=>[r.task_id,r.date])))}else setDoneMap({});setReady(true)},[T,dow]);
 useEffect(()=>{load()},[load]);
 const flip=(set,id)=>set(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n});
 const toggle=async t=>{const on=done.has(t.id);flip(setDone,t.id);const r=await(on?supabase.from('task_log').delete().match({task_id:t.id,date:T}):supabase.from('task_log').insert({task_id:t.id,date:T}));if(r?.error)load()};
 const toggleS=async i=>{const on=sdone.has(i.id);flip(setSdone,i.id);const r=await(on?supabase.from('schedule_log').delete().match({item_id:i.id,date:T}):supabase.from('schedule_log').insert({item_id:i.id,date:T}));if(r?.error)load()};
 const addJ=async(name,text,clear)=>{if(!text.trim())return;let{data}=await supabase.from('collections').select('id').eq('section','journal').eq('name',name).limit(1);let id=data?.[0]?.id;if(!id){const r=await supabase.from('collections').insert({section:'journal',name}).select().single();id=r.data.id}await supabase.from('collection_entries').insert({collection_id:id,date:T,title:text.trim()});clear('')};
 // Tasks that do not repeat stay visible until they are ticked off, whatever their date.
 const toggleTodo=async t=>{const on=!!doneMap[t.id];setDoneMap(m=>{const x={...m};on?delete x[t.id]:x[t.id]=T;return x});const r=await(on?supabase.from('task_log').delete().eq('task_id',t.id):supabase.from('task_log').insert({task_id:t.id,date:T}));if(r?.error)load()};
 const todoList=allT.filter(t=>(t.cycle==='todo'||(t.cycle==='once'&&t.start_date<T))&&(!doneMap[t.id]||doneMap[t.id]===T)).sort((a,b)=>(a.cycle==='once'?a.start_date:'9999').localeCompare(b.cycle==='once'?b.start_date:'9999'));
 const n=tasks.filter(t=>done.has(t.id)).length,pct=tasks.length?Math.round(100*n/tasks.length):0;
 return <Stack spacing={3}>
  <AlertsPrompt/>
  <Box><Typography variant="h4">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</Typography><Typography color="text.secondary">What is on for today.</Typography></Box>
  {!ready?<Stack spacing={2} aria-busy="true"><Skeleton variant="rounded" height={110}/><Skeleton variant="rounded" height={220}/><Skeleton variant="rounded" height={180}/></Stack>:<>
  <Card sx={{p:3,display:'flex',alignItems:'center',gap:3,color:'#fff',border:0,background:'#161B22'}}>
   <Box sx={{position:'relative',display:'inline-flex'}}><CircularProgress variant="determinate" value={100} size={88} thickness={5} sx={{color:'rgba(255,255,255,.25)'}}/>
    <CircularProgress variant="determinate" value={pct} size={88} thickness={5} sx={{color:'#2DD4BF',position:'absolute',left:0}}/>
    <Box sx={{position:'absolute',inset:0,display:'grid',placeItems:'center'}}><Typography fontWeight={800}>{pct}%</Typography></Box></Box>
   <Box><Typography variant="h4">{n} of {tasks.length}</Typography><Typography sx={{opacity:.8}}>due today, completed</Typography></Box></Card>
  <Card><Typography variant="h6" sx={{p:2.5,pb:0}}>Due today</Typography>
   <List>{tasks.length?tasks.map(t=><ListItem key={t.id} divider secondaryAction={<Chip size="small" label={t.task_lists?.name||'No list'}/>}>
    <ListItemIcon><Checkbox edge="start" checked={done.has(t.id)} onChange={()=>toggle(t)}/></ListItemIcon>
    <ListItemText primary={t.title} secondary={t.remind_time?t.remind_time.slice(0,5)+(t.remind?' · reminder on':''):null} sx={{textDecoration:done.has(t.id)?'line-through':'none'}}/></ListItem>)
    :<ListItem><ListItemText secondary="Nothing due today. Create repeating tasks in Tasks."/></ListItem>}</List></Card>
  {todoList.length>0&&<Card><Box sx={{display:'flex',justifyContent:'space-between',p:2.5,pb:0}}><Typography variant="h6">To-do and overdue</Typography><Typography variant="body2" color="text.secondary">{todoList.filter(t=>doneMap[t.id]).length} of {todoList.length} done</Typography></Box>
   <List>{todoList.map(t=><ListItem key={t.id} divider secondaryAction={<Chip size="small" color={t.cycle==='once'?'error':'default'} variant={t.cycle==='once'?'filled':'outlined'} label={t.cycle==='once'?`Overdue since ${fd(t.start_date)}`:'No date'}/>}><ListItemIcon><Checkbox edge="start" checked={!!doneMap[t.id]} onChange={()=>toggleTodo(t)}/></ListItemIcon><ListItemText primary={t.title} secondary={t.task_lists?.name} sx={{textDecoration:doneMap[t.id]?'line-through':'none'}}/></ListItem>)}</List></Card>}
  <Card><Box sx={{display:'flex',justifyContent:'space-between',p:2.5,pb:0}}><Typography variant="h6">Today&apos;s schedule</Typography><Typography variant="body2" color="text.secondary">{sched.filter(i=>sdone.has(i.id)).length} of {sched.length} done</Typography></Box>
   <List>{sched.length?sched.map(i=><ListItem key={i.id} divider><ListItemIcon><Checkbox edge="start" checked={sdone.has(i.id)} onChange={()=>toggleS(i)}/></ListItemIcon>
    <ListItemText primary={i.title} secondary={`${t5(i.start_time)}${i.end_time?' – '+t5(i.end_time):''}`} sx={{textDecoration:sdone.has(i.id)?'line-through':'none'}}/></ListItem>)
    :<ListItem><ListItemText secondary="No timetable for today. Build one in Schedule."/></ListItem>}</List></Card>
  <Box sx={{display:'grid',gap:2,gridTemplateColumns:{md:'1fr 1fr'}}}>
   {[['Daily win','Wins','What went well today?',win,setWin],['Daily learning','Learnings','What did you learn today?',lrn,setLrn]].map(([h,name,ph,v,set])=><Card key={name} sx={{p:2.5}}><Typography variant="h6" sx={{mb:1.5}}>{h}</Typography>
    <Stack direction="row" spacing={1}><TextField placeholder={ph} value={v} onChange={e=>set(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addJ(name,v,set)} fullWidth/><Button variant="contained" onClick={()=>addJ(name,v,set)}>Add</Button></Stack></Card>)}</Box>
 </>}
 </Stack>}