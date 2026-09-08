/* Members-area exercise inventory generator.
 *
 * Reads the nine ES artifact pages in site/members/<slug>/index.njk, evaluates
 * each page's inline data script in a stubbed DOM, and writes two CSVs:
 *   data/members_exercises.csv         one row per exercise per artifact (+variants)
 *   data/members_exercises_unique.csv  deduplicated by exercise name
 *
 * Why eval rather than parse: every page keeps its exercises in one JS object
 * literal (`const L = {...}`, exported as `{ build, library: L }`), so running
 * the page's own script is the only extraction that cannot drift from what the
 * athlete actually sees. The DOM tail of each script throws against the stub
 * and is deliberately swallowed — window.<X> is already assigned by then.
 *
 * EN/PT mirrors are intentionally not read: they are translations of these same
 * exercises, so the unique list would be identical.
 *
 * Usage: node automation/extract-members-exercises.js <repo-root>
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = process.argv[2];

const PAGES = [
  { slug: 'activacion',    title: 'Activación adaptativa' },
  { slug: 'core',          title: 'Core para el hotel' },
  { slug: 'movilidad',     title: 'Movilidad' },
  { slug: 'recuperacion',  title: 'Recuperación' },
  { slug: 'aquiles',       title: 'Aquiles' },
  { slug: 'rodillas',      title: 'Rodillas sin dolor' },
  { slug: 'hombro',        title: 'Hombro del nadador' },
  { slug: 'core-ciclista', title: 'Core del ciclista' },
  { slug: 'core-corredor', title: 'Core del corredor' },
];

function mkEl() {
  const el = {
    dataset: {}, style: {}, children: [], textContent: '', innerHTML: '',
    hidden: false, value: '',
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    addEventListener(){}, removeEventListener(){}, appendChild(){}, remove(){},
    setAttribute(){}, removeAttribute(){}, getAttribute(){ return null; },
    querySelector(){ return mkEl(); }, querySelectorAll(){ return []; },
    closest(){ return null; }, focus(){}, scrollIntoView(){},
  };
  return el;
}
const doc = {
  getElementById(){ return mkEl(); },
  querySelector(){ return mkEl(); },
  querySelectorAll(){ return []; },
  createElement(){ return mkEl(); },
  addEventListener(){}, body: mkEl(), head: mkEl(),
};

function scripts(src) {
  // Strip nunjucks tags/comments, then pull every inline <script> body.
  const clean = src.replace(/\{#-?[\s\S]*?-?#\}/g, '').replace(/\{%[\s\S]*?%\}/g, '');
  const out = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m; while ((m = re.exec(clean))) out.push(m[1]);
  return out;
}

const rows = [];

function push(o) { rows.push(o); }

function emit(page, engine, ex, opts) {
  opts = opts || {};
  push({
    artifact_slug: page.slug,
    artifact: page.title,
    engine,
    exercise_id: opts.parent ? (opts.id ? opts.id + '_v' + opts.vi : '') : (opts.id || ''),
    type: opts.parent ? 'variant' : 'main',
    parent_exercise: opts.parent || '',
    phase: opts.phase || '',
    name: ex.name || '',
    mode: ex.mode || '',
    tag: ex.tag || '',
    sets: ex.sets == null ? '' : ex.sets,
    reps: ex.reps == null ? '' : ex.reps,
    rest_s: ex.rest == null ? '' : ex.rest,
    hold_s: ex.secs == null ? '' : ex.secs,
    cue: (ex.cue || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    video: ex.video == null ? '' : ex.video,
    variant_count: Array.isArray(ex.variants) ? ex.variants.length : 0,
  });
}

for (const page of PAGES) {
  const file = path.join(ROOT, 'site/members', page.slug, 'index.njk');
  const src = fs.readFileSync(file, 'utf8');
  const win = {};
  const sandbox = { window: win, document: doc, console, setTimeout(){}, clearTimeout(){},
                    setInterval(){}, clearInterval(){}, navigator: { language: 'es' },
                    location: { href: '', hash: '' }, localStorage: { getItem(){return null;}, setItem(){} } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const code of scripts(src)) {
    try { vm.runInContext(code, sandbox, { timeout: 5000 }); } catch (e) { /* DOM tail may throw */ }
  }

  // Strength-engine pages export { build, library }
  let lib = null, engine = null;
  for (const k of Object.keys(win)) {
    const v = win[k];
    if (v && typeof v === 'object' && v.library && typeof v.library === 'object') { lib = v.library; break; }
  }
  const staticData = win.ACTIVATION_DATA;

  if (lib) {
    engine = /activacion|movilidad|recuperacion/.test(page.slug) ? 'activation' : 'strength';
    for (const [id, ex] of Object.entries(lib)) {
      if (!ex || typeof ex !== 'object' || !ex.name) continue;
      emit(page, engine, ex, { id });
      (ex.variants || []).forEach((v, i) => emit(page, engine, v, { id, vi: i + 1, parent: ex.name }));
    }
  } else if (staticData && staticData.phases) {
    engine = 'activation';
    staticData.phases.forEach((ph) => (ph.exercises || []).forEach((ex) => {
      emit(page, engine, ex, { phase: ph.name });
      (ex.variants || []).forEach((v, i) => emit(page, engine, v, { phase: ph.name, vi: i + 1, parent: ex.name }));
    }));
  } else {
    console.error('NO DATA FOUND: ' + page.slug);
  }
}




// Is the library id actually referenced by a routine? (definitions are `id: {`,
// references are always quoted string ids inside the routine arrays)
const srcCache={};
function refCount(slug,id){
  if(!id) return '';
  if(!srcCache[slug]) srcCache[slug]=fs.readFileSync(path.join(ROOT,'site/members',slug,'index.njk'),'utf8');
  const m=srcCache[slug].match(new RegExp('"'+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"','g'));
  return m?m.length:0;
}
rows.forEach(r=>{ r.routine_refs = r.type==='variant' ? '' : refCount(r.artifact_slug, r.exercise_id); });

function csv(headers, data){
  const esc=v=>{v=v==null?'':String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  return headers.join(',')+'\n'+data.map(d=>headers.map(h=>esc(d[h])).join(',')).join('\n')+'\n';
}

const H1=['artifact_slug','artifact','engine','exercise_id','type','parent_exercise','phase',
          'name','mode','tag','sets','reps','rest_s','hold_s','routine_refs','variant_count','video','cue'];
fs.writeFileSync(path.join(ROOT,'data/members_exercises.csv'), csv(H1, rows));
/* The intermediate the merge-map script reads. It lives in the repo on purpose:
 * an earlier version wrote it to a session scratch directory, which meant the
 * pipeline worked only inside the session that created it. */
fs.writeFileSync(path.join(ROOT,'data/members_exercises.json'), JSON.stringify(rows, null, 1));

// ---- uniques, keyed on normalised name ----
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
              .replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const U=new Map();
for(const r of rows){
  const k=norm(r.name);
  if(!U.has(k)) U.set(k,{name:r.name,_arts:new Set(),_types:new Set(),_modes:new Set(),
                         _tags:new Set(),_ids:new Set(),_engines:new Set(),occurrences:0,
                         sample_reps:'',sample_cue:'',longest:0});
  const u=U.get(k);
  u.occurrences++;
  u._arts.add(r.artifact); u._types.add(r.type);
  if(r.mode) u._modes.add(r.mode);
  if(r.tag) u._tags.add(r.tag);
  if(r.exercise_id) u._ids.add(r.exercise_id);
  u._engines.add(r.engine);
  if(!u.sample_reps && (r.reps||r.hold_s)) u.sample_reps = r.reps || (r.hold_s+'s');
  if((r.cue||'').length>u.longest){u.longest=r.cue.length;u.sample_cue=r.cue;}
}
const uniq=[...U.values()].map(u=>({
  name:u.name,
  artifact_count:u._arts.size,
  occurrences:u.occurrences,
  artifacts:[...u._arts].join(' | '),
  appears_as:[...u._types].sort().join('+'),
  engines:[...u._engines].join('+'),
  modes:[...u._modes].join('+'),
  equipment_tags:[...u._tags].join(' | '),
  exercise_ids:[...u._ids].join(' | '),
  sample_reps:u.sample_reps,
  sample_cue:u.sample_cue,
})).sort((a,b)=> b.artifact_count-a.artifact_count || b.occurrences-a.occurrences || a.name.localeCompare(b.name,'es'));

const H2=['name','artifact_count','occurrences','artifacts','appears_as','engines','modes',
          'equipment_tags','exercise_ids','sample_reps','sample_cue'];
fs.writeFileSync(path.join(ROOT,'data/members_exercises_unique.csv'), csv(H2, uniq));

console.log('rows:',rows.length,'unique:',uniq.length);
console.log('shared across >1 artifact:',uniq.filter(u=>u.artifact_count>1).length);
console.log('orphans (routine_refs=0):',rows.filter(r=>r.routine_refs===0).map(r=>r.artifact_slug+'/'+r.exercise_id+' — '+r.name).join('\n  '));
console.log('\nTop 15 by reuse:');
uniq.slice(0,15).forEach(u=>console.log('  '+u.artifact_count+'x '+u.name+'  ['+u.artifacts+']'));

/* ---- enrich the unique table with same-movement candidates ----------------
 * Library ids are page-local, so an id shared by two pages is evidence (not
 * proof) that two differently-named rows are the same movement and could share
 * one video. Flagged, never merged — "Plancha lateral dinámica" and "Plancha
 * lateral con elevación de pierna" share an id and are not the same exercise. */
{
  const mains = rows.filter(r => r.type === 'main' && r.exercise_id);
  const byId = {};
  mains.forEach(r => (byId[r.exercise_id] = byId[r.exercise_id] || []).push(r));
  const alias = {};
  Object.values(byId).forEach(rs => {
    const names = [...new Set(rs.map(x => x.name))];
    if (names.length > 1) names.forEach(n => {
      alias[norm(n)] = [...new Set([...(alias[norm(n)] || []), ...names.filter(x => x !== n)])];
    });
  });
  uniq.forEach(u => { u.possible_same_as = (alias[norm(u.name)] || []).join(' | '); });
  const H2b = ['name','artifact_count','occurrences','artifacts','appears_as','engines','modes',
               'equipment_tags','exercise_ids','possible_same_as','sample_reps','sample_cue'];
  fs.writeFileSync(path.join(ROOT, 'data/members_exercises_unique.csv'), csv(H2b, uniq));
  console.log('\nunique rows with a same-movement candidate:', uniq.filter(u => u.possible_same_as).length);
}
