/* Shared helper: exercise names in library order for one artifact page.
 * Used by apply-remaining-cues.js. Evaluating the page is the only way to get
 * library ORDER — the activation pages also carry `name:` on routine phase
 * labels ("Suelo", "De pie"), which are not exercises and would corrupt any
 * purely textual index. */
const fs=require('fs'),vm=require('vm');
const mkEl=()=>({dataset:{},style:{},children:[],textContent:'',innerHTML:'',hidden:false,value:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},removeEventListener(){},appendChild(){},remove(){},setAttribute(){},removeAttribute(){},getAttribute(){return null},querySelector(){return mkEl()},querySelectorAll(){return[]},closest(){return null},focus(){},scrollIntoView(){}});
const doc={getElementById:()=>mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],createElement:()=>mkEl(),addEventListener(){},body:mkEl(),head:mkEl()};
module.exports=function(file){
  const src=fs.readFileSync(file,'utf8').replace(/\{#-?[\s\S]*?-?#\}/g,'').replace(/\{%[\s\S]*?%\}/g,'');
  const win={};const sb={window:win,document:doc,console:{log(){},error(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},navigator:{language:'es'},location:{href:'',hash:''},localStorage:{getItem:()=>null,setItem(){}}};
  sb.globalThis=sb;vm.createContext(sb);
  const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;let m;
  while((m=re.exec(src))){try{vm.runInContext(m[1],sb,{timeout:5000})}catch(e){}}
  const out=[];const add=e=>{if(e&&e.name){out.push(e.name);(e.variants||[]).forEach(add)}};
  for(const k of Object.keys(win)){const o=win[k];if(o&&typeof o==='object'&&o.library){Object.values(o.library).forEach(add);return out}}
  if(win.ACTIVATION_DATA&&win.ACTIVATION_DATA.phases){win.ACTIVATION_DATA.phases.forEach(p=>(p.exercises||[]).forEach(add));return out}
  return out;
};
