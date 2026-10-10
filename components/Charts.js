'use client';
import dynamic from 'next/dynamic';
import {Skeleton} from '@mui/material';
// The chart library is large. It loads only on screens that draw a chart, after the page is already visible.
const Loading=()=><Skeleton variant="rounded" height={200} sx={{my:1}}/>;
export const LineChart=dynamic(()=>import('@mui/x-charts/LineChart').then(m=>m.LineChart),{ssr:false,loading:Loading});
export const BarChart=dynamic(()=>import('@mui/x-charts/BarChart').then(m=>m.BarChart),{ssr:false,loading:Loading});
