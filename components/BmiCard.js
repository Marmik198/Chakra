'use client';
import {useEffect,useState} from 'react';
import {Card,Typography,Stack,Box,TextField,Chip} from '@mui/material';
import {LineChart} from '@/components/Charts';
import {supabase} from '@/lib/supabase';
const cat=b=>b<18.5?['Underweight','info']:b<25?['Healthy','success']:b<30?['Overweight','warning']:['Obese','error'];
export default function BmiCard({refresh}){
 const [h,setH]=useState(''),[w,setW]=useState([]);
 useEffect(()=>{setH(localStorage.getItem('chakra-height')||'')},[]);
 useEffect(()=>{(async()=>{const{data}=await supabase.from('metrics').select('metric_entries(date,value)').eq('section','fitness').eq('name','Weight');setW([...(data?.[0]?.metric_entries||[])].sort((a,b)=>a.date.localeCompare(b.date)))})()},[refresh]);
 const m=(+h)/100,ok=m>0.5&&m<2.6,f=x=>+(x/(m*m)).toFixed(1),l=w[w.length-1],bmi=ok&&l?f(+l.value):null,c=bmi?cat(bmi):null;
 const lo=ok?18.5*m*m:0,hi=ok?24.9*m*m:0,diff=bmi&&+l.value>hi?`${(+l.value-hi).toFixed(1)} kg above`:bmi&&+l.value<lo?`${(lo-+l.value).toFixed(1)} kg below`:'within';
 return <Card sx={{p:2.5}}><Typography variant="h6" sx={{mb:2}}>Body and BMI</Typography>
  <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap" alignItems="center">
   <TextField label="Height (cm)" type="number" value={h} onChange={e=>{setH(e.target.value);localStorage.setItem('chakra-height',e.target.value)}} sx={{width:140}}/>
   {bmi?<><Box><Typography variant="caption" color="text.secondary">BMI</Typography><Stack direction="row" spacing={1} alignItems="center"><Typography variant="h4">{bmi}</Typography><Chip size="small" color={c[1]} label={c[0]}/></Stack></Box>
    <Box><Typography variant="caption" color="text.secondary">Weight now</Typography><Typography variant="h5">{+l.value} kg</Typography></Box>
    <Box><Typography variant="caption" color="text.secondary">Healthy range at your height</Typography><Typography fontWeight={700}>{lo.toFixed(1)} to {hi.toFixed(1)} kg</Typography><Typography variant="body2" color="text.secondary">You are {diff} the range</Typography></Box></>
   :<Typography color="text.secondary">Enter your height and log your weight under Body measurements below.</Typography>}</Stack>
  {ok&&w.length>1&&<LineChart height={180} margin={{left:40,right:10,top:10,bottom:20}} xAxis={[{scaleType:'time',data:w.map(x=>new Date(x.date+'T00:00')),valueFormatter:d=>d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}]} series={[{data:w.map(x=>f(+x.value)),area:true,color:'#14A38B',label:'BMI'}]}/>}</Card>}
