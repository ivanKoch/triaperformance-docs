const fs=require('fs'),path=require('path');
const rows=require(process.env.HOME+'/work/exercises.json');
const ROOT=process.argv[2];
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const STOP=new Set(['de','del','la','el','en','con','y','a','al','los','las','un','una','sin','por','para','the','of']);
const toks=s=>new Set(norm(s).split(' ').filter(w=>w&&!STOP.has(w)));
const tri=s=>{const t=norm(s),o=new Set();for(let i=0;i<t.length-2;i++)o.add(t.slice(i,i+3));return o;};
const jac=(a,b)=>{if(!a.size||!b.size)return 0;let i=0;for(const x of a)if(b.has(x))i++;return i/(a.size+b.size-i);};

const seen=new Map();
for(const r of rows){const k=r.artifact_slug+'::'+norm(r.name)+'::'+r.type;
  if(!seen.has(k)) seen.set(k,{...r,_n:toks(r.name),_c:tri(r.cue)});}
const items=[...seen.values()];

function tier(a,b){
  if(a.artifact_slug===b.artifact_slug) return null;
  const nameEq=norm(a.name)===norm(b.name), sameId=a.exercise_id&&a.exercise_id===b.exercise_id;
  const ns=jac(a._n,b._n), cs=jac(a._c,b._c);
  if(nameEq) return {t:'A',why:'identical name'};
  if(cs>=0.60 || (ns>=0.60&&cs>=0.50) || (sameId&&cs>=0.55)) return {t:'B',why:`name~${ns.toFixed(2)} cue~${cs.toFixed(2)}${sameId?' same-id':''}`};
  if(cs>=0.45 || ns>=0.55 || sameId) return {t:'C',why:`name~${ns.toFixed(2)} cue~${cs.toFixed(2)}${sameId?' same-id':''}`};
  return null;
}

// Union-find over tier A+B only. Tier C is listed for judgement, never auto-joined.
/* Merges no string comparison can find: same movement, unrelated names. All
 * three live in core/, the only page whose exercises were written independently
 * rather than copied from another library — which is the whole argument for a
 * shared library, so they are seeded by hand rather than by lowering a threshold. */
const MANUAL=[
  ['core::gato vaca','activacion::gato camello'],
  ['core::world s greatest stretch','activacion::el mejor estiramiento del mundo'],
  ['core::couch stretch con la cama','rodillas::couch stretch'],
];
const par=items.map((_,i)=>i); const find=x=>par[x]===x?x:(par[x]=find(par[x])); const uni=(a,b)=>{par[find(a)]=find(b);};
const edges=[];
const keyOf=x=>x.artifact_slug+'::'+norm(x.name);
MANUAL.forEach(([x,y])=>{
  const i=items.findIndex(it=>keyOf(it)===x), j=items.findIndex(it=>keyOf(it)===y);
  if(i<0||j<0){ console.error('MANUAL MERGE MISS: '+x+' / '+y); return; }
  edges.push({i,j,t:'A',why:'manual — same movement, unrelated names'});
  uni(i,j);
});
for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  const t=tier(items[i],items[j]); if(!t) continue;
  edges.push({i,j,...t}); if(t.t!=='C') uni(i,j);
}
const groups=new Map();
items.forEach((it,i)=>{const r=find(i); if(!groups.has(r))groups.set(r,[]); groups.get(r).push(it);});
const multi=[...groups.values()].filter(g=>g.length>1)
  .sort((a,b)=>b.length-a.length);

const merged=items.length-[...groups.values()].reduce((n,g)=>n+(g.length-1),0);
console.log('distinct (artifact,name) records :', items.length);
console.log('clusters after A+B merge         :', groups.size);
console.log('records removed by merging       :', items.length-groups.size);
console.log('multi-member clusters            :', multi.length);
console.log('tier C pairs still to judge      :', edges.filter(e=>e.t==='C').length);

let out='# Duplicate review — members-area exercise library\n\n';
out+=`Generated ${new Date().toISOString().slice(0,10)} by \`automation/extract-members-exercises.js\` + the clustering pass.\n\n`;
out+=`**${items.length} distinct (artifact, exercise) records → ${groups.size} candidate canonical exercises.**\n`;
out+=`Tier A = identical name in two or more artifacts (safe to merge). Tier B = different name, cue text says it is the same movement. Tier C = weaker evidence, listed separately and never auto-merged.\n\n`;
out+='## Tier A + B clusters — proposed canonical exercises\n\n';
multi.forEach((g,n)=>{
  const a=g.find(x=>x.type==='main')||g[0];
  out+=`### ${n+1}. ${a.name}  *(${g.length} copies)*\n\n`;
  out+='| artifact | id | name as written | mode | tag |\n|---|---|---|---|---|\n';
  g.forEach(x=>{out+=`| ${x.artifact_slug} | ${x.exercise_id||'—'} | ${x.name} | ${x.mode||''} | ${x.tag||''} |\n`;});
  out+='\n<details><summary>cues</summary>\n\n';
  g.forEach(x=>{out+=`- **${x.artifact_slug}** — ${x.cue}\n`;});
  out+='\n</details>\n\n';
});
out+='## Tier C — different names, weak evidence. Judge each.\n\n';
edges.filter(e=>e.t==='C').filter(e=>find(e.i)!==find(e.j)).forEach((e,n)=>{
  const a=items[e.i],b=items[e.j];
  out+=`**C${n+1}.** \`${e.why}\`\n\n`;
  out+=`- **${a.artifact_slug} · ${a.name}** — ${a.cue.slice(0,200)}\n`;
  out+=`- **${b.artifact_slug} · ${b.name}** — ${b.cue.slice(0,200)}\n\n`;
});
fs.writeFileSync(path.join(ROOT,'members-exercise-dedup-review.md'),out);
console.log('\nwrote members-exercise-dedup-review.md');
console.log('\nClusters of 3+:');
multi.filter(g=>g.length>=3).forEach(g=>console.log('  '+g.length+'x '+(g.find(x=>x.type==='main')||g[0]).name+' — '+[...new Set(g.map(x=>x.name))].join(' / ')));
