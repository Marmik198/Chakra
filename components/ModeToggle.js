'use client';
import {IconButton,Tooltip,ToggleButton,ToggleButtonGroup} from '@mui/material';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import SettingsBrightnessRounded from '@mui/icons-material/SettingsBrightnessRounded';
import {useMode} from '@/app/providers';
const IC={light:LightModeRounded,dark:DarkModeRounded,system:SettingsBrightnessRounded},NEXT={system:'light',light:'dark',dark:'system'};
export default function ModeToggle({full}){
 const{mode,setMode}=useMode(),I=IC[mode];
 if(full)return <ToggleButtonGroup exclusive size="small" fullWidth value={mode} onChange={(_,v)=>v&&setMode(v)} aria-label="Theme">
  {Object.entries(IC).map(([k,Ic])=><ToggleButton key={k} value={k} aria-label={k} sx={{py:.5}}><Ic fontSize="small"/></ToggleButton>)}</ToggleButtonGroup>;
 return <Tooltip title={`Theme: ${mode}. Tap to change`}><IconButton aria-label="Change theme" onClick={()=>setMode(NEXT[mode])}><I/></IconButton></Tooltip>}
