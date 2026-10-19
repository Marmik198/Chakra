const dn=s=>Math.round(Date.parse(s+'T00:00:00Z')/864e5),dt=n=>new Date(n*864e5).toISOString().slice(0,10);
// auto: {start:'YYYY-MM-DD'} is passed for clean streaks. A past day that was never marked counts as a clean day
// but is reported in `partial`, so it can be reviewed later and either confirmed or marked as a slip.
// Today is never partial: it is still in progress.
export function stats(days=[],today,auto){
 let all=days,partial=[];
 if(auto?.start){const have=new Set(days.map(d=>d.date)),add=[];for(let n=dn(auto.start);n<dn(today);n++){const d=dt(n);if(!have.has(d))add.push({date:d,status:'clean',count:1,auto:true})}partial=add.map(x=>x.date).reverse();all=[...days,...add]}
 const m=new Map(all.map(d=>[d.date,d])),clean=all.filter(d=>d.status==='clean').map(d=>dn(d.date)).sort((a,b)=>a-b);
 let best=0,run=0,prev=null;for(const n of clean){run=prev!==null&&n===prev+1?run+1:1;best=Math.max(best,run);prev=n}
 let cur=0,n=dn(today);const tdS=m.get(today)?.status;if(tdS==='slip')n=-1e9;else if(tdS!=='clean')n--;
 const byN=new Map(all.filter(d=>d.status==='clean').map(d=>[dn(d.date),1]));while(byN.get(n)){cur++;n--}
 const slips=all.filter(d=>d.status==='slip').sort((a,b)=>b.date.localeCompare(a.date));
 const total=all.filter(d=>d.status==='clean').reduce((a,d)=>a+(d.count||1),0);
 return{map:m,current:cur,best,clean:clean.length,total,slips,partial}}
