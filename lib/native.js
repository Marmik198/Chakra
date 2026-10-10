import {Capacitor} from '@capacitor/core';
import {supabase} from './supabase';
import {isDue,iso} from './due';
export const isNative=()=>typeof window!=='undefined'&&Capacitor.isNativePlatform();
const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)%2147483000+1};
let timer;
export function rescheduleSoon(){if(!isNative())return;clearTimeout(timer);timer=setTimeout(scheduleReminders,800)}
// Schedules the next 3 weeks of reminders on the phone itself. They fire even when the app is closed.
export async function scheduleReminders(){
 if(!isNative())return;
 const{LocalNotifications:L}=await import('@capacitor/local-notifications');
 let p=await L.checkPermissions();if(p.display!=='granted')p=await L.requestPermissions();if(p.display!=='granted')return;
 const now=new Date(),T=iso(now);
 const[a,b]=await Promise.all([supabase.from('tasks').select('*').eq('remind',true).neq('cycle','todo'),supabase.from('task_log').select('task_id').eq('date',T)]);
 const done=new Set((b.data||[]).map(r=>r.task_id)),items=[];
 for(let k=0;k<21;k++){const d=new Date(now);d.setDate(d.getDate()+k);const ds=iso(d);
  for(const t of a.data||[]){if(!t.remind_time||!isDue(t,ds)||(k===0&&done.has(t.id)))continue;const[h,m]=t.remind_time.split(':'),at=new Date(d);at.setHours(+h,+m,0,0);if(at<=now)continue;
   items.push({id:hash(t.id+ds),title:t.title,body:'Time for your task',schedule:{at,allowWhileIdle:true},extra:{taskId:t.id,date:ds}})}}
 items.sort((x,y)=>x.schedule.at-y.schedule.at);
 const pend=await L.getPending();if(pend.notifications.length)await L.cancel({notifications:pend.notifications.map(n=>({id:n.id}))});
 if(items.length)await L.schedule({notifications:items.slice(0,60)});
}
