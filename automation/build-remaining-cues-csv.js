/* Builds data/cue_remaining.csv — every exercise placement whose cue was NOT
 * rewritten in the September 8, 2026 harmonisation.
 *
 * Sorted THINNEST CUE FIRST, deliberately. The complaint that started this work
 * was "the text description is not enough", and a 40-character cue is far more
 * likely to be the one an athlete bounced off than a 300-character one. Work
 * down the list and stop when it stops paying — this is not a list to finish.
 *
 * Usage: node automation/build-remaining-cues-csv.js <repo-root>
 */
const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||'.';
const rows=require(path.join(ROOT,'data/members_exercises.json'));
const signed=JSON.parse(fs.readFileSync(path.join(ROOT,'data/cue_harmonisation_signed.json'),'utf8')).cues;
const done=new Set();
for(const c of signed) for(const a of c.artifacts) done.add(a+'::'+c.name);

const left=rows.filter(r=>!done.has(r.artifact_slug+'::'+r.name))
  .map(r=>({...r, cue_chars:(r.cue||'').length}))
  .sort((a,b)=>a.cue_chars-b.cue_chars || a.artifact_slug.localeCompare(b.artifact_slug));

const esc=v=>{v=v==null?'':String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const H=['exercise_name','artifact','type','parent_exercise','tag','dose','cue_chars','current_cue','harmonized_cue'];
const out=[H.join(',')];
for(const r of left) out.push([
  r.name, r.artifact_slug, r.type, r.parent_exercise||'', r.tag||'',
  r.sets?r.sets+'×'+r.reps:(r.hold_s?r.hold_s+'s':(r.reps||'')),
  r.cue_chars, r.cue, ''
].map(esc).join(','));
fs.writeFileSync(path.join(ROOT,'data/cue_remaining.csv'),out.join('\n')+'\n');

const by={}; left.forEach(r=>by[r.artifact_slug]=(by[r.artifact_slug]||0)+1);
const variants=left.filter(r=>r.type==='variant').length;
const thin=left.filter(r=>r.cue_chars<120).length;
console.log('placements NOT harmonised :',left.length,'   (of',rows.length,'total)');
console.log('  of those, variants      :',variants,'— short by design, they say "same as above but…"');
console.log('  cues under 120 chars    :',thin);
console.log('  median cue length       :',left[Math.floor(left.length/2)].cue_chars,'chars');
console.log('\nby artifact:'); Object.entries(by).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('  '+String(v).padStart(3)+'  '+k));
console.log('\nthinnest 8 — the likeliest "not enough" complaints:');
left.slice(0,8).forEach(r=>console.log('  '+String(r.cue_chars).padStart(3)+' ['+r.artifact_slug+(r.type==='variant'?' VAR':'')+'] '+r.name));
