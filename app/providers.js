'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {ThemeProvider,CssBaseline,useMediaQuery} from '@mui/material';
import {mk} from '@/lib/theme';
import Toaster from '@/components/Toaster';
const Ctx=createContext({mode:'system',setMode:()=>{}});
export const useMode=()=>useContext(Ctx);
export default function Providers({children}){
 const sys=useMediaQuery('(prefers-color-scheme: dark)'),[mode,setM]=useState('system');
 useEffect(()=>{const m=localStorage.getItem('chakra-mode');if(m)setM(m)},[]);
 const setMode=m=>{setM(m);localStorage.setItem('chakra-mode',m)};
 const eff=mode==='system'?(sys?'dark':'light'):mode,t=useMemo(()=>mk(eff),[eff]);
 return <Ctx.Provider value={{mode,setMode}}><ThemeProvider theme={t}><CssBaseline enableColorScheme/>{children}<Toaster/></ThemeProvider></Ctx.Provider>}
