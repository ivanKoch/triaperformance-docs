/* Applies the signed-off merge map (D1–D3, `exercise-library-decisions.md`) to the
 * extracted inventory and reports the canonical exercise count and the filming
 * count. Reproducible: re-run after any change to an exercise library.
 *
 * Usage: node automation/extract-members-exercises.js <root>   (writes the CSVs)
 *        node automation/apply-exercise-merge-map.js <root>
 *
 * Every override key below is asserted to exist. A typo fails loudly rather than
 * silently under-merging and reporting a number that is quietly too high.
 */
const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||'.';
const rows=require(require('path').join(process.argv[2]||'.','data/members_exercises.json'));
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const STOP=new Set(['de','del','la','el','en','con','y','a','al','los','las','un','una','sin','por','para','the','of']);
const toks=s=>new Set(norm(s).split(' ').filter(w=>w&&!STOP.has(w)));
const tri=s=>{const t=norm(s),o=new Set();for(let i=0;i<t.length-2;i++)o.add(t.slice(i,i+3));return o;};
const jac=(a,b)=>{if(!a.size||!b.size)return 0;let i=0;for(const x of a)if(b.has(x))i++;return i/(a.size+b.size-i);};

const seen=new Map();
for(const r of rows){const k=r.artifact_slug+'::'+norm(r.name)+'::'+r.type;if(!seen.has(k))seen.set(k,{...r,key:k,_n:toks(r.name),_c:tri(r.cue)});}
const items=[...seen.values()];
const idx=new Map(items.map((it,i)=>[it.key,i]));
const K=k=>{if(!idx.has(k))throw new Error('MERGE MAP KEY NOT FOUND: '+k);return idx.get(k);};

const ACTIVATION=new Set(['activacion','core','movilidad','recuperacion']);

// ---- automatic pass: identical name / strong cue similarity ------------------
const par=items.map((_,i)=>i);const find=x=>par[x]===x?x:(par[x]=find(par[x]));const uni=(a,b)=>{par[find(a)]=find(b)};
const AUTO=[];
for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  const a=items[i],b=items[j];if(a.artifact_slug===b.artifact_slug)continue;
  const nameEq=norm(a.name)===norm(b.name),sameId=a.exercise_id&&a.exercise_id===b.exercise_id;
  const ns=jac(a._n,b._n),cs=jac(a._c,b._c);
  if(nameEq||cs>=0.60||(ns>=0.60&&cs>=0.50)||(sameId&&cs>=0.55))AUTO.push([i,j]);
}
/* Edges the automatic pass proposes and a decision overrules. Both are cases the
 * similarity score cannot see: a hold vs an alternation (D2a), and a progression
 * vs its own regression (D2d). Suppressed BEFORE union-find runs — suppressing
 * afterwards is impossible, since a union cannot be undone. */
const SUPPRESS=[
  // D2a — bird dog: nothing may merge into the dynamic version
  ['core-corredor::bird dog dinamico::main','*'],
  /* D2d — activación's plain "Psoas de rodillas" is the regression half of a
   * deliberate base/progression pair and must stay alone. Widened to '*' on
   * September 8, 2026: once Iván's harmonised squeeze cue landed, the plain
   * version's cue became similar enough to be pulled in by the automatic pass
   * through a THIRD member rather than the pair originally suppressed.
   * Suppressing one edge is not enough when the cluster it must stay out of has
   * grown. */
  ['activacion::psoas de rodillas::main','*'],
  /* D2a again, September 8 evening: once the remaining cues were harmonised,
   * core's "Bird dog isométrico" became similar enough to be pulled into the
   * Bird dog cluster. It holds for the WHOLE block; Bird dog reaches and switches
   * every two or three seconds. Different execution, so it stays its own entry —
   * and it shares the Bird dog video. */
  ['core::bird dog isometrico::variant','*'],
];
const suppressed=(a,b)=>SUPPRESS.some(([x,y])=>{
  const ka=items[a].key,kb=items[b].key;
  return (x===ka&&(y==='*'||y===kb))||(x===kb&&(y==='*'||y===ka));
});
SUPPRESS.forEach(([x,y])=>{K(x);if(y!=='*')K(y);});   // fail loudly on a typo
AUTO.filter(([i,j])=>!suppressed(i,j)).forEach(([i,j])=>uni(i,j));

// ---- signed-off merges -------------------------------------------------------
/* ⚠ These keys are (artifact, normalised NAME, type). Names are not stable — the
 * September 8, 2026 harmonisation moved 19 of them and every key here had to be
 * rewritten through automation/exercise-renames.json to match. That fragility is
 * an argument for the branch, whose whole point is a stable global id per
 * exercise; until then, rename and merge map must be updated together. */
const EXTRA=[
  // manual, batch 1 — same movement, unrelated names
  ['core::gato camello::main','activacion::gato camello::main'],
  ['core::el mejor estiramiento del mundo::main','activacion::el mejor estiramiento del mundo::main'],
  ['core::couch stretch::main','rodillas::couch stretch::main'],
  // D2d — movilidad joins the squeeze cluster
  ['movilidad::psoas con apriete de gluteo::main','activacion::psoas con apriete de gluteo::main'],
  // D2e — one couch stretch
  ['movilidad::couch stretch::variant','rodillas::couch stretch::main'],
  // D3, naming drift only
  ['hombro::libro abierto::main','movilidad::libro abierto::main'],
  ['hombro::estiramiento cruzado de hombro::main','movilidad::estiramiento cruzado de hombro::main'],
  ['hombro::angeles en la pared::main','recuperacion::angeles en la pared::main'],
  ['movilidad::rodillo cuadriceps::variant','rodillas::rodillo cuadriceps::main'],
  ['movilidad::pelota pectoral menor::variant','hombro::pelota pectoral menor::main'],
  ['core::plancha lateral con elevacion de pierna::variant','core-ciclista::plancha lateral con elevacion de pierna::main'],
  ['activacion::tobillos para la patada::main','recuperacion::tobillos para la patada::main'],
  ['core-corredor::figura 4 boca arriba::main','activacion::figura 4 boca arriba::main'],
  ['core::figura 4 boca arriba::variant','activacion::figura 4 boca arriba::main'],
  // D3a — one calf roller, Achilles restriction becomes the cue
  ['aquiles::rodillo vientre del gemelo::main','rodillas::rodillo vientre del gemelo::main'],
  ['movilidad::rodillo vientre del gemelo::variant','rodillas::rodillo vientre del gemelo::main'],
  // D3b — one balance
  ['recuperacion::apoyo en una pierna::main','rodillas::apoyo en una pierna::main'],
];
EXTRA.forEach(([a,b])=>uni(K(a),K(b)));

/* Assertions. These exist because the first run of this script silently produced
 * a number that was one too low: the automatic pass had re-merged the psoas pair
 * D2d separates, and nothing complained. A count nobody can check is not evidence. */
const same=(a,b)=>find(K(a))===find(K(b));
const ASSERT=[
  [!same('movilidad::psoas con apriete de gluteo::main','activacion::psoas de rodillas::main'),'D2d: movilidad psoas must NOT sit with the plain version'],
  [ same('movilidad::psoas con apriete de gluteo::main','activacion::psoas con apriete de gluteo::main'),'D2d: movilidad psoas must sit with the squeeze cluster'],
  [!same('core-corredor::bird dog dinamico::main','core::bird dog::main'),'D2a: bird dog must stay split'],
  [ same('aquiles::rodillo vientre del gemelo::main','rodillas::rodillo vientre del gemelo::main'),'D3a: one calf roller'],
  [ same('recuperacion::apoyo en una pierna::main','rodillas::apoyo en una pierna::main'),'D3b: one balance'],
];
let failed=0;
ASSERT.forEach(([ok,msg])=>{if(!ok){console.error('✗ '+msg);failed++}});
if(failed){console.error('\n'+failed+' assertion(s) failed — the count below is wrong. Fix the map.');process.exit(1);}

const groups=new Map();
items.forEach((it,i)=>{const r=find(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(it)});
const canon=[...groups.values()];

// D2a: one video serves both bird dogs.
const SHARED_VIDEO=[['core::bird dog::main','core-corredor::bird dog dinamico::main']];
const vpar=canon.map((_,i)=>i);const vfind=x=>vpar[x]===x?x:(vpar[x]=vfind(vpar[x]));
const groupOf=k=>canon.findIndex(g=>g.some(x=>x.key===k));
SHARED_VIDEO.forEach(([a,b])=>{const ga=groupOf(a),gb=groupOf(b);if(ga<0||gb<0)throw new Error('shared-video key missing');vpar[vfind(ga)]=vfind(gb)});
const clips=new Set(canon.map((_,i)=>vfind(i))).size;

/* Export cluster membership so the name audit derives its clusters from the
 * signed-off decisions instead of a hand-written list. The first version of that
 * audit carried its own copy of the clusters and MISSED THREE — it reported zero
 * divergence while three exercises still had two names each. A checker fed its
 * own list can only ever confirm what its author remembered. */
fs.writeFileSync(path.join(ROOT,'data/exercise_clusters.json'),
  JSON.stringify(canon.map(g=>g.map(x=>({artifact:x.artifact_slug,name:x.name,type:x.type}))),null,1));

const reach=g=>g.some(x=>ACTIVATION.has(x.artifact_slug));
const canFilmNow=canon.filter(reach).length;
const blocked=canon.length-canFilmNow;
const variantsOnly=canon.filter(g=>g.every(x=>x.type==='variant')).length;

console.log('placements (artifact × exercise, ES)   :', items.length);
console.log('CANONICAL EXERCISES                    :', canon.length);
console.log('CLIPS TO FILM (bird dog pair shares 1) :', clips);
console.log('');
console.log('  showable today (activation engine)   :', canFilmNow);
console.log('  blocked — strength engine has no video field:', blocked);
console.log('  of the canonical, regressions/variants only :', variantsOnly);
console.log('');
const multi=canon.filter(g=>g.length>1).sort((a,b)=>b.length-a.length);
console.log('exercises used in more than one artifact:', multi.length);
console.log('placements they cover                  :', multi.reduce((n,g)=>n+g.length,0));
console.log('\nTop 12 by reuse — film these first:');
multi.slice(0,12).forEach(g=>{
  const n=(g.find(x=>x.type==='main')||g[0]).name;
  console.log('  '+String(g.length)+'×  '+n.padEnd(38)+(reach(g)?'':'  ⚠ strength-engine only'));
});
