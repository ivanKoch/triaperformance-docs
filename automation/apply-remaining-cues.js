/* Applies data/cue_remaining_signed.csv — Iván's ES/EN/PT names and cues for the
 * 166 placements NOT covered by the September 8 harmonisation.
 *
 * Placements are addressed by (artifact, ES name, tag), never by name alone:
 * five exercises repeat an ES name inside one artifact and are separated only by
 * their tag — aquiles has four such pairs ("Piso plano" vs "Escalón",
 * "Prensa · rango limitado" vs "Prensa"), rodillas has the wall sit. A
 * name-only match would silently write both of them with the first one's text.
 *
 * EN/PT are edited at the SAME library index as the Spanish entry, the same way
 * apply-en-pt-harmonisation.js does it.
 *
 * Usage: node automation/apply-remaining-cues.js <root> [--dry]
 */
const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||'.', DRY=process.argv.includes('--dry');
const MAP={activacion:{es:'activacion',en:'en/activation',pt:'pt/ativacao'},core:{es:'core',en:'en/core',pt:'pt/core'},
 movilidad:{es:'movilidad',en:'en/mobility',pt:'pt/mobilidade'},recuperacion:{es:'recuperacion',en:'en/recovery',pt:'pt/recuperacao'},
 aquiles:{es:'aquiles',en:'en/achilles',pt:'pt/aquiles'},rodillas:{es:'rodillas',en:'en/knees',pt:'pt/joelhos'},
 hombro:{es:'hombro',en:'en/shoulder',pt:'pt/ombro'},'core-ciclista':{es:'core-ciclista',en:'en/cyclist-core',pt:'pt/core-do-ciclista'},
 'core-corredor':{es:'core-corredor',en:'en/runner-core',pt:'pt/core-do-corredor'}};

/* --- decisions taken September 8, 2026, on reading the returned file ---------
 * Iván's English naming exposed four pairs that were the same movement under two
 * Spanish names. All four merge (his call), per the standing rule: split when the
 * MOVEMENT differs, merge when only difficulty, context or safety does. */
const MERGE_RENAME={                       // [artifact, old ES name] -> new ES name
  'core|Paloma (pigeon)':'Postura de la paloma',
  'activacion|Isquios acostado':'Isquios boca arriba',
  'core|Zancada baja con glúteo activo':'Psoas con apriete de glúteo',
  'core-corredor|Puente de glúteos con marcha':'Puente con marcha',
};
/* The last two fold into exercises harmonised earlier today, so they take THAT
 * text — not the newly written cue — or the merge would immediately re-diverge. */
const TAKE_HARMONISED=new Set(['core|Psoas con apriete de glúteo','core-corredor|Puente con marcha']);
/* D2d: activación keeps a plain hip-flexor stretch and a squeeze progression as a
 * deliberate pair. The returned cue ended with "Aprieta el glúteo de atrás",
 * which is the one sentence that separates them. Dropped. */
const CUE_TRIM={'activacion|Psoas de rodillas':{es:/\s*Aprieta el glúteo de atrás\.\s*$/,
  en:/\s*Squeeze the rear glute\.\s*$/, pt:/\s*Aperte o glúteo de trás\.\s*$/}};

function parseCSV(t){
  const rows=[];let f=[],c='',q=false;
  for(let i=0;i<t.length;i++){const ch=t[i];
    if(q){ if(ch==='"'){ if(t[i+1]==='"'){c+='"';i++} else q=false } else c+=ch }
    else if(ch==='"')q=true;
    else if(ch===','){f.push(c);c=''}
    else if(ch==='\n'){f.push(c);rows.push(f);f=[];c=''}
    else if(ch!=='\r')c+=ch;}
  if(c||f.length){f.push(c);rows.push(f)}
  const head=rows.shift();
  return rows.filter(r=>r.length>1&&r.some(x=>x.trim())).map(r=>Object.fromEntries(head.map((h,i)=>[h.trim(),r[i]??''])));
}
const inv=require(path.join(ROOT,'data/members_exercises.json'));
const HARM=JSON.parse(fs.readFileSync(path.join(ROOT,'data/cue_harmonisation_en_pt.json'),'utf8')).entries;
const HARM_ES=JSON.parse(fs.readFileSync(path.join(ROOT,'data/cue_harmonisation_signed.json'),'utf8')).cues;
const rows=parseCSV(fs.readFileSync(path.join(ROOT,'data/cue_remaining_signed.csv'),'utf8'));

const byArt={}; inv.forEach(r=>(byArt[r.artifact_slug]=byArt[r.artifact_slug]||[]).push(r));
const cache={}; const load=f=>cache[f]||(cache[f]={src:fs.readFileSync(f,'utf8')});
/* Names and cues live inside JS string literals, so a name containing a quote is
 * stored escaped: `name: "Flexión \\"plus\\" (protracción)"`. The evaluated name
 * has real quotes, so every anchor and every write has to go back through the
 * escape. Found by the applier's own not-found guard rather than by a silent
 * half-write, which is the reason that guard exits non-zero. */
const jsEsc=s=>String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
function nthName(src,name,rank){let seen=0;const n='name: "'+jsEsc(name)+'"';
  for(let p=src.indexOf(n);p>=0;p=src.indexOf(n,p+1)){if(seen===rank)return p;seen++}return -1}
function setCue(st,pos,nameLen,cue,problems,who){
  const j=st.src.indexOf('cue: "',pos+nameLen);
  if(j<0||j-(pos+nameLen)>500){problems.push(who+': no cue near name');return}
  let e=j+6;while(e<st.src.length&&!(st.src[e]==='"'&&st.src[e-1]!=='\\'))e++;
  st.src=st.src.slice(0,j+6)+jsEsc(cue)+st.src.slice(e);
}
let done=0,renamed=0,merged=0;const problems=[];
for(const r of rows){
  const art=r.artifact, esName=r.exercise_name_es, tag=(r.tag||'').trim();
  const list=byArt[art]||[];
  let idx=list.findIndex(x=>x.name===esName&&(x.tag||'').trim()===tag);
  if(idx<0) idx=list.findIndex(x=>x.name===esName);
  if(idx<0){problems.push(art+' / '+esName+' ('+tag+'): not found in inventory');continue}
  const key=art+'|'+esName;
  let outEs=r.cue_es,outEn=r.cue_en,outPt=r.cue_pt;
  let nameEs=esName, nameEn=r.name_en, namePt=r.name_pt;
  if(MERGE_RENAME[key]){ nameEs=MERGE_RENAME[key]; merged++;
    const hk=art+'|'+nameEs;
    if(TAKE_HARMONISED.has(hk)){
      const h=HARM.find(x=>x.es===nameEs), hes=HARM_ES.find(x=>x.name===nameEs);
      if(!h||!hes){problems.push(hk+': harmonised source missing');continue}
      outEs=hes.cue; outEn=h.en.cue; outPt=h.pt.cue; nameEn=h.en.name; namePt=h.pt.name;
    }
  }
  if(CUE_TRIM[key]){ outEs=outEs.replace(CUE_TRIM[key].es,''); outEn=outEn.replace(CUE_TRIM[key].en,''); outPt=outPt.replace(CUE_TRIM[key].pt,''); }
  for(const [lg,newName,newCue] of [['es',nameEs,outEs],['en',nameEn,outEn],['pt',namePt,outPt]]){
    const f=path.join(ROOT,'site/members',MAP[art][lg],'index.njk'); const st=load(f);
    const live=lg==='es'?esName:(lg==='en'?inv:null);
    // live name at this index, per language
    const liveName=lg==='es'?esName:null;
    let target=liveName;
    if(lg!=='es'){ // resolve the live EN/PT name at the same index
      const names=(cache['__names_'+f]||(cache['__names_'+f]=require('./_libnames.js')(f)));
      target=names[idx];
      if(target===undefined){problems.push(art+'/'+lg+' index '+idx+' out of range');continue}
    }
    let rank=0;
    if(lg==='es'){ for(let k=0;k<idx;k++) if(list[k].name===esName) rank++; }
    else { const names=cache['__names_'+f]; for(let k=0;k<idx;k++) if(names[k]===target) rank++; }
    const pos=nthName(st.src,target,rank);
    if(pos<0){problems.push(art+'/'+lg+': anchor not found for "'+target+'"');continue}
    const anchorLen=('name: "'+jsEsc(target)+'"').length, newLen=('name: "'+jsEsc(newName)+'"').length;
    if(target!==newName){ st.src=st.src.slice(0,pos)+'name: "'+jsEsc(newName)+'"'+st.src.slice(pos+anchorLen); renamed++; }
    setCue(st,pos,(target!==newName?newLen:anchorLen),newCue,problems,art+'/'+lg+'/'+newName);
    if(lg!=='es') cache['__names_'+f][idx]=newName;
  }
  done++;
}
if(!DRY) for(const [f,st] of Object.entries(cache)) if(st&&st.src) fs.writeFileSync(f,st.src);
console.log((DRY?'[dry] ':'')+'rows applied: '+done+'   names changed: '+renamed+'   merges: '+merged);
if(problems.length){console.error('\n✗ PROBLEMS ('+problems.length+'):');problems.slice(0,25).forEach(p=>console.error('   '+p));process.exit(1)}
