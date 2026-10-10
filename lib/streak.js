const dn=s=>Math.round(Date.parse(s+'T00:00:00Z')/864e5);
export function stats(days=[],today){
 const m=new Map(days.map(d=>[d.date,d])),clean=days.filter(d=>d.status==='clean').map(d=>dn(d.date)).sort((a,b)=>a-b);
 let best=0,run=0,prev=null;for(const n of clean){run=prev!==null&&n===prev+1?run+1:1;best=Math.max(best,run);prev=n}
 let cur=0,n=dn(today);if(m.get(today)?.status!=='clean')n--;
 const byN=new Map(days.filter(d=>d.status==='clean').map(d=>[dn(d.date),1]));while(byN.get(n)){cur++;n--}
 const slips=days.filter(d=>d.status==='slip').sort((a,b)=>b.date.localeCompare(a.date));
 const total=days.filter(d=>d.status==='clean').reduce((a,d)=>a+(d.count||1),0);
 return{map:m,current:cur,best,clean:clean.length,total,slips}}
