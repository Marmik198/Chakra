'use client';
import {useState} from 'react';
import {IconButton,Menu,MenuItem,ListItemIcon,Divider,Typography,Box} from '@mui/material';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
export default function UserMenu({email,onSignOut,extra}){
 const [a,setA]=useState(null),ini=(email||'?')[0].toUpperCase();
 return <>
  <IconButton aria-label="Account menu" aria-haspopup="menu" aria-expanded={!!a} onClick={e=>setA(e.currentTarget)} sx={{width:36,height:36,minWidth:36,minHeight:36,p:0}}>
   <Box sx={{width:36,height:36,borderRadius:'50%',display:'grid',placeItems:'center',bgcolor:'primary.main',color:'primary.contrastText',fontWeight:800,fontSize:15}}>{ini}</Box></IconButton>
  <Menu anchorEl={a} open={!!a} onClose={()=>setA(null)} anchorOrigin={{vertical:'bottom',horizontal:'right'}} transformOrigin={{vertical:'top',horizontal:'right'}} PaperProps={{sx:{mt:1,minWidth:240,borderRadius:3}}}>
   <Box sx={{px:2,py:1.25}}><Typography variant="caption" color="text.secondary">Signed in as</Typography><Typography fontWeight={700} noWrap sx={{maxWidth:260}}>{email}</Typography></Box>
   <Divider/>
   {extra&&<Box sx={{px:2,'&:empty':{display:'none'}}}>{extra}</Box>}
   <MenuItem onClick={()=>{setA(null);onSignOut()}} sx={{py:1.25}}><ListItemIcon><LogoutRounded fontSize="small"/></ListItemIcon>Sign out</MenuItem></Menu></>}