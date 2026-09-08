/* Builds data/cue_harmonisation.csv — the hand-edit sheet for the cue half of
 * the library work (open-loops.md NEXT #15).
 *
 * ONE ROW PER EXERCISE THAT APPEARS IN MORE THAN ONE ARTIFACT. Exercises with a
 * single placement have nothing to harmonise and are deliberately absent — the
 * job is 33 rows, not 194.
 *
 * Spanish only, on purpose: EN/PT are derived from the signed-off Spanish, the
 * same way automation/mobility-i18n.py and recovery-i18n.py already work.
 * Harmonising Spanish alone and stopping there is the drift the members-i18n
 * branch exists to prevent — the translation pass is part of the same job.
 *
 * Columns Iván fills: harmonized_cue, and note_1..note_N aligned to present_in.
 * Everything else is context. Per D1: the canonical cue carries the MOVEMENT
 * description; the note carries that placement's context sentence.
 *
 * Usage: node automation/build-cue-harmonisation-csv.js <repo-root>
 */
const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||'.';
const rows=require(path.join(ROOT,'data/members_exercises.json'));
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

// Names are harmonised as of September 8, 2026, so an exact name match is now a
// reliable grouping key. It was not before the rename pass — that is the point.
const G=new Map();
for(const r of rows){
  const k=norm(r.name);
  if(!G.has(k))G.set(k,[]);
  if(!G.get(k).some(x=>x.artifact_slug===r.artifact_slug))G.get(k).push(r);
}
const multi=[...G.values()].filter(g=>g.length>1).sort((a,b)=>b.length-a.length||a[0].name.localeCompare(b[0].name,'es'));
const MAX=Math.max(...multi.map(g=>g.length));

const esc=v=>{v=v==null?'':String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const H=['exercise_name','present_in','copies'];
for(let i=1;i<=MAX;i++)H.push('cue_'+i);
H.push('harmonized_cue');
for(let i=1;i<=MAX;i++)H.push('note_'+i);
for(let i=1;i<=MAX;i++)H.push('dose_'+i);

const out=[H.join(',')];
for(const g of multi){
  const cells=[g[0].name, g.map(x=>x.artifact_slug).join(';'), g.length];
  for(let i=0;i<MAX;i++)cells.push(g[i]?g[i].cue:'');
  cells.push('');                                    // harmonized_cue — Iván
  for(let i=0;i<MAX;i++)cells.push('');              // note_i — Iván
  for(let i=0;i<MAX;i++)cells.push(g[i]?(g[i].sets?g[i].sets+'×'+g[i].reps:(g[i].hold_s?g[i].hold_s+'s':'')):'');
  out.push(cells.map(esc).join(','));
}
fs.writeFileSync(path.join(ROOT,'data/cue_harmonisation.csv'),out.join('\n')+'\n');
console.log('rows (exercises in 2+ artifacts):',multi.length);
console.log('placements they cover            :',multi.reduce((n,g)=>n+g.length,0));
console.log('widest cluster                   :',MAX,'copies');
console.log('columns                          :',H.length);
