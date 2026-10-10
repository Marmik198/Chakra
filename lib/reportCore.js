export const LEGACY={Food:'Food & Dining',Bills:'Bills & Utilities',Fun:'Entertainment'};
export const fmtN=n=>Math.round(n).toLocaleString('en-IN');
export const isoD=d=>d.toLocaleDateString('en-CA');
export function tagInfo(tags,type,name){const n=LEGACY[name]||name,t=tags.find(x=>x.kind===String(type).toLowerCase()&&x.name===n);return{name:t?t.name:(name||'Untagged'),color:t?.color||'#94A3B8',description:t?.description||''}}
export function summarize(entries,tags){
 const o={earned:0,spent:0,byTag:{Expense:{},Income:{}},count:{Expense:0,Income:0}};
 entries.forEach(e=>{const a=+e.amount,t=tagInfo(tags,e.type,e.category),k=e.type==='Income'?'Income':'Expense';if(k==='Income')o.earned+=a;else o.spent+=a;const g=o.byTag[k][t.name]||(o.byTag[k][t.name]={name:t.name,value:0,color:t.color,description:t.description,count:0});g.value+=a;g.count++;o.count[k]++});
 o.net=o.earned-o.spent;o.rate=o.earned?Math.round(o.net/o.earned*100):0;
 o.listExpense=Object.values(o.byTag.Expense).sort((a,b)=>b.value-a.value);o.listIncome=Object.values(o.byTag.Income).sort((a,b)=>b.value-a.value);return o}
// Groups into days (<=31 days), weeks (<=120 days) or months, so charts stay readable for any range.
export function buckets(entries,from,to){
 const A=new Date(from+'T00:00'),B=new Date(to+'T00:00'),days=Math.round((B-A)/864e5)+1,mode=days<=31?'day':days<=120?'week':'month',M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],list=[],idx={};
 const keyOf=d=>{if(mode==='day')return d;if(mode==='month')return d.slice(0,7);const w=Math.floor((new Date(d+'T00:00')-A)/864e5/7),s=new Date(A);s.setDate(s.getDate()+w*7);return isoD(s)};
 const lab=k=>mode==='day'?String(+k.slice(8)):mode==='month'?M[+k.slice(5,7)-1]+" '"+k.slice(2,4):String(+k.slice(8))+' '+M[+k.slice(5,7)-1];
 for(let d=new Date(A);d<=B;d.setDate(d.getDate()+(mode==='day'?1:1))){const k=keyOf(isoD(d));if(!(k in idx)){idx[k]=list.length;list.push({key:k,label:lab(k),income:0,expense:0})}}
 entries.forEach(e=>{const k=keyOf(e.date);if(k in idx)list[idx[k]][e.type==='Income'?'income':'expense']+=+e.amount});return{mode,list}}
export function buildPdf(jsPDF,autoTable,{from,to,entries,tags}){
 const doc=new jsPDF({unit:'pt',format:'a4'}),W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=40,S=summarize(entries,tags),rs=n=>'Rs '+fmtN(n);
 const rgb=h=>{const v=h.replace('#','');return[parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)]};
 const fd=d=>new Date(d+'T00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
 doc.setFillColor(20,24,31);doc.rect(0,0,W,86,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text('Income & Expense Report',M,44);
 doc.setFont('helvetica','normal');doc.setFontSize(10.5);doc.text(fd(from)+' to '+fd(to),M,64);doc.text('Chakra',W-M,44,{align:'right'});doc.text('Generated '+fd(isoD(new Date())),W-M,64,{align:'right'});
 const bw=(W-2*M-30)/4,box=(i,l,v,c)=>{const x=M+i*(bw+10);doc.setFillColor(244,245,243);doc.roundedRect(x,104,bw,58,6,6,'F');doc.setTextColor(95,103,114);doc.setFontSize(8.5);doc.text(l,x+10,122);doc.setTextColor(c[0],c[1],c[2]);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(v,x+10,146);doc.setFont('helvetica','normal')};
 box(0,'EARNED',rs(S.earned),[15,159,143]);box(1,'SPENT',rs(S.spent),[224,71,91]);box(2,'NET',(S.net<0?'-':'')+rs(Math.abs(S.net)),S.net<0?[224,71,91]:[20,24,31]);box(3,'SAVINGS RATE',S.rate+'%',[20,24,31]);
 const donut=(cx,cy,R,r,data,total)=>{let a=-Math.PI/2;data.forEach(d=>{const f=d.value/total,a1=a+f*2*Math.PI,n=Math.max(3,Math.ceil(f*72)),pts=[];for(let i=0;i<=n;i++){const t=a+(a1-a)*i/n;pts.push([cx+R*Math.cos(t),cy+R*Math.sin(t)])}for(let i=n;i>=0;i--){const t=a+(a1-a)*i/n;pts.push([cx+r*Math.cos(t),cy+r*Math.sin(t)])}const c=rgb(d.color);doc.setFillColor(c[0],c[1],c[2]);doc.lines(pts.slice(1).map((p,i)=>[p[0]-pts[i][0],p[1]-pts[i][1]]),pts[0][0],pts[0][1],[1,1],'F',true);a=a1})};
 const pie=(title,list,total,y0)=>{doc.setTextColor(20,24,31);doc.setFont('helvetica','bold');doc.setFontSize(12.5);doc.text(title,M,y0);doc.setFont('helvetica','normal');
  if(!total){doc.setFontSize(10);doc.setTextColor(95,103,114);doc.text('No entries in this period.',M,y0+22);return}
  const top=list.slice(0,8),rest=list.slice(8).reduce((a,b)=>a+b.value,0),data=rest?[...top,{name:'Others',value:rest,color:'#94A3B8'}]:top,cx=M+66,cy=y0+84;donut(cx,cy,60,36,data,total);
  doc.setTextColor(20,24,31);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(rs(total),cx,cy+3,{align:'center'});doc.setFont('helvetica','normal');
  data.forEach((d,i)=>{const yy=y0+24+i*15,c=rgb(d.color);doc.setFillColor(c[0],c[1],c[2]);doc.roundedRect(M+150,yy-7,8,8,1.5,1.5,'F');doc.setTextColor(20,24,31);doc.setFontSize(9.5);doc.text(String(d.name).slice(0,28),M+166,yy);doc.setTextColor(95,103,114);doc.text(rs(d.value)+'   '+Math.round(d.value/total*100)+'%',W-M,yy,{align:'right'})})};
 pie('Spending by tag',S.listExpense,S.spent,194);pie('Income by tag',S.listIncome,S.earned,358);
 const B=buckets(entries,from,to),y1=530,hh=130,x0=M+34,cw=W-M-x0;doc.setTextColor(20,24,31);doc.setFont('helvetica','bold');doc.setFontSize(12.5);doc.text('Income vs spending by '+B.mode,M,y1-8);doc.setFont('helvetica','normal');
 const mx=Math.max(1,...B.list.map(b=>Math.max(b.income,b.expense)));doc.setFontSize(7.5);doc.setDrawColor(225,227,224);doc.setLineWidth(.5);
 for(let i=0;i<=4;i++){const yy=y1+hh-hh*i/4;doc.line(x0,yy,W-M,yy);doc.setTextColor(95,103,114);doc.text(fmtN(mx*i/4),x0-4,yy+2.5,{align:'right'})}
 const gw=cw/B.list.length,bwid=Math.min(14,gw*.38),step=Math.ceil(B.list.length/16);
 B.list.forEach((b,i)=>{const gx=x0+i*gw+gw/2;[['income',[15,159,143],-bwid],['expense',[224,71,91],0]].forEach(([k,c,off])=>{const h=b[k]/mx*hh;if(h>0){doc.setFillColor(c[0],c[1],c[2]);doc.rect(gx+off,y1+hh-h,bwid,h,'F')}});if(i%step===0){doc.setTextColor(95,103,114);doc.text(b.label,gx,y1+hh+11,{align:'center'})}});
 doc.setFillColor(15,159,143);doc.rect(W-M-120,y1-17,8,8,'F');doc.setTextColor(20,24,31);doc.setFontSize(8.5);doc.text('Income',W-M-108,y1-10);doc.setFillColor(224,71,91);doc.rect(W-M-60,y1-17,8,8,'F');doc.text('Spending',W-M-48,y1-10);
 const tbl=(title,type,color)=>{const rows=entries.filter(e=>e.type===type).sort((a,b)=>a.date.localeCompare(b.date)),total=rows.reduce((a,e)=>a+ +e.amount,0);let y=(doc.lastAutoTable?doc.lastAutoTable.finalY:0)+26;if(!doc.lastAutoTable||y>H-120){doc.addPage();y=M}
  doc.setTextColor(20,24,31);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text(title+' ('+rows.length+')',M,y);doc.setFont('helvetica','normal');
  autoTable(doc,{startY:y+8,head:[['Date','Tag','Note','Amount']],body:rows.length?rows.map(e=>[fd(e.date),tagInfo(tags,e.type,e.category).name,e.note||'',rs(+e.amount)]):[['No entries in this period','','','']],foot:rows.length?[['','','Total',rs(total)]]:undefined,theme:'striped',styles:{fontSize:9,cellPadding:4,textColor:[30,34,40]},headStyles:{fillColor:color,textColor:255},footStyles:{fillColor:[236,238,235],textColor:[20,24,31],fontStyle:'bold'},columnStyles:{0:{cellWidth:78},1:{cellWidth:110},3:{halign:'right',cellWidth:90}},margin:{left:M,right:M}})};
 doc.lastAutoTable=null;tbl('Expense log','Expense',[224,71,91]);tbl('Income log','Income',[15,159,143]);
 const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(140,146,155);doc.text('Chakra  |  Page '+i+' of '+n,W/2,H-20,{align:'center'})}
 return doc}
