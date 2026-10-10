import {buildPdf} from './reportCore';
// jsPDF is loaded only when you press Download, so it never slows the normal pages.
export async function downloadReport(d,native){
 const {jsPDF}=await import('jspdf'),autoTable=(await import('jspdf-autotable')).default,doc=buildPdf(jsPDF,autoTable,d),name=`chakra-report-${d.from}_to_${d.to}.pdf`;
 if(native){const {Filesystem,Directory}=await import('@capacitor/filesystem'),{Share}=await import('@capacitor/share'),data=doc.output('datauristring').split(',')[1],r=await Filesystem.writeFile({path:name,data,directory:Directory.Cache});await Share.share({title:'Chakra report',url:r.uri})}
 else doc.save(name);
}
