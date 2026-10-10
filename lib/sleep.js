export const mins=t=>{const[h,m]=t.split(':');return +h*60+ +m};
export const dur=(b,w)=>{const d=mins(w)-mins(b);return d>0?d:d+1440};
export const hm=m=>`${Math.floor(m/60)}h ${String(Math.round(m%60)).padStart(2,'0')}m`;
export const clock=m=>{m=((Math.round(m)%1440)+1440)%1440;return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`};
const off=t=>(mins(t)-1080+1440)%1440;
export const avgTime=(l,k)=>l.length?clock(l.reduce((a,x)=>a+off(x[k]),0)/l.length+1080):'-';
export const spread=(l,k)=>{if(l.length<2)return 0;const v=l.map(x=>off(x[k])),m=v.reduce((a,b)=>a+b)/v.length;return Math.round(Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/v.length))};
export const winPos=(b,min)=>{const s=(mins(b)-1200+1440)%1440;return{top:s/9.6,h:Math.min(min,960-s)/9.6}};
