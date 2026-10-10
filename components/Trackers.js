'use client';
import {useEffect,useState,useCallback} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,LinearProgress,IconButton,Dialog,DialogTitle,DialogContent,DialogActions,Tooltip,Chip,List,ListItem,ListItemText} from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import EditNoteRounded from '@mui/icons-material/EditNoteRounded';
import LocalFireDepartmentRounded from '@mui/icons-material/LocalFireDepartmentRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import {TabBar,Pane} from '@/components/Tabs';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso} from '@/lib/due';
import {stats} from '@/lib/streak';
const MS=[3,7,14,30,60,90,180,365];
const cells=Array.from({length:42},(_,k)=>{const d=new Date();d.setDate(d.getDate()-41+k);return iso(d)});
const fmt=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
const times=n=>`${n} time${n===1?'':'s'}`;
export default function Trackers({section,title,sub,example='e.g. Days not eaten out',extraTab,extraNode}){
 const T=iso(new Date()),tid=`trk-${section}`,TB=['Trackers','History','Notes & slips','Add new',...(extraTab?[extraTab]:[])];
 const [rows,setRows]=useState([]),[name,setName]=useState(''),[dlg,setDlg]=useState(null);
 const load=useCallback(async()=>{const{data}=await supabase.from('streaks').select('*,streak_days(date,status,note,count)').eq('section',section).order('start_date');setRows(data||[])},[section]);
 useEffect(()=>{load()},[load]);
 const patch=(sid,fn)=>setRows(rs=>rs.map(x=>x.id===sid?{...x,streak_days:fn(x.streak_days||[])}:x));
 const put=async(s,date,v)=>{patch(s.id,l=>[...l.filter(d=>d.date!==date),{note:null,count:1,...(l.find(d=>d.date===date)||{}),date,...v}]);const r=await supabase.from('streak_days').upsert({streak_id:s.id,date,...v},{onConflict:'streak_id,date'});if(r?.error)load()};
 const clear=async(s,date)=>{patch(s.id,l=>l.filter(d=>d.date!==date));const r=await supabase.from('streak_days').delete().match({streak_id:s.id,date});if(r?.error)load()};
 const add=async()=>{if(!name.trim())return;await supabase.from('streaks').insert({name:name.trim(),section,kind:'abstain'});setName('');load()};
 const del=s=>undoable(`"${s.name}"`,()=>supabase.from('streaks').delete().eq('id',s.id),{id:s.id,hide:()=>setRows(r=>r.filter(y=>y.id!==s.id)),restore:load});
 const cycle=(s,d,x)=>!x?put(s,d,{status:'clean',count:1,note:null}):x.status==='clean'?put(s,d,{status:'slip',count:1,note:x.note||null}):clear(s,d);
 const col={clean:'success.main',slip:'error.main'};
 return <Stack spacing={3}>
  <Box><Typography variant="h4">{title}</Typography><Typography color="text.secondary">{sub}</Typography></Box>
  <TabBar id={tid} tabs={TB}/>
  <Pane id={tid} name="Add new"><Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1.5}}>Add a new tracker</Typography><Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
   <TextField label={example} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} sx={{flex:1,minWidth:200}}/>
   <Button variant="contained" onClick={add}>Add</Button></Stack></Card></Pane>
  <Pane id={tid} not name={['Add new',...(extraTab?[extraTab]:[])]}><Box sx={{display:'grid',gap:2,gridTemplateColumns:'repeat(auto-fill,minmax(330px,1fr))'}}>{rows.map(s=>{
   const st=stats(s.streak_days,T),td=st.map.get(T),status=td?.status,cnt=td?.count||0,cur=st.current,nx=MS.find(m=>m>cur)||cur+1,pv=[0,...MS].filter(m=>m<=cur).pop();
   const log=[...(s.streak_days||[])].filter(x=>x.note||x.status==='slip').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
   const setCount=n=>n<=0?clear(s,T):put(s,T,{status:status||'clean',count:n,note:td?.note||null});
   return <Card key={s.id} sx={{p:2.5}}>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Typography variant="h6">{s.name}</Typography><IconButton size="small" aria-label="Delete tracker" onClick={()=>del(s)}><DeleteRounded fontSize="small"/></IconButton></Box>
    <Pane id={tid} name="Trackers">
     <Box sx={{display:'flex',alignItems:'center',gap:1,my:1,color:cur?'warning.main':'text.secondary'}}><LocalFireDepartmentRounded sx={{fontSize:40}}/><Typography variant="h3">{cur}</Typography><Typography color="text.secondary">day streak</Typography></Box>
     <LinearProgress variant="determinate" color="secondary" value={(cur-pv)/(nx-pv)*100} sx={{height:8,borderRadius:4}}/>
     <Typography variant="body2" color="text.secondary" sx={{my:1}}>{nx-cur} to the {nx}-day milestone</Typography>
     <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mb:2}}><Chip size="small" label={`Best ${st.best}`}/><Chip size="small" label={`${st.clean} days`}/><Chip size="small" color="secondary" label={times(st.total)}/><Chip size="small" color={st.slips.length?'error':'default'} label={`${st.slips.length} slips`}/></Stack>
     <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mb:1.5}}>
      {status==='clean'?<Button variant="outlined" startIcon={<CheckCircleRounded/>} onClick={()=>clear(s,T)}>Checked in today</Button>:<Button variant="contained" onClick={()=>put(s,T,{status:'clean',count:1,note:null})}>I stayed clean today</Button>}
      <Button color="error" onClick={()=>setDlg({s,date:T,mode:'slip',note:''})}>I slipped</Button>
      <Button startIcon={<EditNoteRounded/>} disabled={!td} onClick={()=>setDlg({s,date:T,mode:'note',note:td?.note||'',keep:td})}>Note</Button></Stack>
     <Box sx={{display:'flex',alignItems:'center',gap:1}}><Typography variant="body2" color="text.secondary" sx={{flex:1}}>Times today{status==='slip'?' (slips)':''}</Typography>
      <IconButton size="small" aria-label="One less" disabled={!cnt} onClick={()=>setCount(cnt-1)}><RemoveRounded/></IconButton><Typography fontWeight={800} sx={{minWidth:24,textAlign:'center'}}>{cnt}</Typography><IconButton size="small" aria-label="One more" onClick={()=>setCount(cnt+1)}><AddRounded/></IconButton></Box>
    </Pane>
    <Pane id={tid} name="History"><Box sx={{display:'grid',gridTemplateColumns:'repeat(14,1fr)',gap:.5,mt:1}}>{cells.map(d=>{const x=st.map.get(d),v=x?.status,n=x?.count||1;return <Tooltip key={d} title={v?`${fmt(d)} · ${v==='clean'?'clean':'slip'} · ${times(n)}`:`${fmt(d)} · not logged`}><Box component="button" aria-label={`${fmt(d)} ${v?v+', '+times(n):'not logged'}`} onClick={()=>cycle(s,d,x)} sx={{aspectRatio:'1',border:d===T?'2px solid':0,borderColor:'primary.main',borderRadius:1,p:0,cursor:'pointer',bgcolor:col[v]||'divider'}}/></Tooltip>})}</Box>
     <Typography variant="caption" color="text.secondary">Last 6 weeks. Hover a day to see its date and count. Tap a day to change it.</Typography></Pane>
    <Pane id={tid} name="Notes & slips">{log.length>0?<><Typography variant="subtitle2" sx={{mt:1}}>Notes and slips</Typography><List dense disablePadding>{log.map(x=><ListItem key={x.date} disableGutters secondaryAction={<IconButton size="small" aria-label="Remove entry" onClick={()=>clear(s,x.date)}><DeleteRounded fontSize="small"/></IconButton>}><ListItemText primary={`${fmt(x.date)}${x.status==='slip'?' · slip':''} · ${times(x.count||1)}`} secondary={x.note||'No note'}/></ListItem>)}</List></>:<Typography variant="body2" color="text.secondary" sx={{mt:1}}>No notes or slips yet.</Typography>}</Pane>
   </Card>})}</Box>
  {!rows.length&&<Typography color="text.secondary">Nothing here yet. Add your first tracker in the Add new tab.</Typography>}</Pane>
  {extraTab&&<Pane id={tid} name={extraTab}>{extraNode}</Pane>}
  <Dialog open={!!dlg} onClose={()=>setDlg(null)} fullWidth maxWidth="xs"><DialogTitle>{dlg?.mode==='slip'?'Log a slip':'Add a note'}{dlg?` · ${dlg.s.name}`:''}</DialogTitle>
   <DialogContent><Stack spacing={2} sx={{pt:1}}>{dlg?.mode==='slip'&&<TextField label="Date" type="date" InputLabelProps={{shrink:true}} value={dlg.date} onChange={e=>setDlg({...dlg,date:e.target.value})}/>}<TextField label={dlg?.mode==='slip'?'What happened? (optional)':'Note'} multiline minRows={2} value={dlg?.note||''} onChange={e=>setDlg({...dlg,note:e.target.value})}/></Stack></DialogContent>
   <DialogActions><Button onClick={()=>setDlg(null)}>Cancel</Button><Button variant="contained" color={dlg?.mode==='slip'?'error':'primary'} onClick={()=>{if(dlg.mode==='slip'){const ex=(dlg.s.streak_days||[]).find(x=>x.date===dlg.date);put(dlg.s,dlg.date,{status:'slip',count:ex?.status==='slip'?(ex.count||1)+1:1,note:dlg.note||ex?.note||null})}else put(dlg.s,T,{status:dlg.keep.status,count:dlg.keep.count,note:dlg.note});setDlg(null)}}>Save</Button></DialogActions></Dialog>
 </Stack>}
