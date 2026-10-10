'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {ThemeProvider,CssBaseline} from '@mui/material';
import {mk} from '@/lib/theme';
import Toaster from '@/components/Toaster';
const Ctx=createContext({mode:'dark',setMode:()=>{}});
export const useMode=()=>useContext(Ctx);
export default function Providers({children}){
 const [mode,setM]=useState('dark');
 useEffect(()=>{try{if(localStorage.getItem('chakra-mode')==='light')setM('light')}catch{}},[]);
 // The page background colour in app/layout.js is driven by this attribute, so it must follow every change.
 useEffect(()=>{const r=document.documentElement;r.setAttribute('data-mode',mode);r.style.colorScheme=mode},[mode]);
 const setMode=m=>{setM(m);try{localStorage.setItem('chakra-mode',m)}catch{}};
 const t=useMemo(()=>mk(mode),[mode]);
 return <Ctx.Provider value={{mode,setMode}}><ThemeProvider theme={t}><CssBaseline enableColorScheme/>{children}<Toaster/></ThemeProvider></Ctx.Provider>}