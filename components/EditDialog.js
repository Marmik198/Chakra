'use client';
import {useEffect,useState} from 'react';
import {Dialog,DialogTitle,DialogContent,DialogActions,Button,TextField,MenuItem,Box,Rating,Typography,ToggleButton,ToggleButtonGroup,FormControlLabel,Switch} from '@mui/material';
// An edit window built from a list of fields, so each kind of item (book, expense, task, sleep night...) gets a window that fits it.
// field: {key, label, type:'text'|'multiline'|'number'|'date'|'time'|'select'|'rating'|'switch'|'days', options:[[value,label]] or (values)=>[...],
//         show:(values)=>boolean, required:true, span:true (full width), helper:'text'}
// adjust(key, newValue, values) can change other values when one changes (for example reset the tag when the type changes).
// onSave(values) may throw an Error('message') to keep the window open and show the message.
const DAYS=['Su','Mo','Tu','We','Th','Fr','Sa'];
export default function EditDialog({open,title,fields,initial,onSave,onClose,adjust,saveLabel='Save'}){
 const [v,setV]=useState(initial||{}),[busy,setBusy]=useState(false),[err,setErr]=useState('');
 useEffect(()=>{if(open){setV(initial||{});setErr('');setBusy(false)}},[open]); // eslint-disable-line react-hooks/exhaustive-deps
 const set=(k,val)=>setV(p=>{const n={...p,[k]:val};return adjust?adjust(k,val,n):n});
 const vis=fields.filter(f=>!f.show||f.show(v));
 const save=async()=>{const miss=vis.find(f=>f.required&&!String(v[f.key]??'').trim());if(miss){setErr(`${miss.label} is needed.`);return}
  setBusy(true);setErr('');try{await onSave(v)}catch(e){setErr(e?.message||'Could not save. Try again.')}setBusy(false)};
 const wide=f=>f.span||f.type==='multiline'||f.type==='days'||f.type==='rating'||f.type==='switch';
 const input=f=>{
  if(f.type==='rating')return <Box><Typography variant="caption" color="text.secondary" sx={{display:'block',mb:.5}}>{f.label}</Typography><Rating value={+v[f.key]||0} onChange={(_,x)=>set(f.key,x||0)}/></Box>;
  if(f.type==='switch')return <FormControlLabel control={<Switch checked={!!v[f.key]} onChange={e=>set(f.key,e.target.checked)}/>} label={f.label}/>;
  if(f.type==='days')return <Box><Typography variant="caption" color="text.secondary" sx={{display:'block',mb:.5}}>{f.label}</Typography><ToggleButtonGroup size="small" value={v[f.key]||[]} onChange={(_,x)=>set(f.key,x)}>{DAYS.map((d,i)=><ToggleButton key={i} value={i}>{d}</ToggleButton>)}</ToggleButtonGroup></Box>;
  const opts=f.type==='select'?(typeof f.options==='function'?f.options(v):f.options):null;
  return <TextField fullWidth select={f.type==='select'} label={f.label} required={!!f.required} multiline={f.type==='multiline'} minRows={f.type==='multiline'?2:undefined}
   type={['number','date','time'].includes(f.type)?f.type:'text'} InputLabelProps={['date','time'].includes(f.type)?{shrink:true}:undefined} inputProps={f.type==='number'?{step:'any',inputMode:'decimal'}:undefined}
   helperText={f.helper} value={v[f.key]??''} onChange={e=>set(f.key,e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&f.type!=='multiline'&&f.type!=='select')save()}}>
   {opts&&opts.map(o=><MenuItem key={o[0]} value={o[0]}>{o[1]}</MenuItem>)}</TextField>};
 return <Dialog open={!!open} onClose={busy?undefined:onClose} fullWidth maxWidth="sm"><DialogTitle>{title}</DialogTitle>
  <DialogContent><Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr'},pt:1}}>{vis.map(f=><Box key={f.key} sx={{gridColumn:wide(f)?'1 / -1':'auto',minWidth:0}}>{input(f)}</Box>)}</Box>
   {err&&<Typography color="error" variant="body2" sx={{mt:2}}>{err}</Typography>}</DialogContent>
  <DialogActions><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="contained" onClick={save} disabled={busy}>{saveLabel}</Button></DialogActions></Dialog>}
