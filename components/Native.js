'use client';
import {useEffect,useState} from 'react';
import {Box,Typography,Button,Switch,FormControlLabel} from '@mui/material';
import Logo from '@/components/Logo';
import {isNative,scheduleReminders} from '@/lib/native';
const ON=()=>localStorage.getItem('chakra-lock')==='1';
async function verify(){try{const{NativeBiometric}=await import('@capgo/capacitor-native-biometric');await NativeBiometric.verifyIdentity({reason:'Unlock Chakra',title:'Chakra',useFallback:true});return true}catch{return false}}
export default function Native(){
 const [locked,setLocked]=useState(false);
 const unlock=async()=>{if(await verify())setLocked(false)};
 useEffect(()=>{
  if(!isNative())return;let off=()=>{};
  (async()=>{
   if(ON()){setLocked(true);unlock()}
   scheduleReminders();
   const{App}=await import('@capacitor/app');let t=0;
   const h1=await App.addListener('appStateChange',({isActive})=>{if(!isActive){t=Date.now();return}scheduleReminders();if(ON()&&Date.now()-t>30000){setLocked(true);unlock()}});
   const h2=await App.addListener('backButton',({canGoBack})=>canGoBack?window.history.back():App.exitApp());
   off=()=>{h1.remove();h2.remove()}})();
  return()=>off()},[]);
 if(!locked)return null;
 return <Box sx={{position:'fixed',inset:0,zIndex:2000,bgcolor:'background.default',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3}}><Logo size={64}/><Typography color="text.secondary">Chakra is locked</Typography><Button variant="contained" onClick={unlock}>Unlock</Button></Box>}
export function LockToggle(){
 const [on,setOn]=useState(false),[nat,setNat]=useState(false);
 useEffect(()=>{if(isNative()){setNat(true);setOn(ON())}},[]);
 if(!nat)return null;
 const flip=async e=>{const v=e.target.checked;
  if(v){try{const{NativeBiometric}=await import('@capgo/capacitor-native-biometric');const r=await NativeBiometric.isAvailable({useFallback:true});if(!r.isAvailable){alert('Set up a fingerprint, face unlock or screen lock in Android settings first.');return}}catch{return}if(!(await verify()))return}
  localStorage.setItem('chakra-lock',v?'1':'0');setOn(v)};
 return <FormControlLabel control={<Switch size="small" checked={on} onChange={flip}/>} label="App lock" sx={{ml:0,mt:.5,display:'flex'}}/>}
