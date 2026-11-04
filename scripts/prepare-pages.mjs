import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('docs');
// Vite handles relative CSS/font/icon paths. Public image literals in JS need
// the same treatment because GitHub serves this app below /yarche.soft/.
for(const name of await readdir(resolve(root,'assets'))){
 if(!name.endsWith('.js'))continue;
 const path=resolve(root,'assets',name),source=await readFile(path,'utf8');
 await writeFile(path,source.replace(/(["'])\/scene\/([^"']+)\1/g,(_match,quote,name)=>quote+'./scene/'+name+quote));
}
await writeFile(resolve(root,'.nojekyll'),'');
console.log('GitHub Pages ready: separate cacheable assets and relative paths.');
