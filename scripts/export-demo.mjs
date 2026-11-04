import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const root=resolve('dist');
const output=resolve(process.argv[2]||'artifacts/SAKYRA.html');
let html=await readFile(resolve(root,'index.html'),'utf8');
const script=html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/);
const style=html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if(!script||!style)throw new Error('Run npm run build before exporting.');
let js=await readFile(root+script[1],'utf8'),css=await readFile(root+style[1],'utf8');
for(const name of await readdir(resolve(root,'scene'))){
  const type=/\.jpe?g$/i.test(name)?'image/jpeg':name.endsWith('.png')?'image/png':name.endsWith('.webp')?'image/webp':null;if(!type)continue;
  const data=`data:${type};base64,`+(await readFile(resolve(root,'scene',name))).toString('base64');
  js=js.replaceAll('/scene/'+name,data);css=css.replaceAll('/scene/'+name,data);
}
css=css.replaceAll('/fonts/manrope.ttf','data:font/ttf;base64,'+(await readFile(resolve(root,'fonts/manrope.ttf'))).toString('base64'));
const favicon='data:image/svg+xml;base64,'+(await readFile(resolve(root,'favicon.svg'))).toString('base64');
html=html.replace(script[0],()=>'<script type="module">'+js.replaceAll('</script','<\\/script')+'</script>');
html=html.replace(style[0],()=>'<style>'+css+'</style>').replace('/favicon.svg',favicon);
await mkdir(dirname(output),{recursive:true});await writeFile(output,html);
console.log(`Exported ${output} (${Math.round(Buffer.byteLength(html)/1024)} KB)`);
