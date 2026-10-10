'use client';
import {useState,useRef} from 'react';
import {Typography,Box,Paper} from '@mui/material';
export const rs=n=>'₹'+Math.round(n).toLocaleString('en-IN');
export const Dot=({c})=><Box component="span" sx={{display:'inline-block',width:10,height:10,borderRadius:'50%',bgcolor:c,mr:1,flexShrink:0}}/>;
export function Donut({data,total,label}){
 const [h,setH]=useState(null),ref=useRef(null),R=88,r=58,cx=100,cy=100,T=Math.PI*2,P=(q,t)=>[cx+q*Math.cos(t),cy+q*Math.sin(t)];
 if(!total)return <Typography color="text.secondary" sx={{py:4,textAlign:'center'}}>No {label.toLowerCase()} in this period.</Typography>;
 let a=-Math.PI/2;
 const arcs=data.map(d=>{const f=d.value/total,a0=a,a1=a+f*T;a=a1;let p;
  if(f>=.999)p=`M${cx-R} ${cy}A${R} ${R} 0 1 1 ${cx+R} ${cy}A${R} ${R} 0 1 1 ${cx-R} ${cy}ZM${cx-r} ${cy}A${r} ${r} 0 1 0 ${cx+r} ${cy}A${r} ${r} 0 1 0 ${cx-r} ${cy}Z`;
  else{const g=data.length>1?Math.min(.025,f*T/3):0,s=a0+g,e=a1-g,b=e-s>Math.PI?1:0,[x0,y0]=P(R,s),[x1,y1]=P(R,e),[x2,y2]=P(r,e),[x3,y3]=P(r,s);p=`M${x0} ${y0}A${R} ${R} 0 ${b} 1 ${x1} ${y1}L${x2} ${y2}A${r} ${r} 0 ${b} 0 ${x3} ${y3}Z`}
  return{...d,f,p}});
 const mv=(e,i)=>{const b=ref.current.getBoundingClientRect();setH({i,x:e.clientX-b.left,y:e.clientY-b.top,w:b.width})};
 const cur=h&&arcs[h.i];
 return <Box ref={ref} sx={{position:'relative',width:'100%',maxWidth:300,mx:'auto',color:'text.primary'}} onMouseLeave={()=>setH(null)}>
  <svg viewBox="0 0 200 200" width="100%" role="img" aria-label={`${label} by tag`}>
   {arcs.map((d,i)=><path key={d.name} d={d.p} fill={d.color} fillRule="evenodd" tabIndex={0} aria-label={`${d.name}: ${rs(d.value)}, ${(d.f*100).toFixed(1)} percent`} style={{cursor:'pointer',opacity:h&&h.i!==i?.5:1,transition:'opacity .15s',outline:'none'}} onMouseMove={e=>mv(e,i)} onClick={e=>mv(e,i)} onFocus={()=>setH({i,x:60,y:20,w:300})} onBlur={()=>setH(null)}/>)}
   <text x="100" y="96" textAnchor="middle" fontSize="11" style={{fill:'currentColor',opacity:.65}}>{cur?cur.name:label}</text>
   <text x="100" y="118" textAnchor="middle" fontSize="19" fontWeight="800" style={{fill:'currentColor'}}>{rs(cur?cur.value:total)}</text></svg>
  {cur&&<Paper elevation={6} sx={{position:'absolute',left:Math.max(0,Math.min(h.x+14,h.w-236)),top:h.y+14,zIndex:5,p:1.5,maxWidth:230,pointerEvents:'none'}}><Box sx={{display:'flex',alignItems:'center'}}><Dot c={cur.color}/><Typography fontWeight={800}>{cur.name}</Typography></Box><Typography variant="body2">{rs(cur.value)} · {(cur.f*100).toFixed(1)}%</Typography><Typography variant="caption" color="text.secondary">{cur.description}</Typography></Paper>}
 </Box>}
