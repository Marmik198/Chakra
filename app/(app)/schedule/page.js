'use client';
import {useEffect,useState,useCallback} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,Checkbox,IconButton,Chip,ToggleButton,ToggleButtonGroup,List,ListItem,ListItemText,Dialog,DialogTitle,DialogContent,DialogActions} from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import {TabBar,Pane} from '@/components/Tabs';
import {usePaged,Pager} from '@/components/Pager';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso} from '@/lib/due';
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],ALL=[0,1,2,3,4,5,6],t5=t=>(t||'').slice(0,5),rng=(s,e)=>`${t5(s)}${e?' – '+t5(e):''}`;
const DaysPick=({v,set})=><ToggleButtonGroup size="small" value={v} onChange={(_,x)=>x.length&&set(x)} sx={{flexWrap:'wrap'}}>{WD.map((d,i)=><ToggleButton key={d} value={i} sx={{px:1.25}}>{d}</ToggleButton>)}</ToggleButtonGroup>;
export default function Schedule(){
 const T=iso(new Date()),today=new Date().getDay(),[items,setItems]=useState([]),[done,setDone]=useState(new Set()),[changes,setChanges]=useState([]),[day,setDay]=useState(today),[f,setF]=useState({title:'',start:'07:00',end:'',days:ALL}),[ed,setEd]=useState(null);
 const load=useCallback(async()=>{const[a,b,c]=await Promise.all([supabase.from('schedule_items').select('*').order('start_time'),supabase.from('schedule_log').select('item_id').eq('date',T),supabase.from('schedule_changes').select('*').order('created_at',{ascending:false}).limit(50)]);setItems(a.data||[]);setDone(new Set((b.data||[]).map(r=>r.item_id)));setChanges(c.data||[])},[T]);
 useEffect(()=>{load()},[load]);
 const log=(id,title,text)=>supabase.from('schedule_changes').insert({item_id:id||null,item_title:title,change:text,date:T});
 const add=async()=>{if(!f.title.trim())return;const{data}=await supabase.from('schedule_items').insert({title:f.title.trim(),start_time:f.start,end_time:f.end||null,days:f.days}).select().single();await log(data.id,data.title,`Added "${data.title}" at ${rng(f.start,f.end)}`);setF({...f,title:''});load()};
 const toggle=async i=>{const on=done.has(i.id);setDone(s=>{const n=new Set(s);on?n.delete(i.id):n.add(i.id);return n});const r=await(on?supabase.from('schedule_log').delete().match({item_id:i.id,date:T}):supabase.from('schedule_log').insert({item_id:i.id,date:T}));if(r?.error)load()};
 const save=async()=>{const o=items.find(x=>x.id===ed.id),ch=[];
  if(rng(o.start_time,o.end_time)!==rng(ed.start,ed.end))ch.push(`time ${rng(o.start_time,o.end_time)} to ${rng(ed.start,ed.end)}`);
  if(o.title!==ed.title)ch.push(`renamed from "${o.title}"`);
  if([...o.days].sort().join()!==[...ed.days].sort().join())ch.push('days changed');
  await supabase.from('schedule_items').update({title:ed.title,start_time:ed.start,end_time:ed.end||null,days:ed.days}).eq('id',ed.id);
  if(ch.length)await log(ed.id,ed.title,`${ed.title}: ${ch.join(', ')}`);setEd(null);load()};
 const del=i=>undoable(`"${i.title}"`,async()=>{await supabase.from('schedule_items').delete().eq('id',i.id);await log(null,i.title,`Removed "${i.title}"`)},{id:i.id,hide:()=>setItems(r=>r.filter(y=>y.id!==i.id)),restore:load});
 const pgC=usePaged(changes),list=items.filter(i=>i.days.includes(day));
 return <Stack spacing={3}>
  <Box><Typography variant="h4">Schedule</Typography><Typography color="text.secondary">Your daily timetable. It is separate from tasks and appears on Today.</Typography></Box>
  <TabBar id="schedule" tabs={['Timetable','Add','Ledger']}/>
  <Pane id="schedule" name="Timetable"><Card sx={{p:2.5}}>
   <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mb:1.5}}>{ALL.map(d=><Chip key={d} clickable color={d===day?'primary':'default'} variant={d===day?'filled':'outlined'} label={d===today?`${WD[d]} (today)`:WD[d]} onClick={()=>setDay(d)}/>)}</Stack>
   {list.map(i=><Box key={i.id} sx={{display:'flex',alignItems:'center',gap:1,py:1,borderTop:1,borderColor:'divider'}}>
    {day===today?<Checkbox checked={done.has(i.id)} onChange={()=>toggle(i)}/>:<Box sx={{width:42}}/>}
    <Box sx={{flex:1}}><Typography sx={{textDecoration:day===today&&done.has(i.id)?'line-through':'none'}} fontWeight={600}>{i.title}</Typography><Typography variant="body2" color="text.secondary">{rng(i.start_time,i.end_time)}</Typography></Box>
    <IconButton aria-label="Edit" onClick={()=>setEd({id:i.id,title:i.title,start:t5(i.start_time),end:t5(i.end_time),days:i.days})}><EditRounded fontSize="small"/></IconButton>
    <IconButton aria-label="Remove" onClick={()=>del(i)}><DeleteRounded fontSize="small"/></IconButton></Box>)}
   {!list.length&&<Typography color="text.secondary" sx={{py:2}}>Nothing scheduled on {WD[day]}. Add something in the Add tab.</Typography>}</Card></Pane>
  <Pane id="schedule" name="Add"><Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:2}}>Add to your timetable</Typography>
   <Stack spacing={2}><TextField label="What" value={f.title} onChange={e=>setF({...f,title:e.target.value})} fullWidth/>
    <Stack direction="row" spacing={2}><TextField label="Starts" type="time" InputLabelProps={{shrink:true}} value={f.start} onChange={e=>setF({...f,start:e.target.value})} fullWidth/><TextField label="Ends (optional)" type="time" InputLabelProps={{shrink:true}} value={f.end} onChange={e=>setF({...f,end:e.target.value})} fullWidth/></Stack>
    <Box><Typography variant="caption" color="text.secondary">Repeats on</Typography><br/><DaysPick v={f.days} set={d=>setF({...f,days:d})}/></Box>
    <Box><Button variant="contained" onClick={add}>Add to timetable</Button></Box></Stack></Card></Pane>
  <Pane id="schedule" name="Ledger"><Card sx={{p:2.5}}><Typography variant="h6">Changes</Typography><Typography variant="body2" color="text.secondary">A record of every time you added, moved, renamed or removed something.</Typography>
   <List dense>{pgC.slice.map(c=><ListItem key={c.id} disableGutters divider><ListItemText primary={c.change} secondary={new Date(c.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}/></ListItem>)}
    {!changes.length&&<Typography color="text.secondary" sx={{py:2}}>No changes yet.</Typography>}</List><Pager pg={pgC}/></Card></Pane>
  <Dialog open={!!ed} onClose={()=>setEd(null)} fullWidth maxWidth="xs"><DialogTitle>Edit schedule item</DialogTitle>
   <DialogContent><Stack spacing={2} sx={{pt:1}}><TextField label="What" value={ed?.title||''} onChange={e=>setEd({...ed,title:e.target.value})}/>
    <Stack direction="row" spacing={2}><TextField label="Starts" type="time" InputLabelProps={{shrink:true}} value={ed?.start||''} onChange={e=>setEd({...ed,start:e.target.value})}/><TextField label="Ends" type="time" InputLabelProps={{shrink:true}} value={ed?.end||''} onChange={e=>setEd({...ed,end:e.target.value})}/></Stack>
    <DaysPick v={ed?.days||ALL} set={d=>setEd({...ed,days:d})}/></Stack></DialogContent>
   <DialogActions><Button onClick={()=>setEd(null)}>Cancel</Button><Button variant="contained" onClick={save}>Save</Button></DialogActions></Dialog>
 </Stack>}
