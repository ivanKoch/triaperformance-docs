/* Applies automation/exercise-renames.json to the 27 artifact pages.
 * Display names only. Matches the FULL quoted string so "Figura 4" can never be
 * rewritten inside "Figura 4 boca arriba".
 * Usage: node automation/apply-exercise-renames.js <root> [--dry]
 */
const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||'.', DRY=process.argv.includes('--dry');
const MAP={activacion:{es:'activacion',en:'en/activation',pt:'pt/ativacao'},
 core:{es:'core',en:'en/core',pt:'pt/core'},movilidad:{es:'movilidad',en:'en/mobility',pt:'pt/mobilidade'},
 recuperacion:{es:'recuperacion',en:'en/recovery',pt:'pt/recuperacao'},aquiles:{es:'aquiles',en:'en/achilles',pt:'pt/aquiles'},
 rodillas:{es:'rodillas',en:'en/knees',pt:'pt/joelhos'},hombro:{es:'hombro',en:'en/shoulder',pt:'pt/ombro'},
 'core-ciclista':{es:'core-ciclista',en:'en/cyclist-core',pt:'pt/core-do-ciclista'},
 'core-corredor':{es:'core-corredor',en:'en/runner-core',pt:'pt/core-do-corredor'}};
const R=JSON.parse(fs.readFileSync(path.join(ROOT,'automation/exercise-renames.json'),'utf8'));
let applied=0, noop=0, missing=[];
for(const [slug,langs] of Object.entries(R)){
  if(slug.startsWith('_'))continue;
  for(const [lg,pairs] of Object.entries(langs)){
    const file=path.join(ROOT,'site/members',MAP[slug][lg],'index.njk');
    let src=fs.readFileSync(file,'utf8'), before=src;
    for(const [oldN,newN] of pairs){
      if(oldN===newN){noop++;continue}
      const needle='name: "'+oldN+'"';
      if(!src.includes(needle)){missing.push(slug+'/'+lg+': '+oldN);continue}
      const n=src.split(needle).length-1;
      src=src.split(needle).join('name: "'+newN+'"');
      applied+=n;
    }
    if(src!==before&&!DRY)fs.writeFileSync(file,src);
  }
}
console.log((DRY?'[dry] ':'')+'renames applied: '+applied+'   already-canonical entries skipped: '+noop);
if(missing.length){console.error('\n✗ NOT FOUND (map is wrong, nothing written for these):');missing.forEach(m=>console.error('   '+m));process.exit(1);}
