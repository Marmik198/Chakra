import {toast} from './toast';
// Ids waiting to be deleted. Reads hide them so a quick reload does not bring them back during the undo window.
export const pendingDel=new Set();
export function undoable(label,commit,{id,hide,restore}){
 hide();if(id)pendingDel.add(id);
 const t=setTimeout(async()=>{try{await commit()}finally{if(id)pendingDel.delete(id)}},6000);
 toast(`${label} deleted`,'info',{action:'Undo',ms:6000,onAction:()=>{clearTimeout(t);if(id)pendingDel.delete(id);restore()}});
}
