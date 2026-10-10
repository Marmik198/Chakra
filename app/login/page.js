'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {Box,Typography,TextField,Button,Alert,Stack,InputAdornment,ThemeProvider} from '@mui/material';
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded';
import Logo from '@/components/Logo';
import {mk} from '@/lib/theme';
import {supabase} from '@/lib/supabase';
const dark=mk('dark'),field={'& .MuiOutlinedInput-root':{bgcolor:'rgba(255,255,255,.08)',borderRadius:3.5,'& fieldset':{borderColor:'rgba(255,255,255,.18)'},'&.Mui-focused fieldset':{borderColor:'#B7A8FF'}}};
export default function Login(){
 const r=useRouter(),[email,setEmail]=useState(''),[d,setD]=useState(Array(6).fill('')),[sent,setSent]=useState(false),[err,setErr]=useState(''),[busy,setBusy]=useState(false),[left,setLeft]=useState(0),[vok,setVok]=useState(false),[showV,setShowV]=useState(false),refs=useRef([]);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>data.session&&r.replace('/'))},[r]);
 useEffect(()=>{const c=navigator.connection;if(c?.saveData||/2g/.test(c?.effectiveType||'')||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const id=setTimeout(()=>setShowV(true),600);return()=>clearTimeout(id)},[]);
 useEffect(()=>{if(left<=0)return;const t=setTimeout(()=>setLeft(left-1),1000);return()=>clearTimeout(t)},[left]);
 const code=d.join('');
 const send=async()=>{setBusy(true);setErr('');const{error}=await supabase.auth.signInWithOtp({email:email.trim()});setBusy(false);if(error)return setErr(error.message);setSent(true);setLeft(30);setD(Array(6).fill(''));setTimeout(()=>refs.current[0]?.focus(),50)};
 const verify=async()=>{setBusy(true);setErr('');const{error}=await supabase.auth.verifyOtp({email:email.trim(),token:code,type:'email'});setBusy(false);error?setErr(error.message):r.replace('/')};
 const set=(i,v)=>{const c=v.replace(/\D/g,'').slice(-1),n=[...d];n[i]=c;setD(n);if(c&&refs.current[i+1])refs.current[i+1].focus()};
 const key=(i,e)=>{if(e.key==='Backspace'&&!d[i]&&refs.current[i-1])refs.current[i-1].focus();if(e.key==='Enter'&&code.length===6)verify()};
 const paste=e=>{const t=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);if(!t)return;e.preventDefault();setD(Array.from({length:6},(_,k)=>t[k]||''));refs.current[Math.min(t.length,5)]?.focus()};
 const grad={background:'linear-gradient(135deg,#6A4DF4,#E5457F)',color:'#fff',py:1.5,borderRadius:3.5,fontSize:15,boxShadow:'0 8px 24px rgba(229,69,127,.35)','&:hover':{background:'linear-gradient(135deg,#7A5EF8,#EE5A91)'},'&.Mui-disabled':{opacity:.45,color:'#fff'}};
 return <ThemeProvider theme={dark}>
  <Box sx={{position:'fixed',inset:0,overflow:'auto',display:'flex',alignItems:'center',justifyContent:'center',p:2,color:'#EEEBFA',bgcolor:'#0E0D17',backgroundImage:'url(/login-poster.jpg)',backgroundSize:'cover',backgroundPosition:'center'}}>
   {showV&&<Box component="video" autoPlay muted loop playsInline preload="metadata" onCanPlay={()=>setVok(true)} sx={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:vok?1:0,transition:'opacity 1.2s','@media (prefers-reduced-motion: reduce)':{display:'none'}}}><source src="/login-bg.mp4" type="video/mp4"/></Box>}
   <Box sx={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(14,13,23,.1) 0%,rgba(14,13,23,.72) 100%)'}}/>
   <Box sx={{position:'relative',width:'100%',maxWidth:420,p:{xs:3.5,sm:4.5},borderRadius:7,textAlign:'center',bgcolor:'rgba(24,21,50,.48)',backdropFilter:'blur(26px) saturate(150%)',WebkitBackdropFilter:'blur(26px) saturate(150%)',border:'1px solid rgba(255,255,255,.16)',boxShadow:'0 30px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.14)'}}>
    <Box sx={{display:'flex',justifyContent:'center'}}><Logo size={52}/></Box>
    <Typography variant="h5" sx={{mt:3,mb:.5}}>{sent?'Check your email':'Welcome back'}</Typography>
    <Typography sx={{color:'rgba(238,235,250,.72)',mb:3,fontSize:14}}>{sent?<>We sent a 6-digit code to <b>{email}</b></>:'Sign in with a one-time code. No password needed.'}</Typography>
    <Stack spacing={2}>{err&&<Alert severity="error" sx={{textAlign:'left'}}>{err}</Alert>}
     {!sent?<>
      <TextField placeholder="you@example.com" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&email&&send()} fullWidth autoFocus sx={field} InputProps={{startAdornment:<InputAdornment position="start"><MailOutlineRounded sx={{color:'rgba(238,235,250,.6)'}}/></InputAdornment>}}/>
      <Button variant="contained" size="large" disabled={busy||!email.includes('@')} onClick={send} sx={grad}>Send code</Button></>
     :<>
      <Box sx={{display:'flex',gap:1,justifyContent:'center'}} onPaste={paste}>{d.map((v,i)=><TextField key={i} value={v} inputRef={el=>refs.current[i]=el} onChange={e=>set(i,e.target.value)} onKeyDown={e=>key(i,e)} inputProps={{inputMode:'numeric',maxLength:1,autoComplete:i?'off':'one-time-code','aria-label':`Digit ${i+1}`,style:{textAlign:'center',fontSize:22,fontWeight:800,padding:'15px 0'}}} sx={{...field,width:48}}/>)}</Box>
      <Button variant="contained" size="large" disabled={busy||code.length<6} onClick={verify} sx={grad}>Verify and continue</Button>
      <Box sx={{display:'flex',justifyContent:'space-between'}}><Button size="small" color="inherit" disabled={left>0||busy} onClick={send}>{left>0?`Resend in ${left}s`:'Resend code'}</Button><Button size="small" color="inherit" onClick={()=>{setSent(false);setErr('')}}>Change email</Button></Box></>}
    </Stack>
    <Typography variant="caption" sx={{display:'block',mt:3,color:'rgba(238,235,250,.55)'}}>Private to you · Passwordless sign in</Typography>
   </Box></Box></ThemeProvider>}
