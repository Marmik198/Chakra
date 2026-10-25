'use client';
import {useEffect,useState,useCallback} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,Select,MenuItem,List,ListItem,ListItemText} from '@mui/material';
import {TabBar,Pane} from '@/components/Tabs';
import {usePaged,Pager} from '@/components/Pager';
import Clamp from '@/components/Clamp';
import DataTable from '@/components/DataTable';
const fday=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
import FormGrid,{Wide,Field} from '@/components/FormGrid';
import {supabase} from '@/lib/supabase';
import {iso} from '@/lib/due';
const SRC=['Mutual funds','Stocks','Gold','FD','Crypto','Real estate','Other'];
const rs=n=>(n<0?'−':'')+'₹'+Math.abs(Math.round(n)).toLocaleString('en-IN');
const Stat=({l,v,c})=><Card sx={{p:2.5}}><Typography variant="body2" color="text.secondary">{l}</Typography><Typography variant="h5" sx={{color:c}}>{v}</Typography></Card>;
export default function Investments(){
 const [A,setA]=useState([]),[T,setT]=useState([]),[f,setF]=useState({name:'',source:'Mutual funds',amount:'',units:''}),[val,setVal]=useState({}),[sell,setSell]=useState({});
 const load=useCallback(async()=>{const[a,b]=await Promise.all([supabase.from('investments').select('*'),supabase.from('investment_txns').select('*,investments(name,source)').eq('kind','sell').order('date',{ascending:false})]);setA(a.data||[]);setT(b.data||[])},[]);
 useEffect(()=>{load()},[load]);
 const add=async()=>{const a=+f.amount,n=f.name.trim(),un=+f.units||0;if(!n||!(a>0))return;const ex=A.find(x=>x.name.toLowerCase()===n.toLowerCase()&&x.source===f.source&&+x.cost>0);let id;
  if(ex){id=ex.id;await supabase.from('investments').update({cost:+ex.cost+a,value:+ex.value+a,units:+(ex.units||0)+un}).eq('id',id)}else{const{data}=await supabase.from('investments').insert({name:n,source:f.source,cost:a,value:a,units:un}).select().single();id=data.id}
  await supabase.from('investment_txns').insert({investment_id:id,kind:'buy',amount:a});setF({...f,name:'',amount:'',units:''});load()};
 const upd=async x=>{const v=parseFloat(val[x.id]);if(isNaN(v))return;await supabase.from('investments').update({value:v}).eq('id',x.id);setVal({...val,[x.id]:''});load()};
 const doSell=async x=>{const s=sell[x.id]||{},p=parseFloat(s.proceeds);let q=parseFloat(s.pct);if(isNaN(q)&&+x.units>0&&s.units!=null&&s.units!=='')q=+s.units/+x.units*100;if(isNaN(p)||isNaN(q)||q<=0||q>100)return;
  const cs=q>=100?+x.cost:+x.cost*q/100,pnl=Math.round(p-cs),left=q>=100?0:+x.units*(1-q/100);
  await supabase.from('investments').update({cost:q>=100?0:+x.cost-cs,value:q>=100?0:+x.value*(100-q)/100,units:left,realized:+x.realized+pnl}).eq('id',x.id);
  await supabase.from('investment_txns').insert({investment_id:x.id,kind:'sell',amount:p,pnl});
  if(pnl!==0){const inc=pnl>0,name=inc?'Investment returns':'Investment loss';await supabase.from('money_tags').upsert({name,kind:inc?'income':'expense',color:inc?'#6366F1':'#EF4467',description:inc?'Profits from selling investments.':'Losses from selling investments.'},{onConflict:'user_id,name,kind',ignoreDuplicates:true});await supabase.from('money_entries').insert({date:iso(new Date()),type:inc?'Income':'Expense',category:name,amount:Math.abs(pnl),note:`Sold ${x.name}`})}
  setSell({...sell,[x.id]:{}});load()};
 const pgT=usePaged(T),H=A.filter(x=>+x.cost>0),sm=(l,k)=>l.reduce((a,x)=>a+ +x[k],0),cost=sm(H,'cost'),cur=sm(H,'value'),un=cur-cost,re=sm(A,'realized');
 const by=SRC.map(s=>({s,u:sm(H.filter(x=>x.source===s),'value')-sm(H.filter(x=>x.source===s),'cost'),r:sm(A.filter(x=>x.source===s),'realized')})).filter(x=>x.u||x.r);
 const col=n=>n>=0?'success.main':'error.main';
 return <Stack spacing={3}><Box><Typography variant="h4">Investments</Typography><Typography color="text.secondary">Holdings by source, and realized profit or loss when you sell.</Typography></Box>
  <TabBar id="invest" tabs={["Overview", "Holdings", "Profit & loss", "Add"]}/>
<Pane id="invest" name="Overview"><Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr 1fr',md:'repeat(4,1fr)'}}}><Stat l="Invested" v={rs(cost)}/><Stat l="Current value" v={rs(cur)}/><Stat l={`Unrealized${cost?` (${(un/cost*100).toFixed(1)}%)`:''}`} v={rs(un)} c={col(un)}/><Stat l="Realized" v={rs(re)} c={col(re)}/></Box>
  </Pane><Pane id="invest" name="Add"><Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1.5}}>Add an investment</Typography><FormGrid>
    <TextField label="Asset name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
    <TextField select label="Source" value={f.source} onChange={e=>setF({...f,source:e.target.value})}>{SRC.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
    <TextField label="Amount (₹)" type="number" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/>
    <TextField label="Units (optional)" type="number" value={f.units} onChange={e=>setF({...f,units:e.target.value})}/>
    <Wide><Button variant="contained" size="large" onClick={add} sx={{px:5,width:{xs:'100%',sm:'auto'}}}>Add investment</Button></Wide></FormGrid>
   <Typography variant="caption" color="text.secondary">Adding to an existing name tops up that holding.</Typography></Card>
  </Pane><Pane id="invest" name="Holdings"><Box sx={{display:'grid',gap:2,gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))'}}>{H.map(x=>{const s=sell[x.id]||{};return <Card key={x.id} sx={{p:2.5}}>
   <Box sx={{display:'flex',justifyContent:'space-between'}}><Clamp sx={{typography:'h6',flex:1,pr:1}}>{x.name}</Clamp><Typography color="text.secondary">{x.source}{+x.units>0?` · ${+x.units} units`:''}</Typography></Box>
   <Box sx={{display:'flex',justifyContent:'space-between',my:1.5}}><Box><Typography variant="caption" color="text.secondary">Invested</Typography><Typography fontWeight={700}>{rs(+x.cost)}</Typography></Box><Box><Typography variant="caption" color="text.secondary">Value</Typography><Typography fontWeight={700}>{rs(+x.value)}</Typography></Box><Box><Typography variant="caption" color="text.secondary">Unrealized</Typography><Typography fontWeight={700} color={col(x.value-x.cost)}>{rs(x.value-x.cost)}</Typography></Box></Box>
   <Stack direction="row" spacing={1} sx={{mb:1.5}}><TextField label="Current value ₹" type="number" value={val[x.id]??''} onChange={e=>setVal({...val,[x.id]:e.target.value})} sx={{flex:1}}/><Button variant="outlined" onClick={()=>upd(x)}>Update</Button></Stack>
   <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap"><TextField label="Sale proceeds ₹" type="number" value={s.proceeds??''} onChange={e=>setSell({...sell,[x.id]:{...s,proceeds:e.target.value}})} sx={{flex:1}}/>{+x.units>0&&<TextField label="Units to sell" type="number" value={s.units??''} onChange={e=>{const u=e.target.value;setSell({...sell,[x.id]:{...s,units:u,pct:u===''?'':String(+(Math.min(+u,+x.units)/+x.units*100).toFixed(2))}})}} sx={{width:120}}/>}<TextField label="% of holding" type="number" value={s.pct??''} onChange={e=>{const p=e.target.value;setSell({...sell,[x.id]:{...s,pct:p,units:p===''||!(+x.units>0)?s.units:String(+(+x.units*Math.min(+p,100)/100).toFixed(4))}})}} sx={{width:120}}/><Button size="small" onClick={()=>setSell({...sell,[x.id]:{...s,pct:'100',units:+x.units>0?String(+x.units):s.units}})}>All</Button><Button variant="contained" onClick={()=>doSell(x)}>Sell</Button></Stack></Card>})}</Box>
  </Pane><Pane id="invest" name="Profit & loss"><Box sx={{display:'grid',gap:3,gridTemplateColumns:{md:'1fr 1fr'}}}>
   <Card sx={{p:2.5}}><Typography variant="h6">Profit and loss by source</Typography><DataTable rows={by} rowKey="s" empty="Nothing yet." columns={[{label:'Source',render:x=>x.s},{label:'Unrealized',align:'right',render:x=><Typography color={col(x.u)}>{rs(x.u)}</Typography>},{label:'Realized',align:'right',render:x=><Typography color={col(x.r)}>{rs(x.r)}</Typography>}]}/></Card>
   <Card sx={{p:2.5}}><Typography variant="h6">Realized history</Typography><DataTable rows={pgT.slice} empty="No sales yet. When you sell, enter the proceeds and the profit or loss is logged here." columns={[
     {label:'Investment',render:x=>x.investments?.name||''},
     {label:'Source',render:x=>x.investments?.source||''},
     {label:'Sold on',render:x=>fday(x.date)},
     {label:'Proceeds',align:'right',render:x=>rs(+x.amount)},
     {label:'Profit / loss',align:'right',render:x=><Typography fontWeight={700} color={col(+x.pnl)}>{(+x.pnl>=0?'+':'')+rs(+x.pnl)}</Typography>}]}/><Pager pg={pgT}/></Card></Box></Pane></Stack>}
