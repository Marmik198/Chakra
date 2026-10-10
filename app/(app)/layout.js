'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {usePathname,useRouter} from 'next/navigation';
import {alpha,Box,Drawer,List,ListSubheader,ListItemButton,ListItemIcon,ListItemText,AppBar,Toolbar,Typography,Button,Paper,BottomNavigation,BottomNavigationAction,ButtonBase} from '@mui/material';
import TodayRounded from '@mui/icons-material/TodayRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import AssessmentRounded from '@mui/icons-material/AssessmentRounded';
import ChecklistRounded from '@mui/icons-material/ChecklistRounded';
import FitnessCenterRounded from '@mui/icons-material/FitnessCenterRounded';
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded';
import RestaurantRounded from '@mui/icons-material/RestaurantRounded';
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import SelfImprovementRounded from '@mui/icons-material/SelfImprovementRounded';
import LocalFireDepartmentRounded from '@mui/icons-material/LocalFireDepartmentRounded';
import EditNoteRounded from '@mui/icons-material/EditNoteRounded';
import MovieRounded from '@mui/icons-material/MovieRounded';
import LuggageRounded from '@mui/icons-material/LuggageRounded';
import CodeRounded from '@mui/icons-material/CodeRounded';
import StickyNote2Rounded from '@mui/icons-material/StickyNote2Rounded';
import BedtimeRounded from '@mui/icons-material/BedtimeRounded';
import FlagRounded from '@mui/icons-material/FlagRounded';
import AppsRounded from '@mui/icons-material/AppsRounded';
import Logo from '@/components/Logo';
import ModeToggle from '@/components/ModeToggle';
const QuickAdd=dynamic(()=>import('@/components/QuickAdd'),{ssr:false});
const Reminders=dynamic(()=>import('@/components/Reminders'),{ssr:false});
const Native=dynamic(()=>import('@/components/Native'),{ssr:false});
const LockToggle=dynamic(()=>import('@/components/Native').then(m=>m.LockToggle),{ssr:false});
import {supabase} from '@/lib/supabase';
const GROUPS=[['Plan',[['/','Today',TodayRounded],['/schedule','Schedule',ScheduleRounded],['/tasks','Tasks',ChecklistRounded],['/streaks','Streaks',LocalFireDepartmentRounded],['/goals','Goals',FlagRounded]]],
 ['Body',[['/fitness','Fitness',FitnessCenterRounded],['/health','Health',MonitorHeartRounded],['/sleep','Sleep',BedtimeRounded],['/food','Food',RestaurantRounded]]],
 ['Money',[['/money','Money',AccountBalanceWalletRounded],['/reports','Reports',AssessmentRounded],['/investments','Invest',TrendingUpRounded]]],
 ['Life',[['/spiritual','Spiritual',SelfImprovementRounded],['/journal','Journal',EditNoteRounded],['/leisure','Leisure',MovieRounded],['/outings','Outings',LuggageRounded],['/tech','Tech',CodeRounded],['/notes','Notes',StickyNote2Rounded]]]];
const ACC={Today:'#14B8A6',Schedule:'#10B981',Tasks:'#3B82F6',Streaks:'#F59E0B',Goals:'#8B5CF6',Fitness:'#F97316',Health:'#EF4467',Sleep:'#6D8EF5',Food:'#22C55E',Money:'#0EA5E9',Reports:'#38BDF8',Invest:'#6366F1',Spiritual:'#E879A8',Journal:'#64748B',Leisure:'#A78BFA',Outings:'#06B6D4',Tech:'#84CC16',Notes:'#EAB308'};
const BOT=[GROUPS[0][1][0],GROUPS[0][1][2],GROUPS[1][1][0],GROUPS[2][1][0]],W=252;
export default function Shell({children}){
 const path=usePathname(),r=useRouter(),[open,setOpen]=useState(false),[user,setUser]=useState(null);
 useEffect(()=>{
  supabase.auth.getSession().then(({data})=>data.session?setUser(data.session.user):r.replace('/login'));
  const{data:s}=supabase.auth.onAuthStateChange((_e,ss)=>{if(!ss)r.replace('/login')});
  return()=>s.subscription.unsubscribe()},[r]);
 if(!user)return null;
 const foot=<Box sx={{px:2,pt:1}}><ModeToggle full/><LockToggle/><Typography variant="caption" color="text.secondary" noWrap display="block" sx={{mt:1.5}}>{user.email}</Typography><Button size="small" color="inherit" onClick={()=>supabase.auth.signOut()} sx={{px:0}}>Sign out</Button></Box>;
 const side=<Box sx={{display:'flex',flexDirection:'column',height:'100%',py:2}}><Box sx={{px:3,py:1.5}}><Logo/></Box>
  <Box sx={{flex:1,overflowY:'auto'}}>{GROUPS.map(([g,items])=><List key={g} dense subheader={<ListSubheader disableSticky sx={{bgcolor:'transparent',lineHeight:'28px',fontWeight:700}}>{g}</ListSubheader>}>{items.map(([h,l,I])=>
   <ListItemButton key={h} component={Link} href={h} selected={path===h} sx={{borderRadius:3,mx:1.5,mb:.25,'&.Mui-selected':{bgcolor:alpha(ACC[l],.16),color:'text.primary'}}}>
    <ListItemIcon sx={{minWidth:38,color:ACC[l]}}><I fontSize="small"/></ListItemIcon><ListItemText primary={l} primaryTypographyProps={{fontWeight:600}}/></ListItemButton>)}</List>)}</Box>{foot}</Box>;
 return <Box sx={{display:'flex'}}>
  <Box component="a" href="#main" sx={{position:'absolute',left:-9999,'&:focus':{left:8,top:8,zIndex:3000,bgcolor:'background.paper',p:1.5,borderRadius:2}}}>Skip to content</Box>
  <AppBar position="fixed" color="inherit" elevation={0} sx={{display:{md:'none'},borderBottom:1,borderColor:'divider',pt:'env(safe-area-inset-top)'}}><Toolbar sx={{justifyContent:'space-between'}}><Logo/><ModeToggle/></Toolbar></AppBar>
  <Drawer variant="permanent" sx={{display:{xs:'none',md:'block'},'& .MuiDrawer-paper':{width:W,borderRight:1,borderColor:'divider'}}}>{side}</Drawer>
  <Drawer anchor="bottom" open={open} onClose={()=>setOpen(false)} sx={{display:{md:'none'}}} PaperProps={{sx:{borderTopLeftRadius:24,borderTopRightRadius:24,p:2,pb:'calc(16px + env(safe-area-inset-bottom))',maxHeight:'85vh'}}}>
   {GROUPS.map(([g,items])=><Box key={g} sx={{mb:1.5}}><Typography variant="caption" color="text.secondary" fontWeight={700} sx={{px:1}}>{g}</Typography>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.5,mt:.5}}>{items.map(([h,l,I])=><ButtonBase key={h} component={Link} href={h} onClick={()=>setOpen(false)} sx={{flexDirection:'column',gap:.5,py:1.25,borderRadius:3,color:'text.primary',bgcolor:path===h?alpha(ACC[l],.16):'transparent'}}><I sx={{color:ACC[l]}}/><Typography variant="caption" fontWeight={600}>{l}</Typography></ButtonBase>)}</Box></Box>)}
   {foot}</Drawer>
  <Paper elevation={0} square sx={{display:{md:'none'},position:'fixed',bottom:0,left:0,right:0,zIndex:1200,borderTop:1,borderColor:'divider',pb:'env(safe-area-inset-bottom)'}}>
   <BottomNavigation showLabels value={BOT.findIndex(b=>b[0]===path)} onChange={(_,v)=>v===BOT.length?setOpen(true):r.push(BOT[v][0])}>
    {BOT.map(([h,l,I])=><BottomNavigationAction key={h} label={l} icon={<I/>}/>)}<BottomNavigationAction label="More" icon={<AppsRounded/>}/></BottomNavigation></Paper>
  <Reminders/><Native/><QuickAdd/>
  <Box component="main" id="main" tabIndex={-1} sx={{flex:1,minWidth:0,ml:{md:`${W}px`},p:{xs:2,md:5},pt:{xs:'calc(72px + env(safe-area-inset-top))',md:5},pb:{xs:'calc(88px + env(safe-area-inset-bottom))',md:5},maxWidth:1200}}>{children}</Box></Box>}
