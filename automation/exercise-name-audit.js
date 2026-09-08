/* Per-language name audit — now a REGRESSION CHECK, not a discovery tool.
 * Since the September 8, 2026 harmonisation every cluster must report exactly 1
 * name per language. Anything above 1 means a page has drifted again: fix the
 * page, do not relax this file.
 * Extracts every exercise name from all 27 artifact
 * pages (9 artifacts × ES/EN/PT) and reports, for each merged cluster, the
 * distinct names each language uses.
 *
 * Position alignment is safe: the three language copies of an artifact hold the
 * same library in the same order (parity verified September 7, 2026 — 253 rows
 * in each language, no gaps).
 *
 * Usage: node automation/exercise-name-audit.js <repo-root>
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=process.argv[2]||'.';
const MAP={
 activacion:{es:'activacion',en:'en/activation',pt:'pt/ativacao'},
 core:{es:'core',en:'en/core',pt:'pt/core'},
 movilidad:{es:'movilidad',en:'en/mobility',pt:'pt/mobilidade'},
 recuperacion:{es:'recuperacion',en:'en/recovery',pt:'pt/recuperacao'},
 aquiles:{es:'aquiles',en:'en/achilles',pt:'pt/aquiles'},
 rodillas:{es:'rodillas',en:'en/knees',pt:'pt/joelhos'},
 hombro:{es:'hombro',en:'en/shoulder',pt:'pt/ombro'},
 'core-ciclista':{es:'core-ciclista',en:'en/cyclist-core',pt:'pt/core-do-ciclista'},
 'core-corredor':{es:'core-corredor',en:'en/runner-core',pt:'pt/core-do-corredor'},
};
const mkEl=()=>({dataset:{},style:{},children:[],textContent:'',innerHTML:'',hidden:false,value:'',
 classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},
 appendChild(){},remove(){},setAttribute(){},removeAttribute(){},getAttribute(){return null},
 querySelector(){return mkEl()},querySelectorAll(){return[]},closest(){return null},focus(){},scrollIntoView(){}});
const doc={getElementById:()=>mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],createElement:()=>mkEl(),addEventListener(){},body:mkEl(),head:mkEl()};
function names(file){
  const src=fs.readFileSync(file,'utf8').replace(/\{#-?[\s\S]*?-?#\}/g,'').replace(/\{%[\s\S]*?%\}/g,'');
  const win={};const sb={window:win,document:doc,console:{log(){},error(){}},setTimeout(){},clearTimeout(){},
    setInterval(){},clearInterval(){},navigator:{language:'es'},location:{href:'',hash:''},localStorage:{getItem:()=>null,setItem(){}}};
  sb.globalThis=sb;vm.createContext(sb);
  const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;let m;
  while((m=re.exec(src))){try{vm.runInContext(m[1],sb,{timeout:5000})}catch(e){}}
  const out=[];const add=e=>{if(e&&e.name){out.push(e.name);(e.variants||[]).forEach(add)}};
  for(const k of Object.keys(win)){const o=win[k];
    if(o&&typeof o==='object'&&o.library){Object.values(o.library).forEach(add);return out}}
  if(win.ACTIVATION_DATA&&win.ACTIVATION_DATA.phases){win.ACTIVATION_DATA.phases.forEach(p=>(p.exercises||[]).forEach(add));return out}
  return out;
}
const N={};
for(const [slug,langs] of Object.entries(MAP)){N[slug]={};
  for(const [lg,rel] of Object.entries(langs)) N[slug][lg]=names(path.join(ROOT,'site/members',rel,'index.njk'));}

// Clusters expressed as [artifact, ES name] members.
const CLUSTERS=[
 ['cat-cow',[['activacion','Gato-camello'],['core','Gato-camello'],['movilidad','Gato-camello'],['recuperacion','Gato-camello'],['core-ciclista','Gato-camello'],['core-corredor','Gato-camello']]],
 ['worlds-greatest',[['activacion','El mejor estiramiento del mundo'],['core','El mejor estiramiento del mundo'],['recuperacion','El mejor estiramiento del mundo']]],
 ['leg-swing-front',[['activacion','Balanceo de pierna (frontal)'],['recuperacion','Balanceo de pierna (frontal)'],['rodillas','Balanceo de pierna (frontal)']]],
 ['figure-4',[['activacion','Figura 4 boca arriba'],['movilidad','Figura 4 boca arriba'],['core-corredor','Figura 4 boca arriba'],['core','Figura 4 boca arriba']]],
 ['open-book',[['movilidad','Libro abierto'],['recuperacion','Libro abierto'],['hombro','Libro abierto']]],
 ['wall-angel',[['recuperacion','Ángeles en la pared'],['hombro','Ángeles en la pared']]],
 ['cross-body',[['movilidad','Estiramiento cruzado de hombro'],['hombro','Estiramiento cruzado de hombro']]],
 ['roll-quad',[['movilidad','Rodillo: cuádriceps'],['rodillas','Rodillo: cuádriceps']]],
 ['ball-pec',[['movilidad','Pelota: pectoral menor'],['hombro','Pelota: pectoral menor']]],
 ['side-plank-raise',[['core','Plancha lateral con elevación de pierna'],['core-ciclista','Plancha lateral con elevación de pierna']]],
 ['ankle-kick',[['activacion','Tobillos para la patada'],['recuperacion','Tobillos para la patada']]],
 ['roll-calf',[['aquiles','Rodillo: vientre del gemelo'],['rodillas','Rodillo: vientre del gemelo'],['movilidad','Rodillo: vientre del gemelo']]],
 ['balance',[['recuperacion','Apoyo en una pierna'],['rodillas','Apoyo en una pierna']]],
 ['psoas-squeeze',[['activacion','Psoas con apriete de glúteo'],['core-ciclista','Psoas con apriete de glúteo'],['core-corredor','Psoas con apriete de glúteo'],['movilidad','Psoas con apriete de glúteo']]],
 ['couch-stretch',[['core','Couch stretch'],['rodillas','Couch stretch'],['movilidad','Couch stretch']]],
];
const DETAIL=process.argv.includes('--detail');
let tot={es:0,en:0,pt:0}, edits={es:0,en:0,pt:0};
const report=[];
for(const [id,members] of CLUSTERS){
  const per={es:new Map(),en:new Map(),pt:new Map()};
  for(const [slug,esName] of members){
    const i=N[slug].es.indexOf(esName);
    if(i<0){console.error('  ✗ not found: '+slug+' / '+esName);continue}
    ['es','en','pt'].forEach(l=>{const nm=N[slug][l][i];
      if(!per[l].has(nm))per[l].set(nm,[]);per[l].get(nm).push(slug);});
  }
  ['es','en','pt'].forEach(l=>{
    if(per[l].size>1){tot[l]++;
      // edits = placements not carrying the most-used spelling
      const sorted=[...per[l].entries()].sort((a,b)=>b[1].length-a[1].length);
      edits[l]+=sorted.slice(1).reduce((n,[,arts])=>n+arts.length,0);}});
  report.push([id,per]);
}
if(DETAIL){
  for(const [id,per] of report){
    console.log('\n### '+id);
    for(const l of ['es','en','pt']){
      const rows=[...per[l].entries()].sort((a,b)=>b[1].length-a[1].length);
      const flag=rows.length>1?'⚠ ':'✓ ';
      console.log('  '+flag+l.toUpperCase()+'  '+rows.map(([n,a])=>'"'+n+'" ['+a.join(',')+']').join('   |   '));
    }
  }
} else {
  console.log('cluster'.padEnd(20)+'ES'.padEnd(6)+'EN'.padEnd(6)+'PT');
  for(const [id,per] of report)
    console.log(id.padEnd(20)+['es','en','pt'].map(l=>String(per[l].size)+(per[l].size>1?'⚠':' ')).map(x=>x.padEnd(6)).join(''));
}
console.log('\nclusters showing more than one name — ES: '+tot.es+'   EN: '+tot.en+'   PT: '+tot.pt);
console.log('name edits if the most-used spelling wins — ES: '+edits.es+'   EN: '+edits.en+'   PT: '+edits.pt+'   TOTAL: '+(edits.es+edits.en+edits.pt));
