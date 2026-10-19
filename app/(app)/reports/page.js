'use client';
import {useEffect,useState,useMemo} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,Chip,LinearProgress,Tooltip} from '@mui/material';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import {BarChart} from '@/components/Charts';
import {Donut,Dot,rs} from '@/components/Donut';
import {TabBar,Pane} from '@/components/Tabs';
import {usePaged,Pager} from '@/components/Pager';
import Clamp from '@/components/Clamp';
import DataTable from '@/components/DataTable';
import {supabase} from '@/lib/supabase';
import {isNative} from '@/lib/native';
import {summarize,buckets,tagInfo,isoD,srcName} from '@/lib/reportCore';
import {downloadReport} from '@/lib/downloadReport';
import {toast} from '@/lib/toast';
const fd=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
const Stat=({l,v,c,s})=><Card sx={{p:2.5}}><Typography variant="body2" color="text.secondary">{l}</Typography><Typography variant="h5" sx={{color:c}}>{v}</Typography>{s&&<Typography variant="caption" color="text.secondary">{s}</Typography>}</Card>;
async function fetchRange(from,to){let all=[],a=0;for(;;){const{data}=await supabase.from('money_entries').select('*').gte('date',from).lte('date',to).order('date',{ascending:false}).range(a,a+999);if(!data?.length)break;all=all.concat(data);if(data.length<1000)break;a+=1000}return all}
function LogTable({rows,tags,type}){
 const sorted=[...rows].sort((a,b)=>b.date.localeCompare(a.date)),pg=usePaged(sorted,20,rows.length),total=rows.reduce((a,e)=>a+ +e.amount,0);
 return <Card sx={{p:2.5}}><Box sx={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:1,mb:1}}><Typography variant="h6">{type==='Income'?'Income log':'Expense log'}</Typography><Typography color="text.secondary">{rows.length} entries · {rs(total)}</Typography></Box>
  <DataTable rows={pg.slice} empty="No entries in this range." columns={[
   {label:'Date',render:e=>fd(e.date)},
   {label:'Tag',render:e=>{const t=tagInfo(tags,e.type,e.category);return <Tooltip title={t.name}><Chip size="small" label={t.name} sx={{maxWidth:'100%',bgcolor:`${t.color}33`,fontWeight:600}}/></Tooltip>}},
   {label:'Source',render:e=>e.source?srcName(e.source):'–'},
   {label:'Note',render:e=>e.note||'–'},
   {label:'Amount',align:'right',render:e=><Typography fontWeight={700}>{rs(+e.amount)}</Typography>}]}/><Pager pg={pg}/></Card>}
const Legend=({list,total})=><Stack spacing={.25} sx={{mt:2}}>{list.map(d=><Tooltip key={d.name} title={d.description||''} placement="left"><Box sx={{display:'flex',alignItems:'center',py:.5}}><Dot c={d.color}/><Clamp sx={{flex:1}}>{d.name}</Clamp><Typography variant="body2" color="text.secondary" sx={{mr:1.5}}>{(d.value/total*100).toFixed(0)}%</Typography><Typography fontWeight={700}>{rs(d.value)}</Typography></Box></Tooltip>)}</Stack>;
export default function Reports(){
 const now=new Date(),y=now.getFullYear(),m=now.getMonth(),today=isoD(now);
 const PRE={'This month':[isoD(new Date(y,m,1)),today],'Last month':[isoD(new Date(y,m-1,1)),isoD(new Date(y,m,0))],'Last 3 months':[isoD(new Date(y,m-2,1)),today],'This year':[`${y}-01-01`,today],'Last year':[`${y-1}-01-01`,`${y-1}-12-31`]};
 const [range,setRange]=useState(PRE['This month']),[pre,setPre]=useState('This month'),[entries,setEntries]=useState([]),[tags,setTags]=useState([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [from,to]=range,valid=from&&to&&from<=to;
 useEffect(()=>{supabase.from('money_tags').select('*').then(({data})=>setTags(data||[]))},[]);
 useEffect(()=>{if(!valid)return;let on=true;setLoading(true);fetchRange(from,to).then(r=>{if(on){setEntries(r);setLoading(false)}});return()=>{on=false}},[from,to,valid]);
 const S=useMemo(()=>summarize(entries,tags),[entries,tags]),B=useMemo(()=>valid?buckets(entries,from,to):{mode:'day',list:[]},[entries,from,to,valid]);
 const days=valid?Math.round((new Date(to+'T00:00')-new Date(from+'T00:00'))/864e5)+1:1,exp=entries.filter(e=>e.type==='Expense'),inc=entries.filter(e=>e.type==='Income');
 const bigAll=useMemo(()=>entries.filter(e=>e.type==='Expense').sort((a,b)=>+b.amount-+a.amount),[entries]),pgBig=usePaged(bigAll,10,`${from}${to}`);
 const dl=async()=>{setBusy(true);try{await downloadReport({from,to,entries,tags},isNative())}catch(e){toast('Could not create the PDF: '+(e?.message||'unknown error'))}setBusy(false)};
 const bm=Object.fromEntries(B.list.map(b=>[b.key,b]));
 return <Stack spacing={3}>
  <Box><Typography variant="h4">Reports</Typography><Typography color="text.secondary">See income, spending and graphs for any date range, and download them as a PDF.</Typography></Box>
  <Card sx={{p:2.5}}><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mb:2}}>{Object.keys(PRE).map(k=><Chip key={k} clickable label={k} color={pre===k?'primary':'default'} variant={pre===k?'filled':'outlined'} onClick={()=>{setPre(k);setRange(PRE[k])}}/>)}</Stack>
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
    <TextField label="From" type="date" InputLabelProps={{shrink:true}} value={from} inputProps={{max:to||today}} onChange={e=>{setPre('');setRange([e.target.value,to])}}/>
    <TextField label="To" type="date" InputLabelProps={{shrink:true}} value={to} inputProps={{min:from,max:today}} onChange={e=>{setPre('');setRange([from,e.target.value])}}/>
    <Box sx={{flex:1}}/><Button variant="contained" startIcon={<DownloadRounded/>} onClick={dl} disabled={busy||!valid||!entries.length}>{busy?'Preparing PDF...':'Download PDF'}</Button></Stack>
   {!valid&&<Typography color="error" variant="body2" sx={{mt:1}}>Pick a start date that is before the end date.</Typography>}
   {loading&&valid&&<LinearProgress sx={{mt:2}}/>}</Card>
  <TabBar id="reports" tabs={['Summary','Charts','Expenses','Income']}/>
  <Pane id="reports" name="Summary"><Stack spacing={3}>
   <Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr 1fr',md:'repeat(4,1fr)'}}}><Stat l="Earned" v={rs(S.earned)} c="success.main" s={`${S.count.Income} entries`}/><Stat l="Spent" v={rs(S.spent)} c="error.main" s={`${S.count.Expense} entries`}/><Stat l="Net" v={rs(S.net)} c={S.net<0?'error.main':undefined}/><Stat l="Savings rate" v={`${S.rate}%`} s={`Average spend ${rs(S.spent/days)} a day`}/></Box>
   <Box sx={{display:'grid',gap:3,gridTemplateColumns:{md:'1fr 1fr'}}}>
    <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1}}>Top spending tags</Typography>{S.listExpense.slice(0,8).map(d=><Box key={d.name} sx={{my:1.25}}><Box sx={{display:'flex',justifyContent:'space-between'}}><Box sx={{display:'flex',alignItems:'center',minWidth:0,flex:1,mr:1.5}}><Dot c={d.color}/><Clamp sx={{typography:'body2'}}>{d.name}</Clamp></Box><Typography variant="body2" color="text.secondary">{rs(d.value)}</Typography></Box><LinearProgress variant="determinate" value={d.value/S.listExpense[0].value*100} sx={{height:8,borderRadius:4,mt:.5,'& .MuiLinearProgress-bar':{bgcolor:d.color}}}/></Box>)}{!S.listExpense.length&&<Typography color="text.secondary">No spending in this range.</Typography>}</Card>
    <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1}}>Biggest expenses</Typography>
     <Typography variant="caption" color="text.secondary" sx={{display:'block',mb:1}}>All {bigAll.length} {bigAll.length===1?'expense':'expenses'} in this period, largest first.</Typography>
     <DataTable rows={pgBig.slice} minColWidth={84} empty="Nothing yet." columns={[
      {label:'Date',render:e=>new Date(e.date+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})},
      {label:'Tag',render:e=>{const t=tagInfo(tags,e.type,e.category);return <Tooltip title={t.name}><Chip size="small" label={t.name} sx={{maxWidth:'100%',bgcolor:`${t.color}33`,fontWeight:600}}/></Tooltip>}},
      {label:'Note',render:e=>e.note||'–'},
      {label:'Amount',align:'right',render:e=><Typography fontWeight={700}>{rs(+e.amount)}</Typography>}]}/><Pager pg={pgBig}/></Card></Box></Stack></Pane>
  <Pane id="reports" name="Charts"><Stack spacing={3}>
   <Box sx={{display:'grid',gap:3,gridTemplateColumns:{md:'1fr 1fr'}}}>
    <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:2}}>Spending by tag</Typography><Donut data={S.listExpense} total={S.spent} label="Spent"/><Legend list={S.listExpense} total={S.spent||1}/></Card>
    <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:2}}>Income by tag</Typography><Donut data={S.listIncome} total={S.earned} label="Earned"/><Legend list={S.listIncome} total={S.earned||1}/></Card></Box>
   <Box sx={{display:'grid',gap:3,gridTemplateColumns:{md:'1fr 1fr'}}}>
    <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:2}}>Spending by source</Typography><Donut data={S.listSourceExpense} total={S.spent} label="Spent"/><Legend list={S.listSourceExpense} total={S.spent||1}/></Card>
    <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:2}}>Income by source</Typography><Donut data={S.listSourceIncome} total={S.earned} label="Earned"/><Legend list={S.listSourceIncome} total={S.earned||1}/></Card></Box>
   <Card sx={{p:2.5}}><Typography variant="h6">Income and spending</Typography><Typography variant="caption" color="text.secondary">By {B.mode}</Typography>
    <BarChart height={300} xAxis={[{scaleType:'band',data:B.list.map(b=>b.key),valueFormatter:(k,c)=>c.location==='tick'?bm[k]?.label:(B.mode==='month'?k:B.mode==='week'?`Week of ${fd(k)}`:fd(k))}]} series={[{data:B.list.map(b=>b.income),label:'Income',color:'#0F9F8F',valueFormatter:v=>rs(v)},{data:B.list.map(b=>b.expense),label:'Spending',color:'#E0475B',valueFormatter:v=>rs(v)}]}/></Card></Stack></Pane>
  <Pane id="reports" name="Expenses"><LogTable rows={exp} tags={tags} type="Expense"/></Pane>
  <Pane id="reports" name="Income"><LogTable rows={inc} tags={tags} type="Income"/></Pane>
 </Stack>}
