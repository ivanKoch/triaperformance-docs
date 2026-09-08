/* Name audit — a REGRESSION CHECK over EVERY signed-off cluster.
 *
 * Clusters are read from data/exercise_clusters.json, written by
 * apply-exercise-merge-map.js from the decisions themselves. They are NOT listed
 * here: the first version of this file carried a hand-written list of 15, missed
 * three, and reported zero divergence while `Torsión espinal`/`Torsión boca
 * arriba`, `Postura del niño con alcance lateral`/`Niño con alcance lateral` and
 * `Extensión torácica sobre rodillo`/`Extensión torácica en el rodillo` were
 * still live. A checker handed its own list can only confirm what its author
 * remembered.
 *
 * Every cluster must report exactly 1 name per language. Above 1 = a page
 * drifted, or a rename was never applied. Fix the page; never relax this file.
 *
 * Usage: node automation/exercise-name-audit.js <repo-root> [--detail]
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=process.argv[2]||'.', DETAIL=process.argv.includes('--detail');
const MAP={activacion:{es:'activacion',en:'en/activation',pt:'pt/ativacao'},
 core:{es:'core',en:'en/core',pt:'pt/core'},movilidad:{es:'movilidad',en:'en/mobility',pt:'pt/mobilidade'},
 recuperacion:{es:'recuperacion',en:'en/recovery',pt:'pt/recuperacao'},aquiles:{es:'aquiles',en:'en/achilles',pt:'pt/aquiles'},
 rodillas:{es:'rodillas',en:'en/knees',pt:'pt/joelhos'},hombro:{es:'hombro',en:'en/shoulder',pt:'pt/ombro'},
 'core-ciclista':{es:'core-ciclista',en:'en/cyclist-core',pt:'pt/core-do-ciclista'},
 'core-corredor':{es:'core-corredor',en:'en/runner-core',pt:'pt/core-do-corredor'}};
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

const clusters=JSON.parse(fs.readFileSync(path.join(ROOT,'data/exercise_clusters.json'),'utf8')).filter(g=>g.length>1);
let bad=0, checked=0;
for(const g of clusters){
  const per={es:new Map(),en:new Map(),pt:new Map()};
  for(const m of g){
    const i=N[m.artifact].es.indexOf(m.name);
    if(i<0){console.error('  ✗ cluster member not found on the page: '+m.artifact+' / '+m.name+'  (stale data/members_exercises.json? re-run the extractor)');bad++;continue}
    for(const l of ['es','en','pt']){const nm=N[m.artifact][l][i];
      if(!per[l].has(nm))per[l].set(nm,[]);per[l].get(nm).push(m.artifact);}
  }
  checked++;
  const split=['es','en','pt'].filter(l=>per[l].size>1);
  if(split.length){bad++;
    console.log('⚠ '+((g.find(x=>x.type==='main')||g[0]).name));
    for(const l of split)
      console.log('   '+l.toUpperCase()+'  '+[...per[l].entries()].map(([n,a])=>'"'+n+'" ['+a.join(',')+']').join('   |   '));
  } else if(DETAIL) console.log('✓ '+g[0].name);
}
console.log('\nclusters checked: '+checked+'   clusters with more than one name: '+bad);
if(bad){console.error('\nFAIL — see above. Fix the pages, not this file.');process.exit(1)}
console.log('PASS — every signed-off cluster reads one name per language.');
