'use client';
import {useState} from 'react';
import {Tooltip,Box} from '@mui/material';
// Shows long text trimmed with "..." and puts the full text in a tooltip. Short text gets no tooltip.
// Pass a plain string as children. lines={2} allows two lines before trimming.
// The text is measured only when the pointer, finger or keyboard reaches it, so long tables stay fast to draw.
export default function Clamp({children,lines=1,sx,component='span',...rest}){
 const [cut,setCut]=useState(false),text=typeof children==='string'?children.trim():'';
 const measure=e=>{const el=e.currentTarget;setCut(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)};
 return <Tooltip title={cut?text:''} placement="top" arrow enterDelay={150} enterTouchDelay={0} leaveTouchDelay={4000}>
  <Box component={component} onMouseEnter={measure} onTouchStart={measure} onFocus={measure} sx={{display:lines>1?'-webkit-box':'block',WebkitLineClamp:lines>1?lines:undefined,WebkitBoxOrient:'vertical',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:lines>1?'normal':'nowrap',minWidth:0,maxWidth:'100%',wordBreak:'break-word',...sx}} {...rest}>{children}</Box></Tooltip>}
