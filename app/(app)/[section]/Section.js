'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {useParams} from 'next/navigation';
import {Card,Typography,Stack,Box,Tabs,Tab,TextField,Button,Rating,List,ListItem,ListItemText,IconButton,LinearProgress,InputAdornment,Dialog,DialogTitle,DialogContent,DialogActions,ToggleButton,ToggleButtonGroup} from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {BarChart} from '@/components/Charts';
import {usePaged,Pager} from '@/components/Pager';
import DataTable from '@/components/DataTable';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso,lastDays} from '@/lib/due';
const CFG={journal:{t:'Journal',s:'Daily wins and learnings.',c:['Wins','Learnings'],extra:'Activity',act:1},
 leisure:{t:'Leisure',s:'Movies, web series, books and hobbies, with ratings.',c:['Movies','Web series','Books','Hobbies'],rate:1,extra:'Stats',wish:1},
 outings:{t:'Outings',s:'Your plans and trips.',c:['Plans','Trips'],cost:1,alias:{Dates:'Plans'},hide:['Meals out']},
 spiritual:{t:'Learnings',s:'What you learn along the way.',c:['Learnings']},
 goals:{t:'Goals',s:'Goals and future plans. Set how far along each one is.',c:['Goals','Future plans'],prog:1}};
// Labels for the two lists of each Leisure collection: [done list, want-to-do list, verb].
const WISH={Movies:['Watched','Watchlist','watched'],'Web series':['Watched','Watchlist','watched'],Books:['Read','Reading list','read'],Hobbies:['Done','Want to try','done']};
const fday=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
export default function Section({section:ps}){
 const params=useParams(),section=ps||params.section,cfg=CFG[section],seeded=useRef({});
 const lab=c=>cfg?.alias?.[c.name]||c.name;
 const [cols,setCols]=useState([]),[cur,setCur]=useState(0),[allRows,setRows]=useState([]),[view,setView]=useState('done'),[dn,setDn]=useState(null),[f,setF]=useState({title:'',note:'',rating:0,cost:'',episodes:''}),[nc,setNc]=useState(''),[all,setAll]=useState([]);
 const idx=c=>{const i=cfg.c.indexOf(lab(c));return i<0?99:i};
 const load=useCallback(async()=>{if(!cfg)return;let{data}=await supabase.from('collections').select('*').eq('section',section);
  const miss=cfg.c.filter(n=>!(data||[]).some(x=>(cfg.alias?.[x.name]||x.name)===n));
  if(miss.length&&!seeded.current[section]){seeded.current[section]=1;await supabase.from('collections').insert(miss.map(name=>({section,name})));({data}=await supabase.from('collections').select('*').eq('section',section))}
  setCols((data||[]).filter(c=>!(cfg.hide||[]).includes(c.name)).sort((a,b)=>idx(a)-idx(b)))},[section]);
 useEffect(()=>{setCur(0);load()},[load]);
 const col=cols[cur],isSeries=col&&lab(col)==='Web series',rows=allRows.filter(x=>cfg?.wish?(view==='want'?x.status==='want':x.status!=='want'):true),WL=cfg?.wish&&col?(WISH[lab(col)]||['Done','Want to do','done']):null;
 useEffect(()=>{setView('done');setDn(null)},[col?.id]);
 const loadRows=useCallback(async()=>{if(!col)return setRows([]);const{data}=await supabase.from('collection_entries').select('*').eq('collection_id',col.id).order('date',{ascending:false}).limit(300);setRows(data||[])},[col?.id]);
 useEffect(()=>{loadRows()},[loadRows]);
 useEffect(()=>{if(!cfg?.extra||!cols.length||cur!==cols.length)return;supabase.from('collection_entries').select('collection_id,rating,cost,date,episodes,status').in('collection_id',cols.map(c=>c.id)).then(({data})=>setAll(data||[]))},[cur,cols]);
 const pg=usePaged(rows,20,`${col?.id}${view}`);
 if(!cfg)return <Typography>Page not found.</Typography>;
 const add=async()=>{if(!f.title.trim()||!col)return;await supabase.from('collection_entries').insert({collection_id:col.id,date:iso(new Date()),title:f.title.trim(),note:f.note,rating:view==='want'?null:f.rating||null,cost:f.cost===''?null:+f.cost,episodes:isSeries&&view!=='want'?(+f.episodes||0):0,progress:0,status:view==='want'?'want':'done'});setF({title:'',note:'',rating:0,cost:'',episodes:''});loadRows()};
 const del=x=>undoable('Entry',()=>supabase.from('collection_entries').delete().eq('id',x.id),{id:x.id,hide:()=>setRows(r=>r.filter(y=>y.id!==x.id)),restore:loadRows});
 const setProg=(x,v)=>setRows(r=>r.map(y=>y.id===x.id?{...y,progress:v}:y));
 const saveProg=async(x)=>{await supabase.from('collection_entries').update({progress:x.progress}).eq('id',x.id)};
 const addCol=async()=>{if(!nc.trim())return;await supabase.from('collections').insert({section,name:nc.trim()});setNc('');await load();setCur(cols.length)};
 const total=rows.reduce((a,x)=>a+(+x.cost||0),0),eps=rows.reduce((a,x)=>a+(x.episodes||0),0);
 return <Stack spacing={3}><Box><Typography variant="h4">{cfg.t}</Typography><Typography color="text.secondary">{cfg.s}</Typography></Box>
  <Card sx={{p:1.5,display:'flex',alignItems:'center',gap:2,flexWrap:'wrap'}}><Tabs value={cols.length?cur:false} onChange={(_,v)=>setCur(v)} variant="scrollable" sx={{flex:1,minWidth:200}}>{cols.map(c=><Tab key={c.id} label={lab(c)}/>)}{cfg.extra&&<Tab label={cfg.extra}/>}</Tabs>
   <TextField placeholder="New list" value={nc} onChange={e=>setNc(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCol()}/><Button variant="outlined" onClick={addCol}>Add</Button></Card>
  {col&&<Card sx={{p:2.5}}><Box sx={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:1}}><Typography variant="h6">{lab(col)}</Typography><Typography color="text.secondary">{rows.length} {rows.length===1?'entry':'entries'}{isSeries?` · ${eps} episodes`:''}{cfg.cost&&total?` · spent ₹${Math.round(total).toLocaleString('en-IN')}`:''}</Typography></Box>
   {WL&&<ToggleButtonGroup exclusive size="small" value={view} onChange={(_,v)=>v&&setView(v)} sx={{mt:1.5}} aria-label="Which list"><ToggleButton value="done">{WL[0]}</ToggleButton><ToggleButton value="want">{WL[1]}</ToggleButton></ToggleButtonGroup>}
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center" sx={{my:2}}>
    <TextField label={isSeries?'Series name':'Title'} value={f.title} onChange={e=>setF({...f,title:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} sx={{flex:1,minWidth:180}}/>
    {isSeries&&view!=='want'&&<TextField label="Episodes watched" type="number" value={f.episodes} onChange={e=>setF({...f,episodes:e.target.value})} sx={{width:150}}/>}
    <TextField label="Note" value={f.note} onChange={e=>setF({...f,note:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} sx={{flex:1,minWidth:180}}/>
    {cfg.rate&&view!=='want'&&<Rating value={f.rating} onChange={(_,v)=>setF({...f,rating:v||0})}/>}
    {cfg.cost&&<TextField label="Cost ₹" type="number" value={f.cost} onChange={e=>setF({...f,cost:e.target.value})} sx={{width:110}}/>}
    <Button variant="contained" onClick={add}>{view==='want'?`Add to ${WL[1].toLowerCase()}`:'Add'}</Button></Stack>
   <DataTable rows={pg.slice} minColWidth={cfg.prog?150:110} empty="Nothing here yet. Add your first entry above." actionsWidth={view==='want'?200:56}
    actions={x=><Stack direction="row" spacing={.5} alignItems="center">{view==='want'&&<Button size="small" variant="outlined" onClick={()=>setDn({x,rating:0,episodes:'',note:x.note||''})}>Mark as {WL[2]}</Button>}<IconButton size="small" aria-label="Delete" onClick={()=>del(x)}><DeleteRounded fontSize="small"/></IconButton></Stack>}
    columns={[{label:'Title',render:x=>x.title},{label:'Date',render:x=>fday(x.date)},
     ...(cfg.rate&&view!=='want'?[{label:'Rating',render:x=>x.rating?<Rating size="small" readOnly value={x.rating}/>:'–'}]:[]),
     ...(isSeries&&view!=='want'?[{label:'Episodes',align:'right',render:x=>x.episodes?String(x.episodes):'–'}]:[]),
     ...(cfg.cost?[{label:'Cost',align:'right',render:x=>x.cost?`₹${Math.round(x.cost).toLocaleString('en-IN')}`:'–'}]:[]),
     ...(cfg.prog?[{label:'Progress',render:x=><Stack spacing={.75}><LinearProgress variant="determinate" value={x.progress||0} sx={{height:8,borderRadius:4}} aria-label={`${x.title} progress`}/>
       <TextField size="small" type="number" value={x.progress||0} onChange={e=>setProg(x,Math.max(0,Math.min(100,+e.target.value||0)))} onBlur={()=>saveProg(x)} onKeyDown={e=>e.key==='Enter'&&e.target.blur()} InputProps={{endAdornment:<InputAdornment position="end">%</InputAdornment>}} inputProps={{min:0,max:100,'aria-label':'Percent achieved'}} sx={{width:96}}/></Stack>}]:[]),
     {label:'Note',render:x=>x.note||'–'}]}/><Pager pg={pg}/></Card>}
  {!col&&cfg.extra&&<Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1}}>{cfg.extra}</Typography>
   <DataTable rows={cols.map(c=>{const l=all.filter(x=>x.collection_id===c.id&&x.status!=='want'),w=all.filter(x=>x.collection_id===c.id&&x.status==='want').length,rt=l.filter(x=>x.rating);return{id:c.id,name:lab(c),n:l.length,w,ep:l.reduce((a,x)=>a+(x.episodes||0),0),av:rt.length?rt.reduce((a,x)=>a+x.rating,0)/rt.length:0}})}
    columns={[{label:'Collection',render:r=>r.name},{label:'Entries',align:'right',render:r=>String(r.n)},...(cfg.wish?[{label:'On the list',align:'right',render:r=>String(r.w)}]:[]),...(cfg.rate?[{label:'Episodes',align:'right',render:r=>r.ep?String(r.ep):'–'},{label:'Avg rating',align:'right',render:r=>r.av?`${r.av.toFixed(1)} ★`:'–'}]:[])]}/>
   {cfg.act&&<><Typography variant="caption" color="text.secondary" sx={{display:'block',mt:2}}>Entries per day, last 14 days</Typography><BarChart height={200} xAxis={[{scaleType:'band',data:lastDays(14).map(d=>d.slice(8))}]} series={[{data:lastDays(14).map(d=>all.filter(x=>x.date===d).length),color:'#14A38B'}]}/></>}</Card>}
 <Dialog open={!!dn} onClose={()=>setDn(null)} fullWidth maxWidth="xs"><DialogTitle>Mark as {WL?.[2]}{dn?` · ${dn.x.title}`:''}</DialogTitle>
   <DialogContent><Stack spacing={2} sx={{pt:1}}>{cfg.rate&&<Box><Typography variant="caption" color="text.secondary">Your rating</Typography><br/><Rating value={dn?.rating||0} onChange={(_,v)=>setDn({...dn,rating:v||0})}/></Box>}
    {isSeries&&<TextField label="Episodes watched" type="number" value={dn?.episodes??''} onChange={e=>setDn({...dn,episodes:e.target.value})}/>}
    <TextField label="Note" value={dn?.note||''} onChange={e=>setDn({...dn,note:e.target.value})} multiline minRows={2}/></Stack></DialogContent>
   <DialogActions><Button onClick={()=>setDn(null)}>Cancel</Button><Button variant="contained" onClick={async()=>{await supabase.from('collection_entries').update({status:'done',date:iso(new Date()),rating:dn.rating||null,episodes:isSeries?(+dn.episodes||0):dn.x.episodes,note:dn.note}).eq('id',dn.x.id);setDn(null);loadRows()}}>Move to {WL?.[0].toLowerCase()}</Button></DialogActions></Dialog>
 </Stack>}
