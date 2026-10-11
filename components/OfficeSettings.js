'use client';
import {useState} from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions,Button,Box,Stack,TextField,Typography,IconButton,Checkbox,FormControlLabel,MenuItem,Divider} from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import {supabase} from '@/lib/supabase';
const Color=({value,onChange,label})=><Box component="input" type="color" aria-label={label} value={value} onChange={e=>onChange(e.target.value)} sx={{width:36,height:36,p:0,border:0,bgcolor:'transparent',cursor:'pointer',flexShrink:0}}/>;
// Manage the board: rename, recolour, reorder and delete statuses, and the same for environments.
export default function OfficeSettings({open,onClose,cols,envs,tasks,reload}){
 const [nc,setNc]=useState(''),[ne,setNe]=useState(''),[cc,setCc]=useState('#3B82F6'),[ec,setEc]=useState('#0EA5E9'),[cfm,setCfm]=useState(null),[ed,setEd]=useState({});
 const upd=(tbl,id,patch)=>supabase.from(tbl).update(patch).eq('id',id).then(reload);
 const rename=(tbl,x)=>{const n=(ed[x.id]??x.name).trim();setEd(({[x.id]:_,...r})=>r);if(n&&n!==x.name)upd(tbl,x.id,{name:n})};
 const swap=async(a,b)=>{await supabase.from('office_columns').update({position:b.position}).eq('id',a.id);await supabase.from('office_columns').update({position:a.position}).eq('id',b.id);reload()};
 const addCol=async()=>{if(!nc.trim())return;await supabase.from('office_columns').insert({name:nc.trim(),color:cc,position:Math.max(-1,...cols.map(c=>c.position))+1});setNc('');reload()};
 const addEnv=async()=>{if(!ne.trim())return;await supabase.from('office_envs').insert({name:ne.trim(),color:ec,position:Math.max(-1,...envs.map(c=>c.position))+1});setNe('');reload()};
 const delCol=async c=>{const n=tasks.filter(t=>t.column_id===c.id).length;if(n&&!cfm){setCfm({id:c.id,target:cols.find(x=>x.id!==c.id).id});return}
  if(n)await supabase.from('office_tasks').update({column_id:cfm.target}).eq('column_id',c.id);await supabase.from('office_columns').delete().eq('id',c.id);setCfm(null);reload()};
 const delEnv=async e=>{await supabase.from('office_envs').delete().eq('id',e.id);reload()};
 return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>Customize the board</DialogTitle>
  <DialogContent><Typography variant="subtitle1" fontWeight={700} sx={{mt:1}}>Statuses (columns)</Typography>
   <Typography variant="body2" color="text.secondary" sx={{mb:1.5}}>Tasks moved into a status marked "done" get a completed date.</Typography>
   <Stack spacing={1.5}>{cols.map((c,i)=><Box key={c.id}>
    <Box sx={{display:'flex',alignItems:'center',gap:1,flexWrap:'wrap'}}>
     <Color value={c.color} label={`Colour for ${c.name}`} onChange={v=>upd('office_columns',c.id,{color:v})}/>
     <TextField size="small" value={ed[c.id]??c.name} onChange={e=>setEd({...ed,[c.id]:e.target.value})} onBlur={()=>rename('office_columns',c)} onKeyDown={e=>e.key==='Enter'&&e.target.blur()} inputProps={{'aria-label':`Rename ${c.name}`}} sx={{flex:'1 1 140px'}}/>
     <FormControlLabel control={<Checkbox size="small" checked={c.is_done} onChange={e=>upd('office_columns',c.id,{is_done:e.target.checked})}/>} label="Done" sx={{mr:0}}/>
     <IconButton size="small" aria-label="Move left" disabled={i===0} onClick={()=>swap(c,cols[i-1])}><ArrowUpwardRounded fontSize="small"/></IconButton>
     <IconButton size="small" aria-label="Move right" disabled={i===cols.length-1} onClick={()=>swap(c,cols[i+1])}><ArrowDownwardRounded fontSize="small"/></IconButton>
     <IconButton size="small" aria-label={`Delete ${c.name}`} disabled={cols.length<=1} onClick={()=>delCol(c)}><DeleteRounded fontSize="small"/></IconButton></Box>
    {cfm?.id===c.id&&<Box sx={{mt:1,p:1.5,borderRadius:2,bgcolor:'action.hover'}}><Typography variant="body2" sx={{mb:1}}>This status has {tasks.filter(t=>t.column_id===c.id).length} task(s). Move them to:</Typography>
     <Stack direction="row" spacing={1}><TextField select size="small" value={cfm.target} onChange={e=>setCfm({...cfm,target:e.target.value})} sx={{minWidth:160}}>{cols.filter(x=>x.id!==c.id).map(x=><MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>)}</TextField><Button size="small" color="error" variant="contained" onClick={()=>delCol(c)}>Move and delete</Button><Button size="small" onClick={()=>setCfm(null)}>Cancel</Button></Stack></Box>}</Box>)}
    <Stack direction="row" spacing={1} alignItems="center"><Color value={cc} label="Colour for the new status" onChange={setCc}/><TextField size="small" fullWidth label="New status, e.g. Blocked" value={nc} onChange={e=>setNc(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCol()}/><Button variant="contained" onClick={addCol}>Add</Button></Stack></Stack>
   <Divider sx={{my:3}}/>
   <Typography variant="subtitle1" fontWeight={700}>Environments</Typography>
   <Typography variant="body2" color="text.secondary" sx={{mb:1.5}}>Where a task is running or being tested. Deleting one leaves its tasks without an environment.</Typography>
   <Stack spacing={1.5}>{envs.map(e=><Box key={e.id} sx={{display:'flex',alignItems:'center',gap:1}}>
    <Color value={e.color} label={`Colour for ${e.name}`} onChange={v=>upd('office_envs',e.id,{color:v})}/>
    <TextField size="small" fullWidth value={ed[e.id]??e.name} onChange={x=>setEd({...ed,[e.id]:x.target.value})} onBlur={()=>rename('office_envs',e)} onKeyDown={x=>x.key==='Enter'&&x.target.blur()} inputProps={{'aria-label':`Rename ${e.name}`}}/>
    <IconButton size="small" aria-label={`Delete ${e.name}`} onClick={()=>delEnv(e)}><DeleteRounded fontSize="small"/></IconButton></Box>)}
    <Stack direction="row" spacing={1} alignItems="center"><Color value={ec} label="Colour for the new environment" onChange={setEc}/><TextField size="small" fullWidth label="New environment, e.g. Staging" value={ne} onChange={e=>setNe(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addEnv()}/><Button variant="contained" onClick={addEnv}>Add</Button></Stack></Stack></DialogContent>
  <DialogActions><Button onClick={onClose}>Done</Button></DialogActions></Dialog>}