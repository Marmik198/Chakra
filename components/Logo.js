'use client';
import {useId} from 'react';
import {Box,Typography} from '@mui/material';
const OP=[1,.9,.8,.7,.6,.5,.42,.36];
export default function Logo({size=34,word=true,mono=false,color}){
 const id='lg'+useId().replace(/[^a-z0-9]/gi,''),fg=mono?'currentColor':'#fff';
 return <Box sx={{display:'flex',alignItems:'center',gap:1.25,color}}>
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
   {!mono&&<><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6A4DF4"/><stop offset="1" stopColor="#E5457F"/></linearGradient></defs><rect width="64" height="64" rx="16" fill={`url(#${id})`}/></>}
   {OP.map((o,i)=><path key={i} d="M32 24C27 20 27 13 32 8C37 13 37 20 32 24Z" fill={fg} fillOpacity={o} transform={`rotate(${i*45} 32 32)`}/>)}
   <circle cx="32" cy="32" r="3.6" fill="#FFD36B"/></svg>
  {word&&<Typography variant="h6" sx={{letterSpacing:-.3,color:'inherit'}}>Chakra</Typography>}</Box>}
