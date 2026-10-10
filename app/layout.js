import {Manrope} from 'next/font/google';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v14-appRouter';
import Providers from './providers';
const f=Manrope({subsets:['latin'],variable:'--font-manrope'});
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:[{media:'(prefers-color-scheme: light)',color:'#F3F4F1'},{media:'(prefers-color-scheme: dark)',color:'#0C0E12'}]};
const THEME_JS="try{var m=localStorage.getItem('chakra-mode')||'system',d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-mode',d?'dark':'light');document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}";
const THEME_CSS='html[data-mode=dark],html[data-mode=dark] body{background:#0C0E12!important;color:#E9ECF1}html[data-mode=light],html[data-mode=light] body{background:#F3F4F1!important}';
export const metadata={title:'Chakra',description:'Your habits, health, money and goals in one place'};
export default function Root({children}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:THEME_JS}}/><style dangerouslySetInnerHTML={{__html:THEME_CSS}}/></head><body className={f.variable}><AppRouterCacheProvider><Providers>{children}</Providers></AppRouterCacheProvider></body></html>}
