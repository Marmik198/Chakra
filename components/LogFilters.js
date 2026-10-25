'use client';
import {Box,TextField,MenuItem,Button,Typography,InputAdornment} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import {SOURCES} from '@/lib/reportCore';
// Filter and sort controls for a list of money entries. Use applyLog(rows, filters, tagName) to get the shown rows.
export const NO_FILTER={q:'',type:'all',tag:'all',source:'all',sort:'newest'};
export const SORTS=[['newest','Date: newest first'],['oldest','Date: oldest first'],['high','Amount: high to low'],['low','Amount: low to high'],['tag','Tag: A to Z']];
export function applyLog(rows,f,tagName){
 const q=f.q.trim().toLowerCase();
 const out=rows.filter(x=>(f.type==='all'||x.type===f.type)&&(f.tag==='all'||tagName(x)===f.tag)&&(f.source==='all'||(x.source||'Not set')===f.source)&&(!q||`${x.note||''} ${tagName(x)} ${x.amount}`.toLowerCase().includes(q)));
 const cmp={newest:(a,b)=>b.date.localeCompare(a.date),oldest:(a,b)=>a.date.localeCompare(b.date),high:(a,b)=>+b.amount-+a.amount,low:(a,b)=>+a.amount-+b.amount,tag:(a,b)=>tagName(a).localeCompare(tagName(b))||b.date.localeCompare(a.date)}[f.sort]||(()=>0);
 return [...out].sort(cmp)}
export default function LogFilters({f,setF,rows,tagName,showType=true,shown}){
 const set=(k,v)=>setF({...f,[k]:v}),tagNames=[...new Set(rows.map(tagName))].sort(),hasNone=rows.some(x=>!x.source),active=JSON.stringify({...f,sort:'newest'})!==JSON.stringify(NO_FILTER);
 return <Box sx={{mb:2}}>
  <Box sx={{display:'grid',gap:1.5,gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
   <TextField size="small" placeholder="Search notes, tags, amounts" value={f.q} onChange={e=>set('q',e.target.value)} sx={{gridColumn:{sm:'span 2'}}} InputProps={{startAdornment:<InputAdornment position="start"><SearchRounded fontSize="small"/></InputAdornment>}} inputProps={{'aria-label':'Search entries'}}/>
   {showType&&<TextField select size="small" label="Type" value={f.type} onChange={e=>set('type',e.target.value)}><MenuItem value="all">All types</MenuItem><MenuItem value="Expense">Expenses</MenuItem><MenuItem value="Income">Income</MenuItem></TextField>}
   <TextField select size="small" label="Tag" value={f.tag} onChange={e=>set('tag',e.target.value)}><MenuItem value="all">All tags</MenuItem>{tagNames.map(n=><MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField>
   <TextField select size="small" label="Source" value={f.source} onChange={e=>set('source',e.target.value)}><MenuItem value="all">All sources</MenuItem>{SOURCES.map(s=><MenuItem key={s[0]} value={s[0]}>{s[1]}</MenuItem>)}{hasNone&&<MenuItem value="Not set">Not set</MenuItem>}</TextField>
   <TextField select size="small" label="Sort by" value={f.sort} onChange={e=>set('sort',e.target.value)}>{SORTS.map(s=><MenuItem key={s[0]} value={s[0]}>{s[1]}</MenuItem>)}</TextField></Box>
  <Box sx={{display:'flex',alignItems:'center',gap:1.5,mt:1}}><Typography variant="body2" color="text.secondary">Showing {shown} of {rows.length}</Typography>{active&&<Button size="small" onClick={()=>setF({...NO_FILTER,sort:f.sort})}>Clear filters</Button>}</Box></Box>}
