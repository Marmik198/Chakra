'use client';
import {useState,useEffect,useRef} from 'react';
import {Box,Popover,TextField,ButtonBase} from '@mui/material';
const PRESETS=['#EF4467','#F97316','#F59E0B','#22C55E','#14B8A6','#0EA5E9','#3B82F6','#6366F1','#8B5CF6','#D946EF','#94A3B8','#64748B'];
const clamp=n=>Math.min(1,Math.max(0,n));
const clean=h=>{let x=(h||'').trim().replace(/^#/,'');if(/^[0-9a-f]{3}$/i.test(x))x=x.split('').map(c=>c+c).join('');return /^[0-9a-f]{6}$/i.test(x)?'#'+x.toUpperCase():null};
function toHsv(hex){const n=parseInt(hex.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),d=mx-Math.min(r,g,b);let h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360}return{h,s:mx?d/mx:0,v:mx}}
function toHex({h,s,v}){const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))},x=n=>Math.round(f(n)*255).toString(16).padStart(2,'0');return('#'+x(5)+x(3)+x(1)).toUpperCase()}
function Drag({onMove,onKey,label,sx,children}){
 const ref=useRef(null);
 const go=e=>{const r=ref.current.getBoundingClientRect();onMove(clamp((e.clientX-r.left)/r.width),clamp((e.clientY-r.top)/r.height))};
 return <Box ref={ref} role="slider" tabIndex={0} aria-label={label} onKeyDown={onKey} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);go(e)}} onPointerMove={e=>{if(e.buttons)go(e)}}
  sx={{position:'relative',touchAction:'none',cursor:'crosshair',outline:'none','&:focus-visible':{boxShadow:'0 0 0 3px rgba(106,77,244,.6)'},...sx}}>{children}</Box>}
// A colour swatch that opens a picker (shade area, hue bar, quick colours) next to a hex code box. Both stay in sync.
export default function ColorField({value,onChange,label='Colour',compact=false}){
 const v0=clean(value)||'#94A3B8',[anchor,setAnchor]=useState(null),[text,setText]=useState(v0),[hsv,setHsv]=useState(toHsv(v0));
 useEffect(()=>{const c=clean(value);if(c){if(c!==toHex(hsv))setHsv(toHsv(c));setText(c)}},[value]); // eslint-disable-line react-hooks/exhaustive-deps
 const push=n=>{setHsv(n);const hex=toHex(n);setText(hex);onChange(hex)};
 const typed=e=>{const t=e.target.value;setText(t);const c=clean(t);if(c){setHsv(toHsv(c));onChange(c)}};
 const arrows=(e,fn)=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];if(d){e.preventDefault();fn(d)}};
 return <Box sx={{display:'flex',alignItems:'center',gap:1,flexShrink:0}}>
  <ButtonBase aria-label={`${label}: ${v0}. Open colour picker`} onClick={e=>setAnchor(e.currentTarget)} sx={{width:40,height:40,borderRadius:1.5,bgcolor:v0,border:'2px solid',borderColor:'divider',flexShrink:0,boxShadow:'inset 0 0 0 2px rgba(255,255,255,.22)'}}/>
  <TextField size="small" value={text} onChange={typed} onBlur={()=>setText(v0)} error={!clean(text)} placeholder="#6A4DF4" inputProps={{'aria-label':`${label} hex code`,maxLength:7,spellCheck:false,style:{fontFamily:'ui-monospace,Menlo,Consolas,monospace',textTransform:'uppercase'}}} sx={{width:compact?104:118}}/>
  <Popover open={!!anchor} anchorEl={anchor} onClose={()=>setAnchor(null)} anchorOrigin={{vertical:'bottom',horizontal:'left'}} slotProps={{paper:{sx:{p:2,width:248,mt:1}}}}>
   <Drag label="Shade and brightness" onMove={(x,y)=>push({...hsv,s:x,v:1-y})} onKey={e=>arrows(e,d=>push({...hsv,s:clamp(hsv.s+d[0]*.02),v:clamp(hsv.v+d[1]*.02)}))} sx={{height:150,borderRadius:2,background:`linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${hsv.h},100%,50%))`}}>
    <Box sx={{position:'absolute',left:`${hsv.s*100}%`,top:`${(1-hsv.v)*100}%`,width:18,height:18,ml:'-9px',mt:'-9px',borderRadius:'50%',border:'2px solid #fff',boxShadow:'0 0 0 1px rgba(0,0,0,.45)',bgcolor:v0,pointerEvents:'none'}}/></Drag>
   <Drag label="Hue" onMove={x=>push({...hsv,h:Math.min(359.9,x*360)})} onKey={e=>arrows(e,d=>push({...hsv,h:(hsv.h+d[0]*4+360)%360}))} sx={{height:14,borderRadius:7,mt:2,background:'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)'}}>
    <Box sx={{position:'absolute',left:`${hsv.h/360*100}%`,top:'50%',width:18,height:18,ml:'-9px',mt:'-9px',borderRadius:'50%',border:'2px solid #fff',boxShadow:'0 0 0 1px rgba(0,0,0,.45)',bgcolor:`hsl(${hsv.h},100%,50%)`,pointerEvents:'none'}}/></Drag>
   <Box sx={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:1,mt:2}}>{PRESETS.map(p=><ButtonBase key={p} aria-label={`Use ${p}`} onClick={()=>push(toHsv(p))} sx={{height:28,borderRadius:1,bgcolor:p,outline:p===v0?'2px solid #6A4DF4':'none',outlineOffset:2}}/>)}</Box>
  </Popover></Box>}
