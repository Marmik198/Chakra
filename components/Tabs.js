'use client';
import {useEffect,useSyncExternalStore} from 'react';
import {Tabs,Tab,Box} from '@mui/material';
// Tiny shared store so a TabBar and the Panes on the same page stay in sync.
// The chosen tab lasts only while you stay on the page: leaving a page forgets it, so coming back always opens the first tab.
// setTab(id, name) picks a tab before you navigate (Quick add uses it), and is used once on arrival.
const S={v:{},tabs:{},m:{},ls:new Set(),clean:false};
const sub=f=>{S.ls.add(f);return()=>S.ls.delete(f)};
const emit=()=>S.ls.forEach(f=>f());
export function useTab(id){
 useSyncExternalStore(sub,()=>S.v[id]??'',()=>'');
 const t=S.v[id],tabs=S.tabs[id]||[];return tabs.includes(t)?t:tabs[0];
}
export function TabBar({id,tabs}){
 S.tabs[id]=tabs;const t=useTab(id);
 useEffect(()=>{
  // forget the tab remembered by earlier versions of the app (once)
  if(!S.clean){S.clean=true;try{Object.keys(localStorage).filter(k=>k.startsWith('chakra-tab-')).forEach(k=>localStorage.removeItem(k))}catch{}}
  // count the bars showing this id; when the last one goes away, forget the chosen tab (a short delay keeps a quick remount from losing it)
  S.m[id]=(S.m[id]||0)+1;
  return()=>{S.m[id]--;setTimeout(()=>{if(!S.m[id]){delete S.v[id];emit()}},0)};
 },[id]);
 return <Box sx={{borderBottom:1,borderColor:'divider',mb:2.5}}><Tabs value={t} onChange={(_,v)=>{S.v[id]=v;emit()}} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Page sections">{tabs.map(x=><Tab key={x} value={x} label={x}/>)}</Tabs></Box>;
}
// Shows its children only on the named tab(s). `not` flips it. Without an id it always shows (so shared components work with or without tabs).
export function Pane({id,name,not,children}){
 const t=useTab(id);if(!id)return children;
 const names=[].concat(name),on=names.includes(t);return (not?!on:on)?children:null;
}
export function setTab(id,v){S.v[id]=v;emit()}
