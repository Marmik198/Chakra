export const toast=(msg,sev='error',opt={})=>{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('chakra-toast',{detail:{msg,sev,...opt}}))};
