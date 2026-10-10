'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {usePathname,useRouter} from 'next/navigation';
import {alpha,Box,Drawer,List,ListSubheader,ListItemButton,ListItemIcon,ListItemText,AppBar,Toolbar,Typography,Paper,BottomNavigation,BottomNavigationAction,ButtonBase} from '@mui/material';
import TodayRounded from '@mui/icons-material/TodayRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import ChecklistRounded from '@mui/icons-material/ChecklistRounded';
import FitnessCenterRounded from '@mui/icons-material/FitnessCenterRounded';
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded';
import BedtimeRounded from '@mui/icons-material/BedtimeRounded';
import RestaurantRounded from '@mui/icons-material/RestaurantRounded';
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import AssessmentRounded from '@mui/icons-material/AssessmentRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import SelfImprovementRounded from '@mui/icons-material/SelfImprovementRounded';
import LocalFireDepartmentRounded from '@mui/icons-material/LocalFireDepartmentRounded';
import EditNoteRounded from '@mui/icons-material/EditNoteRounded';
import MovieRounded from '@mui/icons-material/MovieRounded';
import LuggageRounded from '@mui/icons-material/LuggageRounded';
import CodeRounded from '@mui/icons-material/CodeRounded';
import StickyNote2Rounded from '@mui/icons-material/StickyNote2Rounded';
import FlagRounded from '@mui/icons-material/FlagRounded';
import AppsRounded from '@mui/icons-material/AppsRounded';
import Logo from '@/components/Logo';
import ModeToggle from '@/components/ModeToggle';
import UserMenu from '@/components/UserMenu';
import {supabase} from '@/lib/supabase';
const QuickAdd=dynamic(()=>import('@/components/QuickAdd'),{ssr:false});
const Reminders=dynamic(()=>import('@/components/Reminders'),{ssr:false});
const Native=dynamic(()=>import('@/components/Native'),{ssr:false});
const LockToggle=dynamic(()=>import('@/components/Native').then(m=>m.LockToggle),{ssr:false});
const GROUPS=[['Plan',[['/','Today',TodayRounded],['/schedule','Schedule',ScheduleRounded],['/tasks','Tasks',ChecklistRounded],['/streaks','Streaks',LocalFireDepartmentRounded],['/goals','Goals',FlagRounded]]],
 ['Body',[['/fitness','Fitness',FitnessCenterRounded],['/health','Health',MonitorHeartRounded],['/sleep','Sleep',BedtimeRounded],['/food','Food',RestaurantRounded]]],
 ['Money',[['/money','Money',AccountBalanceWalletRounded],['/reports','Reports',AssessmentRounded],['/investments','Invest',TrendingUpRounded]]],
 ['Life',[['/spiritual','Spiritual',SelfImprovementRounded],['/journal','Journal',EditNoteRounded],['/leisure','Leisure',MovieRounded],['/outings','Outings',LuggageRounded],['/tech','Tech',CodeRounded],['/notes','Notes',StickyNote2Rounded]]]];
const ACC={Today:'#14B8A6',Schedule:'#10B981',Tasks:'#3B82F6',Streaks:'#F59E0B',Goals:'#8B5CF6',Fitness:'#F97316',Health:'#EF4467',Sleep:'#6D8EF5',Food:'#22C55E',Money:'#0EA5E9',Reports:'#38BDF8',Invest:'#6366F1',Spiritual:'#E879A8',Journal:'#64748B',Leisure:'#A78BFA',Outings:'#06B6D4',Tech:'#84CC16',Notes:'#EAB308'};
const FLAT=Object.fromEntries(GROUPS.flatMap(g=>g[1]).map(i=>[i[1],i])),BOT=['Today','Tasks','Fitness','Money'].map(n=>FLAT[n]),W=212;
// Thin scrollbar in the theme colours: a soft violet-to-rose thumb that brightens on hover.
const scrollSx={flex:1,overflowY:'auto',overflowX:'hidden',scrollbarWidth:'thin',scrollbarColor:'rgba(139,124,248,.55) transparent','&::-webkit-scrollbar':{width:6},'&::-webkit-scrollbar-track':{background:'transparent'},'&::-webkit-scrollbar-thumb':{borderRadius:8,background:'linear-gradient(180deg,rgba(106,77,244,.5),rgba(229,69,127,.5))'},'&:hover::-webkit-scrollbar-thumb':{background:'linear-gradient(180deg,#6A4DF4,#E5457F)'}};
export default function Shell({children}){
 const path=usePathname(),r=useRouter(),[open,setOpen]=useState(false),[user,setUser]=useState(null);
 useEffect(()=>{
  supabase.auth.getSession().then(({data})=>data.session?setUser(data.session.user):r.replace('/login'));
  const{data:s}=supabase.auth.onAuthStateChange((_e,ss)=>{if(!ss)r.replace('/login')});
  return()=>s.subscription.unsubscribe()},[r]);
 if(!user)return null;
 const controls=<Box sx={{display:'flex',alignItems:'center',gap:1}}><ModeToggle/><UserMenu email={user.email} onSignOut={()=>supabase.auth.signOut()} extra={<LockToggle/>}/></Box>;
 const side=<Box sx={{display:'flex',flexDirection:'column',height:'100%',pt:2,pb:1}}><Box sx={{px:2,py:1.25}}><Logo size={30}/></Box>
  <Box sx={scrollSx}>{GROUPS.map(([g,items])=><List key={g} dense subheader={<ListSubheader disableSticky sx={{bgcolor:'transparent',lineHeight:'26px',fontWeight:700,fontSize:12,px:2}}>{g}</ListSubheader>}>{items.map(([h,l,I])=>
   <ListItemButton key={h} component={Link} href={h} selected={path===h} sx={{borderRadius:2.5,mx:1,mb:.25,py:.6,'&.Mui-selected':{bgcolor:alpha(ACC[l],.16),color:'text.primary'}}}>
    <ListItemIcon sx={{minWidth:34,color:ACC[l]}}><I fontSize="small"/></ListItemIcon><ListItemText primary={l} primaryTypographyProps={{fontWeight:600,fontSize:14}}/></ListItemButton>)}</List>)}</Box></Box>;
 return <Box sx={{display:'flex'}}>
  <Box component="a" href="#main" sx={{position:'absolute',left:-9999,'&:focus':{left:8,top:8,zIndex:3000,bgcolor:'background.paper',p:1.5,borderRadius:2}}}>Skip to content</Box>
  <AppBar position="fixed" color="inherit" elevation={0} sx={{display:{md:'none'},borderBottom:1,borderColor:'divider',pt:'env(safe-area-inset-top)'}}><Toolbar sx={{justifyContent:'space-between'}}><Logo/>{controls}</Toolbar></AppBar>
  <Box sx={{display:{xs:'none',md:'block'},position:'fixed',top:12,right:20,zIndex:1200}}>{controls}</Box>
  <Drawer variant="permanent" sx={{display:{xs:'none',md:'block'},'& .MuiDrawer-paper':{width:W,borderRight:1,borderColor:'divider'}}}>{side}</Drawer>
  <Drawer anchor="bottom" open={open} onClose={()=>setOpen(false)} sx={{display:{md:'none'}}} PaperProps={{sx:{borderTopLeftRadius:24,borderTopRightRadius:24,p:2,pb:'calc(16px + env(safe-area-inset-bottom))',maxHeight:'85vh'}}}>
   {GROUPS.map(([g,items])=><Box key={g} sx={{mb:1.5}}><Typography variant="caption" color="text.secondary" fontWeight={700} sx={{px:1}}>{g}</Typography>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.5,mt:.5}}>{items.map(([h,l,I])=><ButtonBase key={h} component={Link} href={h} onClick={()=>setOpen(false)} sx={{flexDirection:'column',gap:.5,py:1.25,borderRadius:3,color:'text.primary',bgcolor:path===h?alpha(ACC[l],.16):'transparent'}}><I sx={{color:ACC[l]}}/><Typography variant="caption" fontWeight={600}>{l}</Typography></ButtonBase>)}</Box></Box>)}</Drawer>
  <Paper elevation={0} square sx={{display:{md:'none'},position:'fixed',bottom:0,left:0,right:0,zIndex:1200,borderTop:1,borderColor:'divider',pb:'env(safe-area-inset-bottom)'}}>
   <BottomNavigation showLabels value={BOT.findIndex(b=>b[0]===path)} onChange={(_,v)=>v===BOT.length?setOpen(true):r.push(BOT[v][0])}>
    {BOT.map(([h,l,I])=><BottomNavigationAction key={h} label={l} icon={<I/>}/>)}<BottomNavigationAction label="More" icon={<AppsRounded/>}/></BottomNavigation></Paper>
  <Reminders/><Native/><QuickAdd/>
  <Box component="main" id="main" tabIndex={-1} sx={{flex:1,minWidth:0,ml:{md:`${W}px`},p:{xs:2,md:5},pt:{xs:'calc(72px + env(safe-area-inset-top))',md:7},pb:{xs:'calc(88px + env(safe-area-inset-bottom))',md:3},maxWidth:1200,display:'flex',flexDirection:'column',minHeight:'100vh'}}>
   <Box sx={{flex:1}}>{children}</Box>
   <Box component="footer" sx={{mt:6,pt:1.5,borderTop:1,borderColor:'divider',display:'flex',justifyContent:'space-between',gap:2,flexWrap:'wrap',fontSize:12,color:'text.secondary'}}><span>Chakra · Your days, tracked simply</span><span>© {new Date().getFullYear()}</span></Box></Box></Box>}