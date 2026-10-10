'use client';
import {useEffect,useSyncExternalStore} from 'react';
import {Tabs,Tab,Box} from '@mui/material';
// Tiny shared store so a TabBar and the Panes on the same page stay in sync, and the last tab is remembered.
const S={v:{},tabs:{},ls:new Set()};
const sub=f=>{S.ls.add(f);return()=>S.ls.delete(f)};
const emit=()=>S.ls.forEach(f=>f());
export function useTab(id){
 useSyncExternalStore(sub,()=>S.v[id]??'',()=>'');
 const t=S.v[id],tabs=S.tabs[id]||[];return tabs.includes(t)?t:tabs[0];
}
export function TabBar({id,tabs}){
 S.tabs[id]=tabs;const t=useTab(id);
 useEffect(()=>{try{const x=localStorage.getItem('chakra-tab-'+id);if(x&&S.v[id]!==x){S.v[id]=x;emit()}}catch{}},[id]);
 return <Box sx={{borderBottom:1,borderColor:'divider',mb:2.5}}><Tabs value={t} onChange={(_,v)=>{S.v[id]=v;try{localStorage.setItem('chakra-tab-'+id,v)}catch{}emit()}} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Page sections">{tabs.map(x=><Tab key={x} value={x} label={x}/>)}</Tabs></Box>;
}
// Shows its children only on the named tab(s). `not` flips it. Without an id it always shows (so shared components work with or without tabs).
export function Pane({id,name,not,children}){
 const t=useTab(id);if(!id)return children;
 const names=[].concat(name),on=names.includes(t);return (not?!on:on)?children:null;
}
export function setTab(id,v){S.v[id]=v;try{localStorage.setItem('chakra-tab-'+id,v)}catch{}emit()}
