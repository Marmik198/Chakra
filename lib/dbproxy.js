import {toast} from './toast';
import {pendingDel} from './undo';
const MUT=new Set(['insert','update','upsert','delete']);
// Wraps the Supabase client: shows errors, caches identical reads for 60s (cleared on any write), de-duplicates in-flight reads,
// reports loading to the top progress bar, and hides rows that are waiting to be deleted.
export function wrapClient(raw){
 const cache=new Map(),last={m:'',t:0};let pending=0,ver=0;
 const ping=()=>{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('chakra-load',{detail:pending}))};
 const fail=m=>{const n=Date.now();if(last.m===m&&n-last.t<4000)return;last.m=m;last.t=n;toast(/fetch|network/i.test(m)?'No connection. Check your internet and try again.':m,'error')};
 const clone=r=>r&&Array.isArray(r.data)?{...r,data:r.data.filter(x=>!(x&&x.id&&pendingDel.has(x.id)))}:r;
 function run(t,chain){
  const mut=chain.some(([m])=>MUT.has(m)),key=mut?null:JSON.stringify(chain);
  if(mut){ver++;cache.clear()}
  else if(cache.has(key)){const c=cache.get(key);if(Date.now()-c.t<60000)return c.p.then(clone);cache.delete(key)}
  const v0=ver;pending++;ping();
  const p=new Promise((ok,no)=>t.then(ok,no)).then(r=>{if(r&&r.error)fail(r.error.message||String(r.error));return r},e=>{fail(e?.message||'Something went wrong');return{data:null,error:e}}).finally(()=>{pending--;ping();if(mut){ver++;cache.clear()}});
  if(!mut){cache.set(key,{t:Date.now(),p});p.then(r=>{if(ver!==v0||(r&&r.error))cache.delete(key)})}
  return p.then(clone);
 }
 const wrap=(b,chain)=>new Proxy(b,{get(t,p){if(p==='then')return(res,rej)=>run(t,chain).then(res,rej);const v=t[p];return typeof v==='function'?(...a)=>wrap(v.apply(t,a),[...chain,[p,a]]):v}});
 return new Proxy(raw,{get(t,p){if(p==='from')return n=>wrap(raw.from(n),[['from',[n]]]);const v=t[p];return typeof v==='function'?v.bind(t):v}});
}
