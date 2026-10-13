'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {Box,Card,Typography,Stack,Button,TextField,MenuItem,Chip,IconButton,Menu,ListSubheader,Dialog,DialogTitle,DialogContent,DialogActions,ToggleButton,ToggleButtonGroup,InputAdornment,Skeleton} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import {TabBar,Pane} from '@/components/Tabs';
import {usePaged,Pager} from '@/components/Pager';
import OfficeSettings from '@/components/OfficeSettings';
import DataTable from '@/components/DataTable';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {PRI,DEF_COLS,DEF_ENVS,between,fmtD,isOverdue} from '@/lib/office';
const when=s=>new Date(s).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const tint=c=>({bgcolor:`${c}26`,color:'text.primary',fontWeight:600});
function ListView({rows,colOf,envOf,open}){
 const pg=usePaged(rows,20,rows.length);
 return <Card sx={{p:2.5}}><DataTable rows={pg.slice} onRowClick={open} empty="No tasks match." columns={[
  {label:'Task',render:t=>t.title},
  {label:'Status',render:t=>{const c=colOf(t.column_id);return c?<Chip size="small" label={c.name} sx={{...tint(c.color),maxWidth:'100%'}}/>:'–'}},
  {label:'Environment',render:t=>{const e=envOf(t.env_id);return e?<Chip size="small" label={e.name} sx={{...tint(e.color),maxWidth:'100%'}}/>:'–'}},
  {label:'Priority',render:t=>PRI.find(x=>x[0]===t.priority)?.[1]||''},
  {label:'Due',render:t=>fmtD(t.due_date)||'–'}]}/><Pager pg={pg}/></Card>}
function Activity({events}){
 const pg=usePaged(events,20);
 return <Card sx={{p:2.5}}><Typography variant="h6">Activity</Typography><Typography variant="body2" color="text.secondary" sx={{mb:1}}>Every time a task is created or moves between statuses and environments.</Typography>
  {pg.slice.map(e=><Box key={e.id} sx={{display:'flex',justifyContent:'space-between',gap:2,py:1,borderTop:1,borderColor:'divider',flexWrap:'wrap'}}><Typography><b>{e.office_tasks?.title||'Deleted task'}</b>{' '}<Typography component="span" color="text.secondary">{e.kind==='created'?`created in ${e.to_value}`:`${e.kind==='status'?'status':'environment'}: ${e.from_value} to ${e.to_value}`}</Typography></Typography><Typography variant="body2" color="text.secondary">{when(e.created_at)}</Typography></Box>)}
  {!events.length&&<Typography color="text.secondary" sx={{py:2}}>Nothing yet. Move a card to see it here.</Typography>}<Pager pg={pg}/></Card>}
export default function Office(){
 const [cols,setCols]=useState([]),[envs,setEnvs]=useState([]),[tasks,setTasks]=useState([]),[events,setEvents]=useState([]),[q,setQ]=useState(''),[envF,setEnvF]=useState('all'),[dlg,setDlg]=useState(null),[sets,setSets]=useState(false),[menu,setMenu]=useState(null),[drag,setDrag]=useState(null),[over,setOver]=useState(null),[ready,setReady]=useState(false),seeded=useRef(false);
 const load=useCallback(async()=>{
  const cq=()=>supabase.from('office_columns').select('*').order('position'),eq=()=>supabase.from('office_envs').select('*').order('position');
  let[a,b,t,ev]=await Promise.all([cq(),eq(),supabase.from('office_tasks').select('*').order('position').limit(1000),supabase.from('office_task_events').select('*,office_tasks(title)').order('created_at',{ascending:false}).limit(300)]);
  if(!a.data?.length&&!seeded.current){seeded.current=true;await supabase.from('office_columns').insert(DEF_COLS.map((c,i)=>({...c,position:i})));await supabase.from('office_envs').insert(DEF_ENVS.map((e,i)=>({...e,position:i})));[a,b]=await Promise.all([cq(),eq()])}
  setCols(a.data||[]);setEnvs(b.data||[]);setTasks(t.data||[]);setEvents(ev.data||[]);setReady(true)},[]);
 useEffect(()=>{load()},[load]);
 const colOf=id=>cols.find(c=>c.id===id),envOf=id=>envs.find(e=>e.id===id),now=()=>new Date().toISOString();
 const logEv=(t,kind,from,to)=>{setEvents(e=>[{id:'tmp'+Math.random(),task_id:t.id,kind,from_value:from,to_value:to,created_at:now(),office_tasks:{title:t.title}},...e]);return supabase.from('office_task_events').insert({task_id:t.id,kind,from_value:from,to_value:to})};
 const move=async(t,colId,beforeId)=>{const col=colOf(colId);if(!col)return;const list=tasks.filter(x=>x.column_id===colId&&x.id!==t.id).sort((a,b)=>a.position-b.position);let pos;
  if(beforeId){const i=list.findIndex(x=>x.id===beforeId);pos=between(list[i-1]?.position,list[i]?.position)}else pos=(list.length?list[list.length-1].position:0)+1000;
  const from=colOf(t.column_id),patch={column_id:colId,position:pos,completed_at:col.is_done?(t.completed_at||now()):null,updated_at:now()};
  setTasks(ts=>ts.map(x=>x.id===t.id?{...x,...patch}:x));const r=await supabase.from('office_tasks').update(patch).eq('id',t.id);if(r?.error){load();return}if(from?.id!==colId)logEv(t,'status',from?.name,col.name)};
 const setEnv=async(t,envId)=>{const from=envOf(t.env_id)?.name||'None',to=envId?envOf(envId)?.name:'None';if(from===to)return;setTasks(ts=>ts.map(x=>x.id===t.id?{...x,env_id:envId||null}:x));const r=await supabase.from('office_tasks').update({env_id:envId||null,updated_at:now()}).eq('id',t.id);if(r?.error)load();else logEv(t,'environment',from,to)};
 const save=async()=>{const d=dlg;if(!d.title.trim())return;const base={title:d.title.trim(),notes:d.notes||null,priority:d.priority,due_date:d.due_date||null,env_id:d.env_id||null},col=colOf(d.column_id);
  if(d.id){const old=tasks.find(x=>x.id===d.id);await supabase.from('office_tasks').update({...base,column_id:d.column_id,completed_at:col?.is_done?(old.completed_at||now()):null,updated_at:now()}).eq('id',d.id);
   if(old.column_id!==d.column_id)logEv(old,'status',colOf(old.column_id)?.name,col?.name);if((old.env_id||null)!==(d.env_id||null))logEv(old,'environment',envOf(old.env_id)?.name||'None',envOf(d.env_id)?.name||'None')}
  else{const pos=Math.max(0,...tasks.filter(x=>x.column_id===d.column_id).map(x=>x.position))+1000;const{data}=await supabase.from('office_tasks').insert({...base,column_id:d.column_id,position:pos,completed_at:col?.is_done?now():null}).select().single();if(data)logEv(data,'created',null,col?.name)}
  setDlg(null);load()};
 const del=t=>{setDlg(null);undoable(`"${t.title}"`,()=>supabase.from('office_tasks').delete().eq('id',t.id),{id:t.id,hide:()=>setTasks(ts=>ts.filter(x=>x.id!==t.id)),restore:load})};
 const blank=colId=>({title:'',notes:'',column_id:colId||cols[0]?.id,env_id:'',priority:'medium',due_date:''});
 const edit=t=>setDlg({id:t.id,title:t.title,notes:t.notes||'',column_id:t.column_id,env_id:t.env_id||'',priority:t.priority,due_date:t.due_date||''});
 const vis=tasks.filter(t=>(envF==='all'||t.env_id===envF)&&(!q||(t.title+' '+(t.notes||'')).toLowerCase().includes(q.toLowerCase())));
 const dragTask=tasks.find(t=>t.id===drag),hist=dlg?.id?events.filter(e=>e.task_id===dlg.id).slice(0,8):[];
 const Card1=t=>{const c=colOf(t.column_id),e=envOf(t.env_id),p=PRI.find(x=>x[0]===t.priority),late=isOverdue(t.due_date,c?.is_done);
  return <Card key={t.id} draggable onDragStart={ev=>{ev.dataTransfer.setData('text/plain',t.id);ev.dataTransfer.effectAllowed='move';setDrag(t.id)}} onDragEnd={()=>{setDrag(null);setOver(null)}} onDragOver={ev=>{ev.preventDefault();ev.stopPropagation()}} onDrop={ev=>{ev.preventDefault();ev.stopPropagation();if(dragTask&&dragTask.id!==t.id)move(dragTask,t.column_id,t.id);setDrag(null);setOver(null)}} onClick={()=>edit(t)}
   sx={{p:1.5,cursor:'grab',opacity:drag===t.id?.45:1,'&:hover':{borderColor:'primary.main'}}}>
   <Box sx={{display:'flex',alignItems:'flex-start',gap:.5}}><Typography fontWeight={700} sx={{flex:1,wordBreak:'break-word'}}>{t.title}</Typography><IconButton size="small" aria-label="Task menu" onClick={ev=>{ev.stopPropagation();setMenu({el:ev.currentTarget,t})}} sx={{mt:-.5,mr:-.75}}><MoreVertRounded fontSize="small"/></IconButton></Box>
   {t.notes&&<Typography variant="body2" color="text.secondary" sx={{mt:.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{t.notes}</Typography>}
   <Stack direction="row" spacing={.75} useFlexGap flexWrap="wrap" sx={{mt:1}}>{e&&<Chip size="small" label={e.name} sx={tint(e.color)}/>}{p&&t.priority!=='medium'&&<Chip size="small" variant="outlined" label={p[1]} sx={{borderColor:p[2],color:p[2]}}/>}{t.due_date&&<Chip size="small" variant={late?'filled':'outlined'} color={late?'error':'default'} label={`Due ${fmtD(t.due_date)}`}/>}</Stack></Card>};
 return <Stack spacing={3}>
  <Box><Typography variant="h4">Office</Typography><Typography color="text.secondary">Your work tasks on a board. Move them through statuses and environments.</Typography></Box>
  <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" alignItems="center">
   <Button variant="contained" startIcon={<AddRounded/>} onClick={()=>setDlg(blank())} disabled={!cols.length}>New task</Button>
   <Button startIcon={<SettingsRounded/>} onClick={()=>setSets(true)}>Customize</Button>
   <TextField size="small" placeholder="Search tasks" value={q} onChange={e=>setQ(e.target.value)} InputProps={{startAdornment:<InputAdornment position="start"><SearchRounded fontSize="small"/></InputAdornment>}} sx={{width:{xs:'100%',sm:220}}}/></Stack>
  {envs.length>0&&<Box sx={{display:'flex',alignItems:'center',gap:1.5,flexWrap:'wrap'}}><Typography variant="body2" color="text.secondary">Environment</Typography><ToggleButtonGroup exclusive size="small" value={envF} onChange={(_,v)=>v&&setEnvF(v)} aria-label="Filter by environment"><ToggleButton value="all">All</ToggleButton>{envs.map(e=><ToggleButton key={e.id} value={e.id}>{e.name}</ToggleButton>)}</ToggleButtonGroup></Box>}
  <TabBar id="office" tabs={['Board','List','Activity']}/>
  <Pane id="office" name="Board">{!ready?<Box sx={{display:'grid',gridAutoFlow:'column',gridAutoColumns:'280px',gap:2}}>{[0,1,2,3].map(i=><Skeleton key={i} variant="rounded" height={260}/>)}</Box>
   :<Box sx={{display:'grid',gridAutoFlow:'column',gridAutoColumns:{xs:'84%',sm:'minmax(270px,1fr)'},gap:2,overflowX:'auto',pb:2,alignItems:'start',scrollSnapType:'x proximity'}}>{cols.map(c=>{const list=vis.filter(t=>t.column_id===c.id).sort((a,b)=>a.position-b.position);
    return <Box key={c.id} onDragOver={ev=>{ev.preventDefault();setOver(c.id)}} onDragLeave={()=>setOver(o=>o===c.id?null:o)} onDrop={ev=>{ev.preventDefault();if(dragTask)move(dragTask,c.id);setDrag(null);setOver(null)}} sx={{scrollSnapAlign:'start',p:1.25,borderRadius:3,bgcolor:over===c.id?'action.selected':'action.hover',minHeight:140,transition:'background-color .15s'}}>
     <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1.25,px:.5}}><Box sx={{width:10,height:10,borderRadius:'50%',bgcolor:c.color}}/><Typography fontWeight={700} sx={{flex:1}}>{c.name}</Typography><Typography variant="body2" color="text.secondary">{list.length}</Typography><IconButton size="small" aria-label={`Add a task to ${c.name}`} onClick={()=>setDlg(blank(c.id))}><AddRounded fontSize="small"/></IconButton></Box>
     <Stack spacing={1}>{list.map(Card1)}{!list.length&&<Typography variant="body2" color="text.secondary" sx={{px:.5,py:1}}>{drag?'Drop here':'No tasks'}</Typography>}</Stack></Box>})}</Box>}</Pane>
  <Pane id="office" name="List"><ListView rows={[...vis].sort((a,b)=>(b.updated_at||'').localeCompare(a.updated_at||''))} colOf={colOf} envOf={envOf} open={edit}/></Pane>
  <Pane id="office" name="Activity"><Activity events={envF==='all'&&!q?events:events.filter(e=>vis.some(t=>t.id===e.task_id))}/></Pane>
  <Menu anchorEl={menu?.el} open={!!menu} onClose={()=>setMenu(null)}>
   <ListSubheader sx={{lineHeight:'28px'}}>Move to</ListSubheader>{cols.map(c=><MenuItem key={c.id} disabled={menu?.t.column_id===c.id} onClick={()=>{move(menu.t,c.id);setMenu(null)}}><Box sx={{width:10,height:10,borderRadius:'50%',bgcolor:c.color,mr:1.5}}/>{c.name}</MenuItem>)}
   <ListSubheader sx={{lineHeight:'28px'}}>Environment</ListSubheader>{envs.map(e=><MenuItem key={e.id} selected={menu?.t.env_id===e.id} onClick={()=>{setEnv(menu.t,e.id);setMenu(null)}}><Box sx={{width:10,height:10,borderRadius:'50%',bgcolor:e.color,mr:1.5}}/>{e.name}</MenuItem>)}<MenuItem onClick={()=>{setEnv(menu.t,null);setMenu(null)}}>No environment</MenuItem>
   <MenuItem onClick={()=>{edit(menu.t);setMenu(null)}}>Edit</MenuItem><MenuItem sx={{color:'error.main'}} onClick={()=>{del(menu.t);setMenu(null)}}>Delete</MenuItem></Menu>
  <Dialog open={!!dlg} onClose={()=>setDlg(null)} fullWidth maxWidth="sm"><DialogTitle>{dlg?.id?'Edit task':'New task'}</DialogTitle>
   <DialogContent><Stack spacing={2} sx={{pt:1}}><TextField autoFocus label="Title" value={dlg?.title||''} onChange={e=>setDlg({...dlg,title:e.target.value})} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&save()}/>
    <TextField label="Notes" multiline minRows={3} value={dlg?.notes||''} onChange={e=>setDlg({...dlg,notes:e.target.value})}/>
    <Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr'}}}>
     <TextField select label="Status" value={dlg?.column_id||''} onChange={e=>setDlg({...dlg,column_id:e.target.value})}>{cols.map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField>
     <TextField select label="Environment" value={dlg?.env_id||''} onChange={e=>setDlg({...dlg,env_id:e.target.value})}><MenuItem value="">None</MenuItem>{envs.map(e=><MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}</TextField>
     <TextField select label="Priority" value={dlg?.priority||'medium'} onChange={e=>setDlg({...dlg,priority:e.target.value})}>{PRI.map(p=><MenuItem key={p[0]} value={p[0]}>{p[1]}</MenuItem>)}</TextField>
     <TextField label="Due date" type="date" InputLabelProps={{shrink:true}} value={dlg?.due_date||''} onChange={e=>setDlg({...dlg,due_date:e.target.value})}/></Box>
    {hist.length>0&&<Box><Typography variant="subtitle2" sx={{mb:.5}}>History</Typography>{hist.map(e=><Typography key={e.id} variant="body2" color="text.secondary">{when(e.created_at)} · {e.kind==='created'?`Created in ${e.to_value}`:`${e.kind==='status'?'Status':'Environment'}: ${e.from_value} to ${e.to_value}`}</Typography>)}</Box>}</Stack></DialogContent>
   <DialogActions>{dlg?.id&&<Button color="error" onClick={()=>del(tasks.find(t=>t.id===dlg.id))}>Delete</Button>}<Box sx={{flex:1}}/><Button onClick={()=>setDlg(null)}>Cancel</Button><Button variant="contained" onClick={save}>Save</Button></DialogActions></Dialog>
  <OfficeSettings open={sets} onClose={()=>setSets(false)} cols={cols} envs={envs} tasks={tasks} reload={load}/>
 </Stack>}
