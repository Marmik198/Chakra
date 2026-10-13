'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,LinearProgress,IconButton} from '@mui/material';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import UndoRounded from '@mui/icons-material/UndoRounded';
import {TabBar,Pane} from '@/components/Tabs';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso} from '@/lib/due';
const ST=['Planned','Learning','Done'];
export default function Tech(){
 const [col,setCol]=useState(null),[rows,setRows]=useState([]),[f,setF]=useState({title:'',note:''}),seeded=useRef(false);
 useEffect(()=>{(async()=>{let{data}=await supabase.from('collections').select('*').eq('section','tech');
  if(!data?.length&&!seeded.current){seeded.current=true;await supabase.from('collections').insert({section:'tech',name:'Tech'});({data}=await supabase.from('collections').select('*').eq('section','tech'))}
  setCol(data?.[0]||null)})()},[]);
 const load=useCallback(async()=>{if(!col)return;const{data}=await supabase.from('collection_entries').select('*').eq('collection_id',col.id).order('date');setRows(data||[])},[col?.id]);
 useEffect(()=>{load()},[load]);
 const add=async()=>{if(!f.title.trim()||!col)return;await supabase.from('collection_entries').insert({collection_id:col.id,date:iso(new Date()),title:f.title.trim(),note:f.note,rating:0});setF({title:'',note:''});load()};
 const move=async(x,to=Math.min(2,(x.rating||0)+1))=>{setRows(r=>r.map(y=>y.id===x.id?{...y,rating:to}:y));const r=await supabase.from('collection_entries').update({rating:to}).eq('id',x.id);if(r?.error)load()};
 const del=x=>undoable('Item',()=>supabase.from('collection_entries').delete().eq('id',x.id),{id:x.id,hide:()=>setRows(r=>r.filter(y=>y.id!==x.id)),restore:load});
 const done=rows.filter(x=>x.rating===2).length;
 return <Stack spacing={3}><Box><Typography variant="h4">Tech</Typography><Typography color="text.secondary">Technologies you plan to learn, are learning, and have finished.</Typography></Box>
  <TabBar id="tech" tabs={['Board','Add']}/>
  <Card sx={{p:2.5}}><Box sx={{display:'flex',justifyContent:'space-between',mb:1}}><Typography variant="h6">Progress</Typography><Typography color="text.secondary">{done} of {rows.length} done</Typography></Box><LinearProgress variant="determinate" color="secondary" value={rows.length?done/rows.length*100:0} sx={{height:8,borderRadius:4,mb:2}}/>
   <Pane id="tech" name="Add"><Stack direction="row" spacing={2} useFlexGap flexWrap="wrap"><TextField label="Technology or topic" value={f.title} onChange={e=>setF({...f,title:e.target.value})} sx={{flex:1,minWidth:180}}/><TextField label="Resource or note" value={f.note} onChange={e=>setF({...f,note:e.target.value})} sx={{flex:1,minWidth:180}}/><Button variant="contained" onClick={add}>Add</Button></Stack></Pane></Card>
  <Pane id="tech" name="Board"><Box sx={{display:'grid',gap:2,gridTemplateColumns:{md:'repeat(3,1fr)'}}}>{ST.map((s,i)=>{const l=rows.filter(x=>(x.rating||0)===i);return <Card key={s} sx={{p:2}}><Box sx={{display:'flex',justifyContent:'space-between',mb:1}}><Typography variant="h6">{s}</Typography><Typography color="text.secondary">{l.length}</Typography></Box>
   {l.map(x=><Box key={x.id} sx={{display:'flex',alignItems:'center',gap:1,py:1,borderTop:1,borderColor:'divider'}}><Box sx={{flex:1}}><Typography fontWeight={700} sx={{textDecoration:i===2?'line-through':'none',color:i===2?'text.secondary':'text.primary'}}>{x.title}</Typography><Typography variant="body2" color="text.secondary">{x.note}</Typography></Box><Button size="small" variant="outlined" color={i===2?'inherit':'primary'} startIcon={i===2?<UndoRounded fontSize="small"/>:undefined} onClick={()=>move(x,i===2?1:i+1)} aria-label={i===2?`Mark ${x.title} as not done`:undefined}>{i===2?'Not done':i?'Done':'Start'}</Button><IconButton size="small" aria-label="Delete" onClick={()=>del(x)}><DeleteRounded fontSize="small"/></IconButton></Box>)}
   {!l.length&&<Typography variant="body2" color="text.secondary">Empty.</Typography>}</Card>})}</Box></Pane></Stack>}
