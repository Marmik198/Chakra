export const iso=d=>d.toLocaleDateString('en-CA');
export const lastDays=n=>Array.from({length:n},(_,k)=>{const d=new Date();d.setDate(d.getDate()+k-n+1);return iso(d)});
export function isDue(t,date){
 const D=new Date(date+'T00:00'),S=new Date(t.start_date+'T00:00');if(D<S)return false;
 switch(t.cycle){
  case 'daily':return true;
  case 'once':return date===t.start_date;
  case 'interval':return Math.round((D-S)/864e5)%(t.interval_n||1)===0;
  case 'weekly':return (t.weekdays||[]).includes(D.getDay());
  case 'monthly':return D.getDate()===Math.min(t.month_day,new Date(D.getFullYear(),D.getMonth()+1,0).getDate());
  case 'yearly':return date.slice(5)===t.start_date.slice(5);
  default:return false}}
