'use client';
import {useEffect,useState,useCallback} from 'react';
import {Snackbar,Alert,Button,Stack,Typography} from '@mui/material';
import {supabase} from '@/lib/supabase';
import {isDue,iso} from '@/lib/due';
const hm=d=>d.toTimeString().slice(0,5);
let cache={t:0,tasks:[]};
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return{}}};
const notify=async t=>{try{if(Notification.permission!=='granted')return;const body='Due at '+t.remind_time.slice(0,5),reg=await navigator.serviceWorker?.getRegistration();reg?reg.showNotification(t.title,{body,tag:t.id,icon:'/icon.svg'}):new Notification(t.title,{body})}catch{}};
export function AlertsPrompt(){
 const [p,setP]=useState('');
 useEffect(()=>{setP(typeof Notification==='undefined'?'unsupported':Notification.permission)},[]);
 if(p!=='default')return null;
 return <Alert severity="info" action={<Button color="inherit" size="small" onClick={async()=>setP(await Notification.requestPermission())}>Turn on</Button>}>Get a notification when a task with a reminder is due. Alerts work while Chakra is open in a browser tab or installed on your phone.</Alert>}
export default function Reminders(){
 const [due,setDue]=useState([]),[hide,setHide]=useState(false),sig=due.map(t=>t.id).join();
 const tick=useCallback(async()=>{
  const T=iso(new Date()),now=hm(new Date()),sn=get('chakra-snooze');
  if(Date.now()-cache.t>300000){const{data}=await supabase.from('tasks').select('*').eq('remind',true).neq('cycle','todo');cache={t:Date.now(),tasks:data||[]}}
  const cand=cache.tasks.filter(t=>t.remind_time&&isDue(t,T)&&((sn[t.id]?.d===T?sn[t.id].t:t.remind_time.slice(0,5))<=now));
  let done=new Set();if(cand.length){const{data}=await supabase.from('task_log').select('task_id').eq('date',T);done=new Set((data||[]).map(r=>r.task_id))}
  const list=cand.filter(t=>!done.has(t.id));
  const seen=Object.fromEntries(Object.entries(get('chakra-seen')).filter(([k])=>k.includes(T)));
  list.forEach(t=>{const k=t.id+T+(sn[t.id]?.d===T?sn[t.id].t:'');if(!seen[k]){seen[k]=1;notify(t)}});
  localStorage.setItem('chakra-seen',JSON.stringify(seen));setDue(list)},[]);
 useEffect(()=>{
  if(!window.Capacitor?.isNativePlatform?.())navigator.serviceWorker?.register('/sw.js').catch(()=>{});
  tick();const i=setInterval(tick,30000),v=()=>{if(document.visibilityState==='visible'){cache.t=0;tick()}};
  document.addEventListener('visibilitychange',v);return()=>{clearInterval(i);document.removeEventListener('visibilitychange',v)}},[tick]);
 useEffect(()=>setHide(false),[sig]);
 const done=async t=>{await supabase.from('task_log').insert({task_id:t.id,date:iso(new Date())});tick()};
 const snooze=t=>{const sn=get('chakra-snooze');sn[t.id]={d:iso(new Date()),t:hm(new Date(Date.now()+15*60000))};localStorage.setItem('chakra-snooze',JSON.stringify(sn));tick()};
 return <Snackbar open={due.length>0&&!hide} anchorOrigin={{vertical:'top',horizontal:'center'}} sx={{top:{xs:'calc(72px + env(safe-area-inset-top))',md:24},maxWidth:'calc(100% - 24px)'}}>
  <Alert severity="warning" onClose={()=>setHide(true)} sx={{width:'100%',alignItems:'flex-start'}}>
   <Typography fontWeight={700} sx={{mb:.5}}>{due.length} reminder{due.length>1?'s':''} due</Typography>
   <Stack spacing={1}>{due.slice(0,4).map(t=><Stack key={t.id} direction="row" spacing={1} alignItems="center"><Typography sx={{flex:1}}>{t.title}</Typography><Button size="small" onClick={()=>snooze(t)}>Snooze 15m</Button><Button size="small" variant="contained" onClick={()=>done(t)}>Done</Button></Stack>)}</Stack></Alert></Snackbar>}
