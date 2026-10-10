'use client';
import {useEffect,useState} from 'react';
import {Snackbar,Alert,Button,LinearProgress} from '@mui/material';
// Pop-up messages (errors, undo), a thin loading bar at the top, offline notices, and the offline cache worker.
export default function Toaster(){
 const [q,setQ]=useState([]),[cur,setCur]=useState(null),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const t=e=>setQ(x=>[...x,{k:Date.now()+Math.random(),...e.detail}]);let tm;
  const l=e=>{clearTimeout(tm);if(e.detail>0)tm=setTimeout(()=>setBusy(true),250);else setBusy(false)};
  const off=()=>t({detail:{msg:'You are offline. Saved screens still open, but changes will not save.',sev:'warning',ms:8000}}),on=()=>t({detail:{msg:'Back online.',sev:'success',ms:2500}});
  window.addEventListener('chakra-toast',t);window.addEventListener('chakra-load',l);window.addEventListener('offline',off);window.addEventListener('online',on);
  if('serviceWorker' in navigator&&process.env.NODE_ENV==='production'&&!window.Capacitor?.isNativePlatform?.())navigator.serviceWorker.register('/sw.js').catch(()=>{});
  return()=>{window.removeEventListener('chakra-toast',t);window.removeEventListener('chakra-load',l);window.removeEventListener('offline',off);window.removeEventListener('online',on)}},[]);
 useEffect(()=>{if(!cur&&q.length){setCur(q[0]);setQ(x=>x.slice(1))}},[q,cur]);
 return <>{busy&&<LinearProgress aria-label="Loading" sx={{position:'fixed',top:0,left:0,right:0,height:3,zIndex:3000}}/>}
  <Snackbar key={cur?.k} open={!!cur} autoHideDuration={cur?.ms||(cur?.sev==='error'?6000:4000)} onClose={(_,r)=>{if(r!=='clickaway')setCur(null)}} anchorOrigin={{vertical:'bottom',horizontal:'center'}} sx={{bottom:{xs:'calc(140px + env(safe-area-inset-bottom))',md:24}}}>
   <Alert severity={cur?.sev||'info'} variant="filled" sx={{width:'100%'}} {...(cur?.action?{action:<Button color="inherit" size="small" onClick={()=>{cur.onAction?.();setCur(null)}}>{cur.action}</Button>}:{onClose:()=>setCur(null)})}>{cur?.msg}</Alert></Snackbar></>}
