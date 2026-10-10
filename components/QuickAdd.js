'use client';
import {useEffect,useState,useMemo} from 'react';
import {useRouter} from 'next/navigation';
import {Fab,Dialog,TextField,List,ListItemButton,ListItemText,Menu,MenuItem,Typography,InputAdornment,Tooltip,Box} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import {setTab} from '@/components/Tabs';
const ACTIONS=[['Add a task','/tasks','tasks','Manage'],['Log a workout','/fitness','fitness','Log workout'],['Add food','/food','food','Today'],['Add an expense','/money','money','Overview'],['Log sleep','/sleep','sleep','Overview'],['Add a schedule item','/schedule','schedule','Add'],['Add an investment','/investments','invest','Add'],['Write a note','/notes']];
const PAGES=[['Today','/'],['Schedule','/schedule'],['Tasks','/tasks'],['Streaks','/streaks'],['Goals','/goals'],['Fitness','/fitness'],['Health','/health'],['Sleep','/sleep'],['Food','/food'],['Money','/money'],['Reports','/reports'],['Investments','/investments'],['Spiritual','/spiritual'],['Journal','/journal'],['Leisure','/leisure'],['Outings','/outings'],['Tech','/tech'],['Notes','/notes']];
export default function QuickAdd(){
 const r=useRouter(),[menu,setMenu]=useState(null),[pal,setPal]=useState(false),[q,setQ]=useState('');
 useEffect(()=>{const h=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPal(p=>!p)}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[]);
 const go=(path,id,tab)=>{if(id&&tab)setTab(id,tab);r.push(path);setMenu(null);setPal(false);setQ('')};
 const items=useMemo(()=>{const s=q.trim().toLowerCase();return[...ACTIONS.map(a=>({l:a[0],p:a[1],id:a[2],t:a[3],k:'Quick add'})),...PAGES.map(p=>({l:p[0],p:p[1],k:'Go to'}))].filter(x=>!s||x.l.toLowerCase().includes(s))},[q]);
 return <>
  <Box sx={{position:'fixed',right:16,bottom:{xs:'calc(76px + env(safe-area-inset-bottom))',md:20},zIndex:1100,display:'flex',flexDirection:'column',alignItems:'center',gap:1.5}}>
   <Tooltip title="Search or jump to (Ctrl+K)" placement="left"><Fab aria-label="Search" onClick={()=>setPal(true)} sx={{width:48,height:48,minHeight:48,bgcolor:'background.paper',color:'text.primary',border:1,borderColor:'divider','&:hover':{bgcolor:'action.hover'}}}><SearchRounded/></Fab></Tooltip>
   <Tooltip title="Quick add" placement="left"><Fab aria-label="Quick add" onClick={e=>setMenu(e.currentTarget)} sx={{width:48,height:48,minHeight:48,color:'#fff',backgroundImage:'linear-gradient(135deg,#6A4DF4,#E5457F)','&:hover':{backgroundImage:'linear-gradient(135deg,#7A5EF8,#EE5A91)'}}}><AddRounded/></Fab></Tooltip></Box>
  <Menu anchorEl={menu} open={!!menu} onClose={()=>setMenu(null)} anchorOrigin={{vertical:'top',horizontal:'right'}} transformOrigin={{vertical:'bottom',horizontal:'right'}}>{ACTIONS.map(a=><MenuItem key={a[0]} onClick={()=>go(a[1],a[2],a[3])}>{a[0]}</MenuItem>)}</Menu>
  <Dialog open={pal} onClose={()=>setPal(false)} fullWidth maxWidth="xs" PaperProps={{sx:{alignSelf:'flex-start',mt:{xs:8,md:12}}}}>
   <TextField autoFocus placeholder="Search sections or actions" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&items[0])go(items[0].p,items[0].id,items[0].t)}} InputProps={{startAdornment:<InputAdornment position="start"><SearchRounded/></InputAdornment>}} sx={{m:2}}/>
   <List dense sx={{maxHeight:360,overflow:'auto',pb:1}}>{items.map(x=><ListItemButton key={x.k+x.l} onClick={()=>go(x.p,x.id,x.t)}><ListItemText primary={x.l} secondary={x.k}/></ListItemButton>)}{!items.length&&<Typography color="text.secondary" sx={{px:2,py:1}}>No matches</Typography>}</List></Dialog></>}