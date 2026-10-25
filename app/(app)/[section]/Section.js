'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {useParams} from 'next/navigation';
import {Card,Typography,Stack,Box,Tabs,Tab,TextField,Button,Rating,List,ListItem,ListItemText,IconButton,LinearProgress,InputAdornment,Dialog,DialogTitle,DialogContent,DialogActions,ToggleButton,ToggleButtonGroup} from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import {BarChart} from '@/components/Charts';
import {usePaged,Pager} from '@/components/Pager';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import EditDialog from '@/components/EditDialog';
import EditRounded from '@mui/icons-material/EditRounded';
import DataTable from '@/components/DataTable';
import FormGrid,{Wide,Field} from '@/components/FormGrid';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso,lastDays} from '@/lib/due';
const CFG={journal:{t:'Journal',s:'Daily wins and learnings.',c:['Wins','Learnings'],extra:'Activity',act:1},
 leisure:{t:'Leisure',s:'Movies, web series, books and hobbies, with ratings.',c:['Movies','Web series','Books','Hobbies'],rate:1,extra:'Stats',wish:1,manage:1},
 outings:{t:'Outings',s:'Your plans and trips.',c:['Plans','Trips'],cost:1,alias:{Dates:'Plans'},hide:['Meals out'],manage:1},
 spiritual:{t:'Learnings',s:'What you learn along the way.',c:['Learnings']},
 goals:{t:'Goals',s:'Goals and future plans. Set how far along each one is.',c:['Goals','Future plans'],prog:1}};
// Labels for the two lists of each Leisure collection: [done list, want-to-do list, verb].
const wishFor=n=>WISH[n]||(/book|read/i.test(n)?WISH.Books:/series|show/i.test(n)?WISH['Web series']:/movie|film/i.test(n)?WISH.Movies:/hobb/i.test(n)?WISH.Hobbies:['Done','Want to do','done']);
const WISH={Movies:['Watched','Watchlist','watched'],'Web series':['Watched','Watchlist','watched'],Books:['Read','Reading list','read'],Hobbies:['Done','Want to try','done']};
const fday=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
export default function Section({section:ps}){
 const params=useParams(),section=ps||params.section,cfg=CFG[section],seeded=useRef({});
 const lab=c=>cfg?.manage?c.name:(cfg?.alias?.[c.name]||c.name);
 const [cols,setCols]=useState([]),[cur,setCur]=useState(0),[allRows,setRows]=useState([]),[view,setView]=useState('done'),[dn,setDn]=useState(null),[f,setF]=useState({title:'',note:'',rating:0,cost:'',episodes:''}),[nc,setNc]=useState(''),[all,setAll]=useState([]),[mg,setMg]=useState(false),[editRow,setEditRow]=useState(null),[ed,setEd]=useState({}),[cfm,setCfm]=useState(null),[cnt,setCnt]=useState({});
 const idx=c=>{const i=cfg.c.indexOf(lab(c));return i<0?99:i};
 const load=useCallback(async()=>{if(!cfg)return;const get=()=>supabase.from('collections').select('*').eq('section',section);let{data}=await get();
  if(cfg.manage){
   // an old list name (Dates) becomes its new name once; after that every list is yours to rename, reorder or delete
   const old=(data||[]).filter(x=>cfg.alias?.[x.name]);
   if(old.length){await Promise.all(old.map(x=>supabase.from('collections').update({name:cfg.alias[x.name]}).eq('id',x.id)));({data}=await get())}
   if(!(data||[]).length&&!seeded.current[section]){seeded.current[section]=1;await supabase.from('collections').insert(cfg.c.map((name,i)=>({section,name,position:i})));({data}=await get())}
  }else{
   const miss=cfg.c.filter(n=>!(data||[]).some(x=>(cfg.alias?.[x.name]||x.name)===n));
   if(miss.length&&!seeded.current[section]){seeded.current[section]=1;await supabase.from('collections').insert(miss.map(name=>({section,name})));({data}=await get())}
  }
  setCols((data||[]).filter(c=>!(cfg.hide||[]).includes(c.name)).sort((a,b)=>cfg.manage?((a.position??0)-(b.position??0)||a.name.localeCompare(b.name)):idx(a)-idx(b)))},[section]);
 useEffect(()=>{setCur(0);load()},[load]);
 const col=cols[cur],isSeries=col&&/series/i.test(lab(col)),rows=allRows.filter(x=>cfg?.wish?(view==='want'?x.status==='want':x.status!=='want'):true),WL=cfg?.wish&&col?wishFor(lab(col)):null;
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
 const addCol=async()=>{if(!nc.trim())return;await supabase.from('collections').insert({section,name:nc.trim(),...(cfg.manage?{position:Math.max(-1,...cols.map(x=>x.position??0))+1}:{})});setNc('');await load();setCur(cols.length)};
 const openMg=async()=>{setMg(true);setCfm(null);const{data}=await supabase.from('collection_entries').select('collection_id').in('collection_id',cols.map(c=>c.id));const m={};(data||[]).forEach(r=>{m[r.collection_id]=(m[r.collection_id]||0)+1});setCnt(m)};
 const renameCol=async c=>{const n=(ed[c.id]??c.name).trim();setEd(({[c.id]:_,...r})=>r);if(!n||n===c.name)return;await supabase.from('collections').update({name:n}).eq('id',c.id);load()};
 const moveCol=async(c,d)=>{const i=cols.findIndex(x=>x.id===c.id);if(!cols[i+d])return;const arr=[...cols];[arr[i],arr[i+d]]=[arr[i+d],arr[i]];await Promise.all(arr.map((x,k)=>x.position===k?null:supabase.from('collections').update({position:k}).eq('id',x.id)).filter(Boolean));if(cur===i)setCur(i+d);else if(cur===i+d)setCur(i);load()};
 const delCol=async c=>{setCfm(null);await supabase.from('collections').delete().eq('id',c.id);setCur(0);await load()};
 const total=rows.reduce((a,x)=>a+(+x.cost||0),0),eps=rows.reduce((a,x)=>a+(x.episodes||0),0);
 return <Stack spacing={3}><Box><Typography variant="h4">{cfg.t}</Typography><Typography color="text.secondary">{cfg.s}</Typography></Box>
  <Card sx={{p:1.5,display:'flex',alignItems:'center',gap:2,flexWrap:'wrap'}}><Tabs value={cols.length?cur:false} onChange={(_,v)=>setCur(v)} variant="scrollable" sx={{flex:1,minWidth:200}}>{cols.map(c=><Tab key={c.id} label={lab(c)}/>)}{cfg.extra&&<Tab label={cfg.extra}/>}</Tabs>
   {cfg.manage?<Button variant="outlined" startIcon={<SettingsRounded/>} onClick={openMg}>Manage lists</Button>:<><TextField placeholder="New list" value={nc} onChange={e=>setNc(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCol()}/><Button variant="outlined" onClick={addCol}>Add</Button></>}</Card>
  {col&&<Card sx={{p:2.5}}><Box sx={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:1}}><Typography variant="h6">{lab(col)}</Typography><Typography color="text.secondary">{rows.length} {rows.length===1?'entry':'entries'}{isSeries?` · ${eps} episodes`:''}{cfg.cost&&total?` · spent ₹${Math.round(total).toLocaleString('en-IN')}`:''}</Typography></Box>
   {WL&&<ToggleButtonGroup exclusive size="small" value={view} onChange={(_,v)=>v&&setView(v)} sx={{mt:1.5}} aria-label="Which list"><ToggleButton value="done">{WL[0]}</ToggleButton><ToggleButton value="want">{WL[1]}</ToggleButton></ToggleButtonGroup>}
   <FormGrid sx={{my:2.5}}>
    <TextField label={isSeries?'Series name':'Title'} value={f.title} onChange={e=>setF({...f,title:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()}/>
    {isSeries&&view!=='want'&&<TextField label="Episodes watched" type="number" value={f.episodes} onChange={e=>setF({...f,episodes:e.target.value})}/>}
    {cfg.cost&&<TextField label="Cost (₹)" type="number" value={f.cost} onChange={e=>setF({...f,cost:e.target.value})}/>}
    {cfg.rate&&view!=='want'&&<Field label="Rating" sx={{pt:.5}}><Rating size="large" value={f.rating} onChange={(_,v)=>setF({...f,rating:v||0})}/></Field>}
    <Wide><TextField fullWidth label="Note" value={f.note} onChange={e=>setF({...f,note:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()}/></Wide>
    <Wide><Button variant="contained" size="large" onClick={add} sx={{px:5,width:{xs:'100%',sm:'auto'}}}>{view==='want'?`Add to ${WL[1].toLowerCase()}`:'Add'}</Button></Wide></FormGrid>
   <DataTable rows={pg.slice} minColWidth={cfg.prog?150:110} empty="Nothing here yet. Add your first entry above." actionsWidth={view==='want'?240:96}
    actions={x=><Stack direction="row" spacing={.5} alignItems="center">{view==='want'&&<Button size="small" variant="outlined" onClick={()=>setDn({x,rating:0,episodes:'',note:x.note||''})}>Mark as {WL[2]}</Button>}<IconButton size="small" aria-label="Edit" onClick={()=>setEditRow(x)}><EditRounded fontSize="small"/></IconButton><IconButton size="small" aria-label="Delete" onClick={()=>del(x)}><DeleteRounded fontSize="small"/></IconButton></Stack>}
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
 <Dialog open={mg} onClose={()=>{setMg(false);setCfm(null)}} fullWidth maxWidth="sm"><DialogTitle>Manage lists</DialogTitle>
   <DialogContent><Stack spacing={1.5} sx={{pt:1}}>
    {cols.map((c,i)=>cfm===c.id
     ?<Box key={c.id} sx={{display:'flex',alignItems:'center',gap:1,p:1.5,borderRadius:2,bgcolor:'action.hover',flexWrap:'wrap'}}><Typography sx={{flex:'1 1 200px'}}>Delete "{c.name}"{cnt[c.id]?` and its ${cnt[c.id]} ${cnt[c.id]===1?'entry':'entries'}`:''}? This cannot be undone.</Typography><Button size="small" onClick={()=>setCfm(null)}>Cancel</Button><Button size="small" color="error" variant="contained" onClick={()=>delCol(c)}>Delete</Button></Box>
     :<Box key={c.id} sx={{display:'flex',alignItems:'flex-start',gap:.5}}><TextField size="small" fullWidth value={ed[c.id]??c.name} onChange={e=>setEd({...ed,[c.id]:e.target.value})} onBlur={()=>renameCol(c)} onKeyDown={e=>e.key==='Enter'&&e.target.blur()} inputProps={{'aria-label':`Rename ${c.name}`}} helperText={`${cnt[c.id]||0} ${(cnt[c.id]||0)===1?'entry':'entries'}`}/>
      <IconButton aria-label="Move up" disabled={i===0} onClick={()=>moveCol(c,-1)} sx={{mt:.25}}><ArrowUpwardRounded fontSize="small"/></IconButton><IconButton aria-label="Move down" disabled={i===cols.length-1} onClick={()=>moveCol(c,1)} sx={{mt:.25}}><ArrowDownwardRounded fontSize="small"/></IconButton>
      <IconButton aria-label={`Delete ${c.name}`} disabled={cols.length<=1} onClick={()=>setCfm(c.id)} sx={{mt:.25}}><DeleteRounded fontSize="small"/></IconButton></Box>)}
    {cols.length<=1&&<Typography variant="caption" color="text.secondary">Keep at least one list.</Typography>}
    <Box sx={{pt:1.5,borderTop:1,borderColor:'divider'}}><Typography variant="subtitle2" sx={{mb:1}}>Add a new list</Typography><Stack direction="row" spacing={1}><TextField fullWidth label={section==='outings'?'List name, e.g. Weekend trips':'List name, e.g. Podcasts'} value={nc} onChange={e=>setNc(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCol()}/><Button variant="contained" onClick={addCol}>Add</Button></Stack></Box></Stack></DialogContent>
   <DialogActions><Button onClick={()=>{setMg(false);setCfm(null)}}>Done</Button></DialogActions></Dialog>
  <EditDialog open={!!editRow} title={`Edit ${cfg.t==='Journal'?'entry':'item'}`} initial={editRow&&{title:editRow.title,date:editRow.date,collection_id:editRow.collection_id,status:editRow.status||'done',rating:editRow.rating||0,episodes:editRow.episodes||0,cost:editRow.cost??'',progress:editRow.progress||0,note:editRow.note||''}}
   fields={[{key:'title',label:'Title',required:true,span:true},{key:'date',label:'Date',type:'date'},
    ...(cols.length>1?[{key:'collection_id',label:'List',type:'select',options:cols.map(c=>[c.id,lab(c)])}]:[]),
    ...(cfg.wish?[{key:'status',label:'Status',type:'select',options:[['done',WL?.[0]||'Done'],['want',WL?.[1]||'Want to do']]}]:[]),
    ...(cfg.rate?[{key:'rating',label:'Rating',type:'rating',show:v=>v.status!=='want'}]:[]),
    {key:'episodes',label:'Episodes watched',type:'number',show:v=>v.status!=='want'&&cols.some(c=>c.id===v.collection_id&&/series/i.test(lab(c)))},
    ...(cfg.cost?[{key:'cost',label:'Cost (₹)',type:'number'}]:[]),
    ...(cfg.prog?[{key:'progress',label:'Achieved (%)',type:'number'}]:[]),
    {key:'note',label:'Note',type:'multiline'}]}
   onSave={async v=>{const body={title:v.title.trim(),date:v.date||editRow.date,collection_id:v.collection_id,note:v.note||null};
    if(cfg.wish)body.status=v.status;if(cfg.rate)body.rating=v.status==='want'?null:(v.rating||null);
    if(cols.some(c=>c.id===v.collection_id&&/series/i.test(lab(c))))body.episodes=v.status==='want'?0:(+v.episodes||0);
    if(cfg.cost)body.cost=v.cost===''||v.cost==null?null:+v.cost;if(cfg.prog)body.progress=Math.max(0,Math.min(100,+v.progress||0));
    const r=await supabase.from('collection_entries').update(body).eq('id',editRow.id);if(r?.error)throw new Error('Could not save. Try again.');setEditRow(null);loadRows()}} onClose={()=>setEditRow(null)}/>
 </Stack>}
