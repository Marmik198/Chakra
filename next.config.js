const mobile=process.env.MOBILE==='1';
const withAnalyzer=process.env.ANALYZE==='true'?require('@next/bundle-analyzer')({enabled:true}):c=>c;
const cache=[{key:'Cache-Control',value:'public, max-age=2592000, stale-while-revalidate=86400'}];
module.exports=withAnalyzer({
 poweredByHeader:false,reactStrictMode:true,compress:true,devIndicators:{buildActivity:false},
 compiler:{removeConsole:{exclude:['error','warn']}},
 experimental:{optimizePackageImports:['@mui/material','@mui/icons-material','@mui/x-charts','@emotion/react']},
 ...(mobile?{output:'export',trailingSlash:true,images:{unoptimized:true}}:{async headers(){return[{source:'/:file(logo.svg|icon-192.png|icon-512.png|login-poster.jpg|login-bg.mp4)',headers:cache}]}})
});
