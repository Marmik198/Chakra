'use client';
import {useEffect,useRef,useState,useCallback,useMemo} from 'react';
import {Card,Typography,Stack,Box,TextField,Button,Select,MenuItem,ToggleButton,ToggleButtonGroup,List,ListItem,ListItemText,IconButton,Paper,Tooltip,Chip} from '@mui/material';
import {BarChart} from '@/components/Charts';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import {TabBar,Pane} from '@/components/Tabs';
import {Donut} from '@/components/Donut';
import {SOURCES,bySource} from '@/lib/reportCore';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import {usePaged,Pager} from '@/components/Pager';
import Clamp from '@/components/Clamp';
import EditDialog from '@/components/EditDialog';
import EditRounded from '@mui/icons-material/EditRounded';
import DataTable from '@/components/DataTable';
import LogFilters,{applyLog,NO_FILTER} from '@/components/LogFilters';
import {alpha} from '@mui/material/styles';
import {Dialog,DialogTitle,DialogContent} from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ColorField from '@/components/ColorField';
const fday=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});
import {supabase} from '@/lib/supabase';
import {undoable} from '@/lib/undo';
import {iso,lastDays} from '@/lib/due';
const rs=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const DEF=[["Food & Dining", "expense", "#F97316", "Restaurants, cafes, takeaway and delivery."], ["Groceries", "expense", "#22C55E", "Supermarket and everyday household food."], ["Transport", "expense", "#3B82F6", "Fuel, cabs, metro, bus and parking."], ["Bills & Utilities", "expense", "#EAB308", "Electricity, water, phone, internet and gas."], ["Rent & Home", "expense", "#8B5CF6", "Rent, maintenance and home repairs."], ["Shopping", "expense", "#EC4899", "Clothes, gadgets and other purchases."], ["Health", "expense", "#EF4467", "Doctor, medicines, tests and insurance."], ["Entertainment", "expense", "#A78BFA", "Movies, games, events and outings."], ["Travel", "expense", "#06B6D4", "Trips, stays and tickets."], ["Education", "expense", "#0EA5E9", "Courses, books and fees."], ["Subscriptions", "expense", "#6366F1", "Apps, streaming and memberships."], ["Gifts & Donations", "expense", "#F472B6", "Presents and charity."], ["Split", "expense", "#14B8A6", "Money you paid for others and will get back."], ["Split paid", "expense", "#0F9F8F", "Your share paid back to a friend."], ["Investment loss", "expense", "#EF4467", "Losses from selling investments."], ["Other", "expense", "#94A3B8", "Anything that does not fit elsewhere."], ["Salary", "income", "#22C55E", "Your regular pay."], ["Freelance", "income", "#3B82F6", "Side work and one-off projects."], ["Investment returns", "income", "#6366F1", "Dividends, interest and profits."], ["Gifts", "income", "#EC4899", "Money received as a gift."], ["Refund", "income", "#F59E0B", "Refunds and reimbursements."], ["Split received", "income", "#14B8A6", "A friend paying you back."], ["Other", "income", "#94A3B8", "Any other income."]];
const LEGACY={Food:'Food & Dining',Bills:'Bills & Utilities',Fun:'Entertainment'};
const fdl=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
const Dot=({c})=><Box component="span" sx={{display:'inline-block',width:10,height:10,borderRadius:'50%',bgcolor:c,mr:1,flexShrink:0}}/>;
const Stat=({l,v,c})=><Card sx={{p:2.5}}><Typography variant="body2" color="text.secondary">{l}</Typography><Typography variant="h5" sx={{color:c}}>{v}</Typography></Card>;
export default function Money(){
 const seeded=useRef(false),thisMonth=iso(new Date()).slice(0,7),[month,setMonth]=useState(thisMonth),[yy,mm]=month.split('-').map(Number),nDays=new Date(yy,mm,0).getDate(),mStart=`${month}-01`,mEnd=`${month}-${String(nDays).padStart(2,'0')}`,D=useMemo(()=>Array.from({length:nDays},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`),[month,nDays]),mLabel=new Date(yy,mm-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'}),shift=n=>{const d=new Date(yy,mm-1+n,1);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)};
 const [rows,setRows]=useState([]),[splits,setSplits]=useState([]),[tags,setTags]=useState([]),[dv,setDv]=useState('Expense'),[f,setF]=useState({type:'Expense',tag:'Food & Dining',amount:'',note:'',date:iso(new Date()),source:'UPI'}),[s,setS]=useState({who:'',amount:'',direction:'owes me',note:''}),[nt,setNt]=useState({name:'',kind:'expense',color:'#6A4DF4',description:''});
 const srcData=useMemo(()=>bySource(rows,dv),[rows,dv]);
 const [editE,setEditE]=useState(null),[editS,setEditS]=useState(null),[tagView,setTagView]=useState(null),[lf,setLf]=useState(NO_FILTER);
 // one row per tag or source: dot, name, share, amount and a bar showing its share
 const shares=(list,tip,pick)=>list.map(d=>{const pc=total?d.value/total*100:0;const row=<Box key={d.name} {...(pick?{role:'button',tabIndex:0,'aria-label':`${d.name}, show entries`,onClick:()=>pick(d.name),onKeyDown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(d.name)}},sx:{cursor:'pointer',borderRadius:1,'&:hover':{bgcolor:'action.hover'}}}:{})}><Box sx={{display:'flex',alignItems:'center'}}><Dot c={d.color}/><Clamp sx={{flex:1}}>{d.name}</Clamp><Typography variant="body2" color="text.secondary" sx={{mr:1.5}}>{pc.toFixed(0)}%</Typography><Typography fontWeight={700}>{rs(d.value)}</Typography></Box><Box sx={{height:6,borderRadius:3,bgcolor:'divider',mt:.75}}><Box sx={{height:'100%',width:`${pc}%`,borderRadius:3,bgcolor:d.color}}/></Box></Box>;return tip?<Tooltip key={d.name} title={d.description} placement="left">{row}</Tooltip>:row});
 const loadTags=useCallback(async()=>{let{data}=await supabase.from('money_tags').select('*').order('created_at',{ascending:true,nullsFirst:true});
  if(!data?.length&&!seeded.current){seeded.current=true;await supabase.from('money_tags').upsert(DEF.map(([name,kind,color,description])=>({name,kind,color,description})),{onConflict:'user_id,name,kind',ignoreDuplicates:true});({data}=await supabase.from('money_tags').select('*'))}
  setTags(data||[])},[]);
 const load=useCallback(async()=>{const[a,b]=await Promise.all([supabase.from('money_entries').select('*').gte('date',mStart).lte('date',mEnd).order('date',{ascending:false}),supabase.from('splits').select('*')]);setRows(a.data||[]);setSplits(b.data||[])},[mStart,mEnd]);
 useEffect(()=>{load();loadTags()},[load,loadTags]);
 const today=()=>iso(new Date()),tagOf=(type,name)=>{const n=LEGACY[name]||name;return tags.find(t=>t.kind===type.toLowerCase()&&t.name===n)};
 const ofKind=k=>tags.filter(t=>t.kind===k.toLowerCase());
 const add=async()=>{const a=+f.amount;if(!(a>0))return;await supabase.from('money_entries').insert({date:f.date||today(),type:f.type,category:f.tag,amount:a,note:f.note,source:f.source});setF({...f,amount:'',note:''});load()};
 const del=x=>undoable('Entry',()=>supabase.from('money_entries').delete().eq('id',x.id),{id:x.id,hide:()=>setRows(r=>r.filter(y=>y.id!==x.id)),restore:load});
 const addTag=async()=>{const n=nt.name.trim();if(!n)return;await supabase.from('money_tags').upsert({name:n,kind:nt.kind,color:nt.color,description:nt.description},{onConflict:'user_id,name,kind'});setNt({...nt,name:'',description:''});loadTags()};
 const delTag=t=>undoable(`Tag "${t.name}"`,()=>supabase.from('money_tags').delete().eq('id',t.id),{id:t.id,hide:()=>setTags(r=>r.filter(y=>y.id!==t.id)),restore:loadTags});
 const addSplit=async()=>{const a=+s.amount,w=s.who.trim();if(!w||!(a>0))return;await supabase.from('splits').insert({who:w,amount:a,direction:s.direction,note:s.note});
  if(s.direction==='owes me')await supabase.from('money_entries').insert({date:today(),type:'Expense',category:'Split',amount:a,note:`Split with ${w}${s.note?': '+s.note:''}`});setS({...s,who:'',amount:'',note:''});load()};
 const settle=async x=>{const own=x.direction==='owes me';await supabase.from('money_entries').insert({date:today(),type:own?'Income':'Expense',category:own?'Split received':'Split paid',amount:+x.amount,note:x.who+(x.note?': '+x.note:'')});await supabase.from('splits').delete().eq('id',x.id);load()};
 const tagNameE=x=>tagOf(x.type,x.category)?.name||x.category||'Untagged',shownE=applyLog(rows,lf,tagNameE),pgE=usePaged(shownE,20,`${month}|${lf.q}|${lf.type}|${lf.tag}|${lf.source}|${lf.min}|${lf.max}|${lf.sort}`),sum=t=>rows.filter(x=>x.type===t).reduce((a,x)=>a+ +x.amount,0),earned=sum('Income'),spent=sum('Expense'),owed=splits.reduce((a,x)=>a+(x.direction==='owes me'?1:-1)*x.amount,0);
 const grp={};rows.filter(x=>x.type===dv).forEach(x=>{const t=tagOf(x.type,x.category),n=t?t.name:(x.category||'Untagged');grp[n]=(grp[n]||0)+ +x.amount});
 const data=Object.entries(grp).sort((a,b)=>b[1]-a[1]).map(([name,value])=>{const t=tagOf(dv,name);return{name,value,color:t?.color||'#94A3B8',description:t?.description||'No description yet.'}}),total=data.reduce((a,d)=>a+d.value,0);
 const daily=D.map(d=>rows.filter(x=>x.date===d&&x.type==='Expense').reduce((a,x)=>a+ +x.amount,0));
 return <Stack spacing={3}>
  <Box><Typography variant="h4">Money</Typography><Typography color="text.secondary">Income and spending for the month you pick. Use Reports for any date range.</Typography></Box>
  <Box sx={{display:'flex',alignItems:'center',gap:1,flexWrap:'wrap'}}><IconButton aria-label="Previous month" onClick={()=>shift(-1)}><ChevronLeftRounded/></IconButton><Typography variant="h6" sx={{minWidth:160,textAlign:'center'}}>{mLabel}</Typography><IconButton aria-label="Next month" onClick={()=>shift(1)} disabled={month>=thisMonth}><ChevronRightRounded/></IconButton><Button size="small" onClick={()=>setMonth(thisMonth)} disabled={month===thisMonth}>This month</Button></Box>
<TabBar id="money" tabs={["Overview", "Graphs", "Tags", "Splits"]}/>
<Pane id="money" name="Overview"><Box sx={{display:'grid',gap:2,gridTemplateColumns:{xs:'1fr 1fr',md:'repeat(4,1fr)'}}}><Stat l="Earned" v={rs(earned)} c="success.main"/><Stat l="Spent" v={rs(spent)} c="error.main"/><Stat l="Left over" v={rs(earned-spent)}/><Stat l={owed>=0?'You are owed':'You owe'} v={rs(Math.abs(owed))} c="secondary.main"/></Box>
  <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:2}}>Add an entry</Typography>
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center">
    <ToggleButtonGroup exclusive size="small" value={f.type} onChange={(_,v)=>v&&setF({...f,type:v,tag:(ofKind(v)[0]||{}).name||''})}><ToggleButton value="Expense">Expense</ToggleButton><ToggleButton value="Income">Income</ToggleButton></ToggleButtonGroup>
    <Select value={ofKind(f.type).some(t=>t.name===f.tag)?f.tag:''} displayEmpty onChange={e=>setF({...f,tag:e.target.value})} sx={{minWidth:190}} renderValue={v=>v?<Box sx={{display:'flex',alignItems:'center'}}><Dot c={tagOf(f.type,v)?.color}/>{v}</Box>:'Choose a tag'}>{ofKind(f.type).map(t=><MenuItem key={t.id} value={t.name}><Dot c={t.color}/>{t.name}</MenuItem>)}</Select>
    <TextField select label="Source" value={f.source} onChange={e=>setF({...f,source:e.target.value})} sx={{width:170}}>{SOURCES.map(x=><MenuItem key={x[0]} value={x[0]}>{x[1]}</MenuItem>)}</TextField>
    <TextField label="Date" type="date" InputLabelProps={{shrink:true}} value={f.date} onChange={e=>setF({...f,date:e.target.value})} sx={{width:160}}/>
    <TextField label="Amount ₹" type="number" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} sx={{width:130}}/>
    <TextField label="Note" value={f.note} onChange={e=>setF({...f,note:e.target.value})} onKeyDown={e=>e.key==='Enter'&&add()} sx={{flex:1,minWidth:160}}/>
    <Button variant="contained" disabled={!f.tag} onClick={add}>Add</Button></Stack></Card>
  </Pane><Pane id="money" name="Graphs"><Stack spacing={3}>
   <Card sx={{p:{xs:2.5,md:3.5}}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:1,mb:2.5}}><Typography variant="h6">By tag</Typography><ToggleButtonGroup exclusive size="small" value={dv} onChange={(_,v)=>v&&setDv(v)}><ToggleButton value="Expense">Spent</ToggleButton><ToggleButton value="Income">Earned</ToggleButton></ToggleButtonGroup></Box>
    <Box sx={{display:'grid',gap:{xs:3,md:6},gridTemplateColumns:{xs:'1fr',md:'minmax(280px,380px) 1fr'},alignItems:'center'}}>
     <Donut data={data} total={total} label={dv==='Expense'?'Spent':'Earned'} max={380} onSelect={d=>setTagView(d.name)}/>
     <Stack spacing={2} sx={{maxHeight:{md:400},overflowY:'auto',pr:1}}>{shares(data,true,setTagView)}</Stack></Box></Card>
   <Box sx={{display:'grid',gap:3,gridTemplateColumns:{md:'1fr 1fr'}}}>
    <Card sx={{p:{xs:2.5,md:3.5}}}><Typography variant="h6">Daily spending</Typography><Typography variant="caption" color="text.secondary">{mLabel}</Typography>
     <BarChart height={340} xAxis={[{scaleType:'band',data:D,valueFormatter:(d,c)=>c.location==='tick'?d.slice(8):fdl(d)}]} series={[{data:daily,color:'#14A38B',label:'Spent',valueFormatter:v=>rs(v)}]} slotProps={{legend:{hidden:true}}}/></Card>
    <Card sx={{p:{xs:2.5,md:3.5}}}><Typography variant="h6" sx={{mb:2.5}}>By source</Typography>
     <Box sx={{display:'grid',gap:3,gridTemplateColumns:{xs:'1fr',sm:'minmax(150px,220px) 1fr'},alignItems:'center'}}><Donut data={srcData} total={total} label={dv==='Expense'?'Spent':'Earned'} max={220}/><Stack spacing={2}>{shares(srcData,false)}</Stack></Box></Card></Box></Stack>
  </Pane><Pane id="money" name="Tags"><Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:1}}>Tags</Typography><Typography variant="body2" color="text.secondary" sx={{mb:2}}>Every entry gets one tag. Add your own with a colour and a short description. The description appears in the chart tooltip.</Typography>
   {['expense','income'].map(k=><Box key={k} sx={{mb:2}}><Typography variant="subtitle2" sx={{mb:.5,textTransform:'capitalize'}}>{k}</Typography><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{ofKind(k).map(t=><Tooltip key={t.id} title={t.description||''}><Chip label={t.name} onDelete={()=>delTag(t)} deleteIcon={<CloseRounded/>} sx={{bgcolor:`${t.color}26`,color:'text.primary','& .MuiChip-label':{pl:1.5},'&::before':{content:'""',width:10,height:10,borderRadius:'50%',bgcolor:t.color,ml:1.25}}}/></Tooltip>)}</Stack></Box>)}
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" alignItems="center" sx={{mt:1}}>
    <TextField label="New tag name" value={nt.name} onChange={e=>setNt({...nt,name:e.target.value})} sx={{minWidth:160}}/>
    <Select value={nt.kind} onChange={e=>setNt({...nt,kind:e.target.value})}><MenuItem value="expense">Expense</MenuItem><MenuItem value="income">Income</MenuItem></Select>
    <ColorField label="Tag colour" value={nt.color} onChange={c=>setNt({...nt,color:c})}/>
    <TextField label="What is this tag for?" value={nt.description} onChange={e=>setNt({...nt,description:e.target.value})} sx={{flex:1,minWidth:200}}/>
    <Button variant="contained" onClick={addTag}>Add tag</Button></Stack></Card>
  </Pane><Pane id="money" name="Overview"><Card sx={{p:2.5}}><Typography variant="h6">Entries · {mLabel}</Typography>
   <LogFilters f={lf} setF={setLf} rows={rows} tagName={tagNameE} shown={shownE.length}/>
   <DataTable rows={pgE.slice} empty={rows.length?'No entries match these filters.':'No entries this month.'} actionsWidth={96} actions={x=><Stack direction="row" spacing={.5}><IconButton size="small" aria-label="Edit" onClick={()=>setEditE(x)}><EditRounded fontSize="small"/></IconButton><IconButton size="small" aria-label="Delete" onClick={()=>del(x)}><DeleteRounded fontSize="small"/></IconButton></Stack>} columns={[
     {label:'Date',render:x=>fday(x.date)},
     {label:'Tag',render:x=>{const t=tagOf(x.type,x.category);return <Tooltip title={t?t.name:x.category||''}><Chip size="small" label={t?t.name:x.category||'Untagged'} sx={{maxWidth:'100%',bgcolor:`${t?.color||'#94A3B8'}33`,fontWeight:600}}/></Tooltip>}},
     {label:'Source',render:x=>SOURCES.find(z=>z[0]===x.source)?.[1]||x.source||'–'},
     {label:'Note',render:x=>x.note||'–'},
     {label:'Amount',align:'right',render:x=><Typography fontWeight={700} color={x.type==='Income'?'success.main':'error.main'}>{x.type==='Income'?'+':'−'}{rs(+x.amount)}</Typography>}]}/><Pager pg={pgE}/></Card>
  </Pane><Pane id="money" name="Splits"><Card sx={{p:2.5}}><Typography variant="h6">Split tracker</Typography>
   <Typography variant="body2" color="text.secondary" sx={{mb:1}}>Paying for someone is logged as an expense. When they pay you back, it is logged as income.</Typography>
   <DataTable rows={splits} empty="Nothing to settle." actionsWidth={170} actions={x=><Stack direction="row" spacing={.5} alignItems="center"><IconButton size="small" aria-label="Edit" onClick={()=>setEditS(x)}><EditRounded fontSize="small"/></IconButton><Button size="small" variant="outlined" onClick={()=>settle(x)}>{x.direction==='owes me'?'Received':'I paid'}</Button></Stack>} columns={[
     {label:'Person',render:x=>x.who},
     {label:'Who owes',render:x=>x.direction==='owes me'?'They owe you':'You owe them'},
     {label:'Amount',align:'right',render:x=>rs(+x.amount)},
     {label:'Note',render:x=>x.note||'–'}]}/>
   <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{mt:1}}>
    <TextField label="Person" value={s.who} onChange={e=>setS({...s,who:e.target.value})}/>
    <Select value={s.direction} onChange={e=>setS({...s,direction:e.target.value})}><MenuItem value="owes me">I paid, they owe me</MenuItem><MenuItem value="I owe">I owe them</MenuItem></Select>
    <TextField label="₹" type="number" value={s.amount} onChange={e=>setS({...s,amount:e.target.value})} sx={{width:110}}/>
    <TextField label="For what" value={s.note} onChange={e=>setS({...s,note:e.target.value})} sx={{flex:1,minWidth:140}}/>
    <Button variant="contained" onClick={addSplit}>Add</Button></Stack></Card>
 </Pane><EditDialog open={!!editE} title="Edit entry" initial={editE&&{type:editE.type,category:editE.category,amount:editE.amount,date:editE.date,source:editE.source||'UPI',note:editE.note||''}}
   fields={[{key:'type',label:'Type',type:'select',options:[['Expense','Expense'],['Income','Income']]},
    {key:'category',label:'Tag',type:'select',options:v=>{const l=tags.filter(t=>t.kind===String(v.type).toLowerCase()).map(t=>[t.name,t.name]);return !v.category||l.some(o=>o[0]===v.category)?l:[[v.category,v.category],...l]}},
    {key:'amount',label:'Amount (₹)',type:'number',required:true},{key:'date',label:'Date',type:'date',required:true},
    {key:'source',label:'Source',type:'select',options:SOURCES.map(z=>[z[0],z[1]])},{key:'note',label:'Note',type:'multiline'}]}
   adjust={(k,val,v)=>k==='type'?{...v,type:val,category:tags.find(t=>t.kind===String(val).toLowerCase())?.name||''}:v}
   onSave={async v=>{const a=+v.amount;if(!(a>0))throw new Error('Enter an amount above 0.');const r=await supabase.from('money_entries').update({type:v.type,category:v.category,amount:a,date:v.date,source:v.source,note:v.note||null}).eq('id',editE.id);if(r?.error)throw new Error('Could not save. Try again.');setEditE(null);load()}} onClose={()=>setEditE(null)}/>
  <EditDialog open={!!editS} title="Edit split" initial={editS&&{who:editS.who,direction:editS.direction,amount:editS.amount,note:editS.note||''}}
   fields={[{key:'who',label:'Person',required:true},{key:'direction',label:'Who owes',type:'select',options:[['owes me','I paid, they owe me'],['I owe','I owe them']]},{key:'amount',label:'Amount (₹)',type:'number',required:true},{key:'note',label:'Note',type:'multiline'}]}
   onSave={async v=>{const a=+v.amount;if(!(a>0))throw new Error('Enter an amount above 0.');const r=await supabase.from('splits').update({who:v.who.trim(),direction:v.direction,amount:a,note:v.note||null}).eq('id',editS.id);if(r?.error)throw new Error('Could not save. Try again.');setEditS(null);load()}} onClose={()=>setEditS(null)}/>
 {(()=>{const tv=tagView,list=tv?rows.filter(x=>x.type===dv&&(tagOf(x.type,x.category)?.name||x.category||'Untagged')===tv).sort((a,b)=>b.date.localeCompare(a.date)||b.amount-a.amount):[],sumT=list.reduce((a,x)=>a+ +x.amount,0),colr=tv?(data.find(d=>d.name===tv)?.color||'#94A3B8'):'#94A3B8',word=dv==='Expense'?(list.length===1?'expense':'expenses'):(list.length===1?'entry':'entries');
  return <Dialog open={!!tv} onClose={()=>setTagView(null)} fullWidth maxWidth="sm" slotProps={{backdrop:{sx:{backgroundColor:'rgba(6,8,12,.5)',backdropFilter:'blur(6px)'}}}}
   PaperProps={{sx:{bgcolor:t=>alpha(t.palette.background.paper,.68),backdropFilter:'blur(22px) saturate(150%)',backgroundImage:'none',border:'1px solid',borderColor:'divider',borderRadius:4}}}>
   <DialogTitle sx={{pb:1}}><Box sx={{display:'flex',alignItems:'flex-start',gap:1}}><Box sx={{flex:1,minWidth:0}}><Box sx={{display:'flex',alignItems:'center'}}><Dot c={colr}/><Clamp sx={{typography:'h6'}}>{tv||''}</Clamp></Box><Typography variant="body2" color="text.secondary" sx={{mt:.5}}>{mLabel} · {list.length} {word} · {rs(sumT)}</Typography></Box><IconButton aria-label="Close" onClick={()=>setTagView(null)} sx={{mt:-.5,mr:-1}}><CloseRounded/></IconButton></Box></DialogTitle>
   <DialogContent sx={{pt:1}}><DataTable rows={list} maxHeight="55vh" minColWidth={90} empty="No entries." headerSx={{bgcolor:t=>alpha(t.palette.background.paper,.8),backdropFilter:'blur(12px)'}}
    columns={[{label:'Date',render:x=>fday(x.date)},{label:'Note',render:x=>x.note||'–'},{label:dv==='Expense'?'Expense':'Income',align:'right',render:x=><Typography fontWeight={700}>{rs(+x.amount)}</Typography>}]}/></DialogContent></Dialog>})()}
 </Stack>}
