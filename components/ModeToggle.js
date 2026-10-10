'use client';
import {IconButton,Tooltip} from '@mui/material';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import {useMode} from '@/app/providers';
// One small button: shows the sun in dark mode (tap for light) and the moon in light mode (tap for dark).
export default function ModeToggle(){
 const{mode,setMode}=useMode(),dark=mode!=='light',label=dark?'Switch to light mode':'Switch to dark mode';
 return <Tooltip title={label}><IconButton aria-label={label} onClick={()=>setMode(dark?'light':'dark')} sx={{width:36,height:36,minWidth:36,minHeight:36,border:1,borderColor:'divider',bgcolor:'background.paper'}}>{dark?<LightModeRounded fontSize="small"/>:<DarkModeRounded fontSize="small"/>}</IconButton></Tooltip>}