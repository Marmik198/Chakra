'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,List,ListItemButton,ListItemText} from '@mui/material';
import {usePaged,Pager} from '@/components/Pager';
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
export default function Notes(){
 const [list,setList]=useState([]),[cur,setCur]=useState(null),t=useRef();
 const load=useCallback(async()=>{const{data}=await supabase.from('notes').select('*').order('updated_at',{ascending:false});setList(data||[])},[]);
 useEffect(()=>{load()},[load]);
 const pgN=usePaged(list),sel=list.find(x=>x.id===cur)||list[0];
 const edit=(k,v)=>{const nx={...sel,[k]:v};setList(l=>l.map(x=>x.id===nx.id?nx:x));clearTimeout(t.current);t.current=setTimeout(()=>supabase.from('notes').update({title:nx.title,body:nx.body,updated_at:new Date().toISOString()}).eq('id',nx.id),600)};
 const add=async()=>{const{data}=await supabase.from('notes').insert({title:'',body:''}).select().single();await load();setCur(data.id)};
 const del=()=>{const n=sel;undoable('Note',()=>supabase.from('notes').delete().eq('id',n.id),{id:n.id,hide:()=>{setList(l=>l.filter(y=>y.id!==n.id));setCur(null)},restore:load})};
 return <Stack spacing={3}><Box><Typography variant="h4">Notes</Typography><Typography color="text.secondary">Your private notebook. Changes save automatically.</Typography></Box>
  <Box sx={{display:'grid',gap:3,gridTemplateColumns:{md:'260px 1fr'}}}>
   <Card sx={{p:1.5}}><Button fullWidth variant="contained" onClick={add} sx={{mb:1}}>New note</Button><List dense>{pgN.slice.map(x=><ListItemButton key={x.id} selected={sel?.id===x.id} onClick={()=>setCur(x.id)} sx={{borderRadius:2}}><ListItemText primary={x.title||'Untitled'} primaryTypographyProps={{noWrap:true}}/></ListItemButton>)}</List><Pager pg={pgN}/></Card>
   <Card sx={{p:2.5}}>{sel?<Stack spacing={2}><TextField label="Title" value={sel.title||''} onChange={e=>edit('title',e.target.value)} fullWidth/><TextField label="Write anything" multiline minRows={14} value={sel.body||''} onChange={e=>edit('body',e.target.value)} fullWidth/><Box><Button color="error" onClick={del}>Delete note</Button></Box></Stack>:<Typography color="text.secondary">No notes yet. Create one to get started.</Typography>}</Card></Box></Stack>}
