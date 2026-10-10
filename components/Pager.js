'use client';
import {useState,useEffect} from 'react';
import {Pagination,Stack,Typography} from '@mui/material';
export const PAGE=20;
// Splits a list into pages of 20. `needed` is false (so nothing shows) until there are more than 20 items.
export function usePaged(items,size=PAGE,resetKey){
 const [p,setP]=useState(1),pages=Math.max(1,Math.ceil(items.length/size));
 useEffect(()=>{if(p>pages)setP(pages)},[pages,p]);
 useEffect(()=>{setP(1)},[resetKey]);
 return{page:p,setPage:setP,pages,slice:items.slice((p-1)*size,p*size),total:items.length,needed:items.length>size,from:(p-1)*size+1,to:Math.min(p*size,items.length)};
}
export function Pager({pg}){
 if(!pg.needed)return null;
 return <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{pt:2}}>
  <Typography variant="body2" color="text.secondary">{pg.from} to {pg.to} of {pg.total}</Typography>
  <Pagination count={pg.pages} page={pg.page} onChange={(_,v)=>pg.setPage(v)} size="small" shape="rounded" siblingCount={0} boundaryCount={1}/></Stack>;
}
