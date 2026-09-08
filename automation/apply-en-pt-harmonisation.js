/* Applies data/cue_harmonisation_en_pt.json — harmonised EN and PT names + cues.
 *
 * Position-matched, not name-matched: for each Spanish exercise it finds that
 * entry's index in the page's library and edits the EN/PT entry at the SAME
 * index. Textual `name: "..."` counting alone would be wrong — the activation
 * pages also carry `name:` on routine PHASE labels ("Suelo", "De pie"), which are
 * not exercises. So the index comes from evaluating the page, and the textual
 * edit is then anchored on the live name at that index, disambiguated by
 * occurrence rank when a page repeats a name.
 *
 * Usage: node automation/apply-en-pt-harmonisation.js <root> [--dry]
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=process.argv[2]||'.', DRY=process.argv.includes('--dry');
const MAP={activacion:{es:'activacion',en:'en/activation',pt:'pt/ativacao'},core:{es:'core',en:'en/core',pt:'pt/core'},
 movilidad:{es:'movilidad',en:'en/mobility',pt:'pt/mobilidade'},recuperacion:{es:'recuperacion',en:'en/recovery',pt:'pt/recuperacao'},
 aquiles:{es:'aquiles',en:'en/achilles',pt:'pt/aquiles'},rodillas:{es:'rodillas',en:'en/knees',pt:'pt/joelhos'},
 hombro:{es:'hombro',en:'en/shoulder',pt:'pt/ombro'},'core-ciclista':{es:'core-ciclista',en:'en/cyclist-core',pt:'pt/core-do-ciclista'},
 'core-corredor':{es:'core-corredor',en:'en/runner-core',pt:'pt/core-do-corredor'}};
const mkEl=()=>({dataset:{},style:{},children:[],textContent:'',innerHTML:'',hidden:false,value:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},removeAttribute(){},getAttribute(){return null},querySelector(){return mkEl()},querySelectorAll(){return[]},closest(){return null},focus(){},scrollIntoView(){}});
const doc={getElementById:()=>mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],createElement:()=>mkEl(),addEventListener(){},body:mkEl(),head:mkEl()};
function libNames(file){
  const src=fs.readFileSync(file,'utf8').replace(/\{#-?[\s\S]*?-?#\}/g,'').replace(/\{%[\s\S]*?%\}/g,'');
  const win={};const sb={window:win,document:doc,console:{log(){},error(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},navigator:{language:'es'},location:{href:'',hash:''},localStorage:{getItem:()=>null,setItem(){}}};
  sb.globalThis=sb;vm.createContext(sb);
  const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;let m;
  while((m=re.exec(src))){try{vm.runInContext(m[1],sb,{timeout:5000})}catch(e){}}
  const out=[];const add=e=>{if(e&&e.name){out.push(e.name);(e.variants||[]).forEach(add)}};
  for(const k of Object.keys(win)){const o=win[k];if(o&&typeof o==='object'&&o.library){Object.values(o.library).forEach(add);return out}}
  if(win.ACTIVATION_DATA&&win.ACTIVATION_DATA.phases){win.ACTIVATION_DATA.phases.forEach(p=>(p.exercises||[]).forEach(add));return out}
  return out;
}
const D=JSON.parse(fs.readFileSync(path.join(ROOT,'data/cue_harmonisation_en_pt.json'),'utf8')).entries;
const cache={};
const load=f=>cache[f]||(cache[f]={src:fs.readFileSync(f,'utf8'),names:libNames(f)});
let names=0,cues=0,skipped=0; const problems=[];

for(const e of D){
  for(const art of e.scope){
    const esF=path.join(ROOT,'site/members',MAP[art].es,'index.njk');
    const esNames=load(esF).names;
    const i=esNames.indexOf(e.es);
    if(i<0){problems.push(art+' / ES name not found: '+e.es);continue}
    for(const lg of ['en','pt']){
      const f=path.join(ROOT,'site/members',MAP[art][lg],'index.njk');
      const st=load(f);
      const live=st.names[i];
      if(live===undefined){problems.push(art+'/'+lg+' index '+i+' out of range');continue}
      // occurrence rank of this live name among the entries before it
      let rank=0; for(let k=0;k<i;k++) if(st.names[k]===live) rank++;
      const needle='name: "'+live+'"';
      let pos=-1,seen=0;
      for(let p=st.src.indexOf(needle); p>=0; p=st.src.indexOf(needle,p+1)){
        if(seen===rank){pos=p;break} seen++;
      }
      if(pos<0){problems.push(art+'/'+lg+': textual anchor not found for "'+live+'"');continue}
      // replace the name
      const want=e[lg].name;
      if(live!==want){ st.src=st.src.slice(0,pos)+'name: "'+want+'"'+st.src.slice(pos+needle.length); names++; }
      // replace the cue that follows it
      const after=pos+('name: "'+want+'"').length;
      const j=st.src.indexOf('cue: "', after);
      if(j<0 || j-after>500){problems.push(art+'/'+lg+': no cue near "'+want+'"');continue}
      let end=j+6; while(end<st.src.length && !(st.src[end]==='"' && st.src[end-1]!=='\\')) end++;
      st.src=st.src.slice(0,j+6)+e[lg].cue+st.src.slice(end);
      cues++;
      st.names[i]=want;
    }
  }
}
if(!DRY) for(const [f,st] of Object.entries(cache)) fs.writeFileSync(f,st.src);
console.log((DRY?'[dry] ':'')+'names changed: '+names+'   cues applied: '+cues);
if(problems.length){console.error('\n✗ PROBLEMS:');problems.forEach(p=>console.error('   '+p));process.exit(1)}
