'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {useParams} from 'next/navigation';
import {Card,Typography,Stack,Box,Tabs,Tab,TextField,Button,Rating,List,ListItem,ListItemText,IconButton,LinearProgress,InputAdornment} from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {BarChart} from '@/components/Charts';
import {usePaged,Pager} from '@/components/Pager';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso,lastDays} from '@/lib/due';
const CFG={journal:{t:'Journal',s:'Daily wins and learnings.',c:['Wins','Learnings'],extra:'Activity',act:1},
 leisure:{t:'Leisure',s:'Movies, web series, books and hobbies, with ratings.',c:['Movies','Web series','Books','Hobbies'],rate:1,extra:'Stats'},
 outings:{t:'Outings',s:'Your plans and trips.',c:['Plans','Trips'],cost:1,alias:{Dates:'Plans'},hide:['Meals out']},
 spiritual:{t:'Learnings',s:'What you learn along the way.',c:['Learnings']},
 goals:{t:'Goals',s:'Goals and future plans. Set how far along each one is.',c:['Goals','Future plans'],prog:1}};
export default function Section({section:ps}){
 const params=useParams(),section=ps||params.section,cfg=CFG[section],seeded=useRef({});
 const lab=c=>cfg?.alias?.[c.name]||c.name;
 const [cols,setCols]=useState([]),[cur,setCur]=useState(0),[rows,setRows]=useState([]),[f,setF]=useState({title:'',note:'',rating:0,cost:'',episodes:''}),[nc,setNc]=useState(''),[all,setAll]=useState([]);
 const idx=c=>{const i=cfg.c.indexOf(lab(c));return i<0?99:i};
 const load=useCallback(async()=>{if(!cfg)return;let{data}=await supabase.from('collections').select('*').eq('section',section);
  const miss=cfg.c.filter(n=>!(data||[]).some(x=>(cfg.alias?.[x.name]||x.name)===n));
  if(miss.length&&!seeded.current[section]){seeded.current[section]=1;await supabase.from('collections').insert(miss.map(name=>({section,name})));({data}=await supabase.from('collections').select('*').eq('section',section))}
  setCols((data||[]).filter(c=>!(cfg.hide||[]).includes(c.name)).sort((a,b)=>idx(a)-idx(b)))},[section]);
 useEffect(()=>{setCur(0);load()},[load]);
 const col=cols[cur],isSeries=col&&lab(col)==='Web series';
 const loadRows=useCallback(async()=>{if(!col)return setRows([]);const{data}=await supabase.from('collection_entries').select('*').eq('collection_id',col.id).order('date',{ascending:false}).limit(300);setRows(data||[])},[col?.id]);
 useEffect(()=>{loadRows()},[loadRows]);
 useEffect(()=>{if(!cfg?.extra||!cols.length||cur!==cols.length)return;supabase.from('collection_entries').select('collection_id,rating,cost,date,episodes').in('collection_id',cols.map(c=>c.id)).then(({data})=>setAll(data||[]))},[cur,cols]);
 const pg=usePaged(rows,20,col?.id);
 if(!cfg)return <Typography>Page not found.</Typography>;
 const add=async()=>{if(!f.title.trim()||!col)return;await supabase.from('collection_entries').insert({collection_id:col.id,date:iso(new Date()),title:f.title.trim(),note:f.note,rating:f.rating||null,cost:f.cost===''?null:+f.cost,episodes:isSeries?(+f.episodes||0):0,progress:0});setF({title:'',note:'',rating:0,cost:'',episodes:''});loadRows()};
 const del=x=>undoable('Entry',()=>supabase.from('collection_entries').delete().eq('id',x.id),{id:x.id,hide:()=>setRows(r=>r.filter(y=>y.id!==x.id)),restore:loadRows});
 const setProg=(x,v)=>setRows(r=>r.map(y=>y.id===x.id?{...y,progress:v}:y));
 const saveProg=async(x)=>{await supabase.from('collection_entries').update({progress:x.progress}).eq('id',x.id)};
 const addCol=async()=>{if(!nc.trim())return;await supabase.from('collections').insert({section,name:nc.trim()});setNc('');await load();setCur(cols.length)};
 const total=rows.reduce((a,x)=>a+(+x.cost||0),0),eps=rows.reduce((a,x)=>a+(x.episodes||0),0);
 return <Stack spacing={3}><Box><Typography variant="h4">{cfg.t}</Typography><Typography color="text.secondary">{cfg.s}</Typography></Box>
  <Card sx={{p:1.5,display:'flex',alignItems:'center',gap:2,flexWrap:'wrap'}}><Tabs value={cols.length?cur:false} onChange={(_,v)=>setCur(v)} variant="scrollable" sx={{flex:1,minWidth:200}}>{cols.map(c=><Tab key={c.id} label={lab(c)}/>)}{cfg.extra&&<Tab label={cfg.extra}/>}</Tabs>
   <TextField placeholder="New list" value={nc} onChange={e=>setNc(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCol()}/><Button variant="outlined" onClick={addCol}>Add</Button></Card>
  {col&&<Card sx={{p:2.5}}><Box sx={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:1}}><Typography variant="h6">{lab(col)}</Typography><Typography color="text.secondary">{rows.length} {rows.length===1?'entry':'entries'}{isSeries?` · ${eps} episodes`:''}{cfg.cost&&total?` · spent ₹${Math.round(total).toLocaleString('en-IN')}`:''}</Typography></Box>
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center" sx={{my:2}}>
    <TextField label={isSeries?'Series name':'Title'} value={f.title} onChange={e=>setF({...f,title:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} sx={{flex:1,minWidth:180}}/>
    {isSeries&&<TextField label="Episodes watched" type="number" value={f.episodes} onChange={e=>setF({...f,episodes:e.target.value})} sx={{width:150}}/>}
    <TextField label="Note" value={f.note} onChange={e=>setF({...f,note:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} sx={{flex:1,minWidth:180}}/>
    {cfg.rate&&<Rating value={f.rating} onChange={(_,v)=>setF({...f,rating:v||0})}/>}
    {cfg.cost&&<TextField label="Cost ₹" type="number" value={f.cost} onChange={e=>setF({...f,cost:e.target.value})} sx={{width:110}}/>}
    <Button variant="contained" onClick={add}>Add</Button></Stack>
   <List>{pg.slice.map(x=><ListItem key={x.id} disableGutters divider sx={{gap:2,flexWrap:'wrap'}}>
    <ListItemText sx={{flex:'1 1 200px'}} primary={<Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap"><b>{x.title}</b>{x.rating?<Rating size="small" readOnly value={x.rating}/>:null}{x.episodes?<Typography variant="body2" color="text.secondary">{x.episodes} ep</Typography>:null}{x.cost?<Typography variant="body2" color="text.secondary">₹{Math.round(x.cost).toLocaleString('en-IN')}</Typography>:null}</Stack>} secondary={`${x.date.slice(5)}${x.note?' · '+x.note:''}`}/>
    {cfg.prog&&<Box sx={{display:'flex',alignItems:'center',gap:1.5,width:{xs:'100%',sm:240}}}><LinearProgress variant="determinate" value={x.progress||0} sx={{flex:1,height:8,borderRadius:4}} aria-label={`${x.title} progress`}/>
     <TextField size="small" type="number" value={x.progress||0} onChange={e=>setProg(x,Math.max(0,Math.min(100,+e.target.value||0)))} onBlur={()=>saveProg(x)} onKeyDown={e=>e.key==='Enter'&&e.target.blur()} InputProps={{endAdornment:<InputAdornment position="end">%</InputAdornment>}} inputProps={{min:0,max:100,'aria-label':'Percent achieved'}} sx={{width:92}}/></Box>}
    <IconButton size="small" aria-label="Delete" onClick={()=>del(x)}><DeleteRounded fontSize="small"/></IconButton></ListItem>)}
    {!rows.length&&<Typography color="text.secondary" sx={{py:2}}>Nothing here yet. Add your first entry above.</Typography>}</List><Pager pg={pg}/></Card>}
  {!col&&cfg.extra&&<Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1}}>{cfg.extra}</Typography>
   {cols.map(c=>{const l=all.filter(x=>x.collection_id===c.id),rt=l.filter(x=>x.rating),av=rt.length?rt.reduce((a,x)=>a+x.rating,0)/rt.length:0,ep=l.reduce((a,x)=>a+(x.episodes||0),0);return <Box key={c.id} sx={{display:'flex',justifyContent:'space-between',py:1,borderTop:1,borderColor:'divider'}}><Typography fontWeight={600}>{lab(c)}</Typography><Typography color="text.secondary">{l.length} entries{ep?` · ${ep} episodes`:''}{cfg.rate&&av?` · avg ${av.toFixed(1)} stars`:''}</Typography></Box>})}
   {cfg.act&&<><Typography variant="caption" color="text.secondary" sx={{display:'block',mt:2}}>Entries per day, last 14 days</Typography><BarChart height={200} xAxis={[{scaleType:'band',data:lastDays(14).map(d=>d.slice(8))}]} series={[{data:lastDays(14).map(d=>all.filter(x=>x.date===d).length),color:'#14A38B'}]}/></>}</Card>}
 </Stack>}
