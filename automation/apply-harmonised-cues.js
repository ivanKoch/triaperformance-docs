/* Applies data/cue_harmonisation_signed.json to the nine SPANISH artifact pages.
 *
 * Iván wrote every cue; the <strong> emphasis was added by Claude on the single
 * clause each hinges on, because 77 of the 87 placements being rewritten already
 * carried bold and losing it would have flattened the most-used exercises in the
 * library next to the ~160 untouched ones.
 *
 * ⚠️ SPANISH ONLY. EN and PT still carry their old, unharmonised cues. That is a
 * known and accepted state, not an oversight — see open-loops.md NEXT #15. No
 * athlete reads two languages, so each language stays internally coherent; the
 * cost is maintenance, and it is paid when the branch runs.
 *
 * Usage: node automation/apply-harmonised-cues.js <root> [--dry]
 */
const fs=require('fs'),path=require('path');
const ROOT=process.argv[2]||'.', DRY=process.argv.includes('--dry');
const D=JSON.parse(fs.readFileSync(path.join(ROOT,'data/cue_harmonisation_signed.json'),'utf8'));
let applied=0, missing=[];
const byFile={};
for(const c of D.cues) for(const a of c.artifacts) (byFile[a]=byFile[a]||[]).push(c);
for(const [slug,entries] of Object.entries(byFile)){
  const file=path.join(ROOT,'site/members',slug,'index.njk');
  let s=fs.readFileSync(file,'utf8');
  for(const c of entries){
    const needle='name: "'+c.name+'"';
    const i=s.indexOf(needle);
    if(i<0){missing.push(slug+' / '+c.name+' (name not on page)');continue}
    const j=s.indexOf('cue: "', i);
    if(j<0 || j-i>500){missing.push(slug+' / '+c.name+' (no cue within 500 chars of the name)');continue}
    let e=j+6;
    while(e<s.length && !(s[e]==='"' && s[e-1]!=='\\')) e++;
    if(e>=s.length){missing.push(slug+' / '+c.name+' (unterminated cue)');continue}
    s=s.slice(0,j+6)+c.cue+s.slice(e);
    applied++;
  }
  if(!DRY) fs.writeFileSync(file,s);
}
console.log((DRY?'[dry] ':'')+'cues applied: '+applied);
if(missing.length){console.error('\n✗ NOT APPLIED:');missing.forEach(m=>console.error('   '+m));process.exit(1)}
