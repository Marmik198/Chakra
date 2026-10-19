'use client';
import {Box,Typography} from '@mui/material';
import Clamp from '@/components/Clamp';
// A table where every data column is exactly the same width.
// Text that does not fit wraps onto 2 lines, then is trimmed with "..." and the full text shows in a tooltip.
// On a narrow screen the table scrolls sideways instead of squeezing the columns.
// columns: [{label, render(row) or key, align:'right'|'left'}]. actions(row) adds a fixed-width last column.
// leading(row) adds a fixed-width first column (for a checkbox). strike(row) crosses out a finished row.
export default function DataTable({columns,rows,rowKey='id',actions,actionsWidth=56,leading,leadingWidth=48,strike,empty='Nothing here yet.',minColWidth=110,onRowClick,maxHeight,headerSx}){
 const n=columns.length,grid=`${leading?`${leadingWidth}px `:''}repeat(${n},minmax(0,1fr))${actions?` ${actionsWidth}px`:''}`,min=n*minColWidth+(actions?actionsWidth:0)+(leading?leadingWidth:0);
 const row={display:'grid',gridTemplateColumns:grid,columnGap:1.5,px:1,alignItems:'center'};
 const cell=(c,r)=>{const v=c.render?c.render(r):r[c.key];return typeof v==='string'||typeof v==='number'?<Clamp lines={2} sx={{textAlign:c.align||'left',...(strike&&strike(r)?{textDecoration:'line-through',color:'text.secondary'}:{})}}>{String(v)}</Clamp>:v};
 return <Box role="table" sx={{overflowX:'auto',...(maxHeight?{maxHeight,overflowY:'auto'}:{})}}><Box sx={{minWidth:min}}>
  <Box role="row" sx={{...row,py:1,borderBottom:2,borderColor:'divider',...(maxHeight?{position:'sticky',top:0,zIndex:2,bgcolor:'background.paper'}:{}),...headerSx}}>{leading&&<Box/>}{columns.map(c=><Typography key={c.label} role="columnheader" variant="caption" fontWeight={700} color="text.secondary" sx={{textAlign:c.align||'left',textTransform:'uppercase',letterSpacing:.4}}>{c.label}</Typography>)}{actions&&<Box/>}</Box>
  {rows.map(r=><Box key={r[rowKey]} role="row" sx={{...row,py:1,borderBottom:1,borderColor:'divider','&:hover':{bgcolor:'action.hover'},...(onRowClick?{cursor:'pointer'}:{})}} {...(onRowClick?{tabIndex:0,onClick:()=>onRowClick(r),onKeyDown:e=>{if(e.key==='Enter'&&e.target===e.currentTarget)onRowClick(r)}}:{})}>
   {leading&&<Box role="cell" sx={{display:'flex',justifyContent:'center'}}>{leading(r)}</Box>}
   {columns.map(c=><Box key={c.label} role="cell" sx={{minWidth:0,textAlign:c.align||'left',wordBreak:'break-word'}}>{cell(c,r)}</Box>)}
   {actions&&<Box role="cell" sx={{display:'flex',justifyContent:'flex-end'}}>{actions(r)}</Box>}</Box>)}
  {!rows.length&&<Typography color="text.secondary" sx={{py:2,px:1}}>{empty}</Typography>}</Box></Box>}
