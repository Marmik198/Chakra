export const PRI=[['low','Low','#94A3B8'],['medium','Medium','#3B82F6'],['high','High','#F59E0B'],['urgent','Urgent','#EF4467']];
export const DEF_COLS=[{name:'Backlog',color:'#94A3B8',is_done:false},{name:'To do',color:'#3B82F6',is_done:false},{name:'In progress',color:'#F59E0B',is_done:false},{name:'In review',color:'#8B5CF6',is_done:false},{name:'Done',color:'#22C55E',is_done:true}];
export const DEF_ENVS=[{name:'Dev',color:'#0EA5E9'},{name:'QA',color:'#F59E0B'},{name:'UAT',color:'#8B5CF6'},{name:'Production',color:'#EF4467'}];
// A position between two neighbours, so a card can be dropped anywhere without renumbering the column.
export const between=(a,b)=>a==null&&b==null?1000:a==null?b-1000:b==null?a+1000:(a+b)/2;
export const fmtD=d=>d?new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'';
export const isOverdue=(d,done)=>!!d&&!done&&d<new Date().toLocaleDateString('en-CA');