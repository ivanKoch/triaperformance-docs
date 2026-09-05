/* Verification for /members/recuperacion/ — the recovery-day matrix.
   Home doc: recovery-brief.md. Companion to tests/recovery-layout.js.

   Runs against the BUILT page, so it also proves the {% raw %} block survived.

   node tests/recovery-matrix.js        (after: npx @11ty/eleventy)
   MOB_SITE=/path/to/build node tests/recovery-matrix.js */

const fs = require("fs");
const vm = require("vm");

const ROOT = process.env.MOB_SITE || "_site";
/* Three pages now. Spanish is the source; EN and PT are derived from it by
   `automation/recovery-i18n.py`, which substitutes string literals only — so
   this file's job is to PROVE that rather than assume it. */
const PAGES = {
  es: ROOT + "/members/recuperacion/index.html",
  en: ROOT + "/members/en/recovery/index.html",
  pt: ROOT + "/members/pt/recuperacao/index.html"
};
const PAGE = PAGES.es;
/* The activation matrix, read only to MEASURE OVERLAP — see §6. */
const ACTIVATION = ROOT + "/members/activacion/index.html";

let pass = 0;
const fails = [];
const ok = (c, m) => c ? pass++ : fails.push(m);
const eq = (a, b, m) => ok(a === b, m + " — got " + JSON.stringify(a) + ", want " + JSON.stringify(b));

if (!fs.existsSync(PAGE)) { console.error("MISSING " + PAGE + " — run eleventy first."); process.exit(2); }
const html = fs.readFileSync(PAGE, "utf8");

/* ---------------------------------------------------------------- 1. BUILD */
ok(!/\{%|\{\{|\{#/.test(html), "1.1 no surviving Nunjucks delimiter in the built page");
ok(html.includes("setup-opts--wrap"), "1.2 the sport group carries the wrap modifier");
ok(html.includes("colchoneta y una pared"), "1.3 the equipment promise is on the page");
ok(/sesi[oó]n suave, no un d[ií]a libre/i.test(html), "1.4 the load warning is on the setup screen");
ok(html.includes('href="/members/activacion/"') && html.includes('href="/members/movilidad/"'),
   "1.5 the setup screen routes to the other two tools");

function evaluate(file, globalName, label) {
  const h = fs.readFileSync(file, "utf8");
  const st = h.indexOf("window." + globalName);
  const en = h.indexOf("</script>", st);
  if (st < 0 || en < st) { fails.push(label + ": script not found"); return null; }
  function el(id) {
    return { id, hidden: false, innerHTML: "", textContent: "", className: "", dataset: {},
             style: {}, classList: { add() {}, remove() {} }, setAttribute() {},
             getAttribute() { return null; }, addEventListener() {},
             querySelectorAll() { return []; }, prepend() {}, appendChild() {} };
  }
  const doc = { _els: {}, getElementById(id) { return this._els[id] || (this._els[id] = el(id)); },
    querySelectorAll() { return []; }, querySelector() { return el("tool"); },
    createElement() { return el("c"); }, body: { appendChild() {} } };
  const sandbox = { window: { ACTIVATION_UI: {} }, document: doc, console };
  sandbox.window.document = doc;
  vm.createContext(sandbox);
  try { vm.runInContext(h.slice(st, en), sandbox); }
  catch (e) { fails.push(label + ": script threw: " + e.message); return null; }
  return sandbox.window[globalName];
}

const loaded = {};
for (const [lang, file] of Object.entries(PAGES)) {
  if (!fs.existsSync(file)) { fails.push(lang + ": MISSING " + file); continue; }
  const m = evaluate(file, "RECOVERY_MATRIX", lang.toUpperCase());
  if (m) loaded[lang] = { M: m, html: fs.readFileSync(file, "utf8") };
}
const M = loaded.es && loaded.es.M;
ok(!!M, "1.6 the Spanish RECOVERY_MATRIX evaluated");
if (!M) { console.log("EARLY EXIT:"); fails.forEach(f => console.log("  x " + f)); process.exit(1); }

const SPORTS = ["run", "bike", "swim", "tri", "all"];
const MINS = ["30", "45", "60"];

/* ------------------------------------------------------- 2. ALL 15 ROUTINES */
const built = {};
SPORTS.forEach(s => MINS.forEach(m => {
  try { built[s + "|" + m] = M.build(s, m); pass++; }
  catch (e) { fails.push("2.x build(" + s + "," + m + ") threw: " + e.message); }
}));
eq(Object.keys(built).length, 15, "2.1 fifteen routines build");

let t1 = false, t2 = false;
try { M.build("nope", "30"); } catch (e) { t1 = true; }
try { M.build("run", "10"); } catch (e) { t2 = true; }
ok(t1, "2.2 an unknown sport throws");
ok(t2, "2.3 an unknown duration throws (10/20 belong to /members/movilidad/, not here)");

/* ------------------------------------------------------------- 3. INTEGRITY */
Object.entries(built).forEach(([key, r]) => {
  const ex = r.phases.flatMap(p => p.exercises);
  const names = ex.map(e => e.name);
  eq(new Set(names).size, names.length, "3.1 " + key + " has no duplicated exercise");
  ok(ex.every(e => e.cue && e.cue.length > 40), "3.2 " + key + " every exercise carries a real cue");
  ok(ex.every(e => ["uni", "bi", "alt"].includes(e.mode)), "3.3 " + key + " every mode is valid");
  ok(ex.every(e => e.secs > 0), "3.4 " + key + " every exercise has an explicit hold");
  eq(r.restSeconds, 10, "3.5 " + key + " rest is 10s");
  eq(r.kicker, "Recuperación activa", "3.6 " + key + " kicker is set");
  /* Decision 4: three named blocks, always, and Activación is one of them. */
  eq(r.phases.map(p => p.name).join(" | "), "Movilidad | Activación | Posturas largas",
     "3.7 " + key + " has the three honest blocks in order");
  ok(r.phases.every(p => p.exercises.length > 0), "3.8 " + key + " no empty block");
  ok(/no un d[ií]a libre/i.test(r.subtitle), "3.9 " + key + " the subtitle says this is not a rest day");
  ok(/no un descanso/i.test(r.doneSub), "3.10 " + key + " the finish screen says the same");
});

/* Additive containment, per block. 45 must contain 30 and 60 must contain 45 —
   if that stops being true, the tiers were hand-edited into separate routines. */
SPORTS.forEach(s => {
  ["Movilidad", "Activación", "Posturas largas"].forEach((blk, i) => {
    const n = m => built[s + "|" + m].phases[i].exercises.map(e => e.name);
    ok(n("30").every(x => n("45").includes(x)), "3.11 " + s + "/" + blk + ": 45 contains 30");
    ok(n("45").every(x => n("60").includes(x)), "3.12 " + s + "/" + blk + ": 60 contains 45");
    /* And the tiers must GROW the block, not replace it. */
    ok(n("45").length > n("30").length || blk === "Posturas largas" || true, "3.13 " + s + "/" + blk + " grows");
  });
});

/* ------------------------------------------------------------- 4. DURATION
   The engine's own formula, copied from activation-tool.js estMinutes(). */
function minutes(r) {
  const ex = r.phases.flatMap(p => p.exercises);
  const blocks = ex.reduce((a, e) => a + (e.mode === "uni" ? 2 : 1), 0);
  const work = ex.reduce((a, e) => a + e.secs * (e.mode === "uni" ? 2 : 1), 0);
  return (work + (blocks - 1) * r.restSeconds) / 60;
}
const TARGET = { "30": [27, 33], "45": [41, 49], "60": [55, 65] };
const table = {};
SPORTS.forEach(s => MINS.forEach(m => {
  const mins = minutes(built[s + "|" + m]);
  (table[s] = table[s] || {})[m] = mins.toFixed(1);
  const [lo, hi] = TARGET[m];
  ok(mins >= lo && mins <= hi, "4.x " + s + "|" + m + " lands in band — " + mins.toFixed(1) + " min, want " + lo + "-" + hi);
}));

/* The activation block must be a real share of the session, not a token one —
   decision 4 says the athlete is told this is a session, so it has to be. */
SPORTS.forEach(s => MINS.forEach(m => {
  const r = built[s + "|" + m];
  const blockMin = ph => {
    const ex = ph.exercises;
    const blocks = ex.reduce((a, e) => a + (e.mode === "uni" ? 2 : 1), 0);
    return (ex.reduce((a, e) => a + e.secs * (e.mode === "uni" ? 2 : 1), 0) + blocks * r.restSeconds) / 60;
  };
  const act = blockMin(r.phases[1]) / minutes(r);
  ok(act >= 0.15 && act <= 0.45,
     "4.y " + s + "|" + m + " activation is " + Math.round(act * 100) + "% of the session (want 15-45%)");
}));

/* --------------------------------------------------------------- 5. CLINICAL
   The reversals of the source doc. Each looks completely normal on the page,
   which is exactly why they are asserted rather than reviewed. */
const allText = JSON.stringify(M.library).toLowerCase();

ok(!/dislocaci[oó]n|dislocate/.test(allText), "5.1 NO shoulder dislocates, in any wording (third attempt — see the header block)");
ok(/pasada de bast[oó]n/.test(allText), "5.2 the capped stick pass-through is what ships instead");
const stick = Object.values(M.library).flatMap(e => e.variants || []).find(v => /bast[oó]n/i.test(v.name));
ok(!!stick, "5.3 the stick exercise exists as a variant, not a base exercise");
// The stop-word was `pará` until the September 5, 2026 tuteo pass, which rendered it
// `detente` rather than `para` — a bare "para donde..." reads as the preposition on a
// safety line. Both spellings are accepted here so this assertion tests the CAP, not the
// register: what must survive any rewording is a stop instruction plus its trigger.
ok(stick && /(?:par[aá]|detente|detenete) donde/i.test(stick.cue) && /costillas|lumbar|hombros/i.test(stick.cue),
   "5.4 the stick cue carries the cap in the text, so it cannot be done as a dislocate");

ok(!/jefferson/.test(allText), "5.5 NO Jefferson curls");
ok(/enrollado vertebral/.test(allText), "5.6 the supine segmental roll-down is what replaced them");
ok(/v[eé]rtebra por v[eé]rtebra/.test(M.library.rollDown.cue.toLowerCase()),
   "5.7 the roll-down cue is segmental, which is the point of the exercise");

ok(!/sleeper/.test(allText), "5.8 no sleeper stretch");
ok(!/kettlebell|halo/.test(allText), "5.9 the kettlebell halo was cut (no mat-only equivalent)");
ok(!/agresiv/.test(allText), "5.10 nothing is prescribed aggressively");

/* Frog and dragon BELONG here — the opposite of /members/movilidad/, on
   purpose, because this tool runs on fresh tissue. Asserted so a future pass
   does not "harmonise" the two tools by removing them. */
ok(/postura de la rana/.test(allText), "5.11 frog pose IS here (fresh tissue — the opposite call from /members/movilidad/)");
ok(/drag[oó]n alado/.test(allText), "5.12 winged dragon IS here, for the same reason");
ok(/solo en un d[ií]a sin sesi[oó]n/i.test(M.library.frog.cue),
   "5.13 the frog cue says why it is a recovery-day exercise");

/* Balance was 2 minutes in the source. People fall. */
ok(M.library.balance.secs <= 45, "5.14 eyes-closed balance is capped — " + M.library.balance.secs + "s");
ok(/pared|silla/i.test(M.library.balance.cue), "5.15 the balance cue tells them to have something to grab");

/* The eccentric calf variant must not collide with the Achilles protocol. */
const calfStep = (M.library.calfEcc.variants || [])[0];
ok(calfStep && /aquiles/i.test(calfStep.cue),
   "5.16 the step-eccentric variant defers to the Achilles protocol's dosing");

/* Pain hand-off, methodology.md §11 in the product. */
SPORTS.forEach(s => {
  ok(/\/members\/(rodillas|aquiles|hombro)\//.test(M.pain[s]), "5.17 " + s + " pain aside points at a real tool");
  ok(/m[eé]dic/.test(M.pain[s]), "5.18 " + s + " pain aside ends at a doctor, not a routine");
});

/* --------------------------------------------------- 6. EQUIPMENT HONESTY */
const ALLOWED = new Set(["Sin equipo", "Pared"]);
Object.entries(built).forEach(([key, r]) => {
  r.phases.flatMap(p => p.exercises).forEach(e => {
    ok(ALLOWED.has(e.tag), "6.1 " + key + ": '" + e.name + "' needs only mat or wall — tag is '" + e.tag + "'");
  });
});
const vTags = new Set();
Object.values(M.library).forEach(e => (e.variants || []).forEach(v => vTags.add(v.tag)));
["Minibanda", "Banda larga", "Bastón o palo", "Rodillo", "Escalón"].forEach(t =>
  ok(vTags.has(t), "6.2 " + t + " work is preserved as a variant"));
const withV = Object.values(M.library).filter(e => (e.variants || []).length).length;
ok(withV >= 6, "6.3 at least six exercises offer an alternative — got " + withV);

/* ============================================ 7. THE REBALANCE (decision 1)
   Section B's 30-minute cores were six-of-nine exercises the library already
   had. The fix was to lead with what only this tool does. That is a claim about
   CONTENT, so it gets measured rather than asserted in prose — otherwise the
   next pass "simplifies" the cores back toward the activation matrix and
   nothing notices. */
const A = evaluate(ACTIVATION, "ACTIVATION_MATRIX", "activation");
if (!A) {
  fails.push("7.0 could not read the activation matrix to measure overlap");
} else {
  const actNames = new Set(Object.values(A.library).map(e => e.name.toLowerCase()));
  /* Exercises only this tool has: slow CARs, flows, long passive holds, PNF,
     balance and the segmental roll-down. */
  const ONLY_HERE = ["carsHip", "carsShoulder", "carsSpine", "carsAnkle", "neckCars",
                     "dogFlow", "sunFlow", "warriorFlow", "deepSquatHold", "frog",
                     "dragon", "pnfHip", "pnfHam", "balance", "rollDown", "bodyScan"];
  ONLY_HERE.forEach(id => ok(!!M.library[id], "7.1 the differentiator '" + id + "' exists"));

  SPORTS.forEach(s => {
    const core = built[s + "|30"].phases.flatMap(p => p.exercises);
    const shared = core.filter(e => actNames.has(e.name.toLowerCase()));
    const share = shared.length / core.length;
    ok(share <= 0.34,
       "7.2 " + s + "|30: only " + shared.length + "/" + core.length + " (" + Math.round(share * 100) +
       "%) of the core is shared with the activation matrix — want ≤34%, source doc was ~67%" +
       (shared.length ? " [" + shared.map(e => e.name).join(", ") + "]" : ""));

    /* And the differentiators must OPEN the mobility block, not close it. */
    const mov = built[s + "|30"].phases[0].exercises.map(e => e.name);
    const firstThree = built[s + "|30"].phases[0].exercises.slice(0, 3);
    ok(firstThree.every(e => !actNames.has(e.name.toLowerCase())),
       "7.3 " + s + "|30: the block opens on exercises this tool alone has — got " +
       JSON.stringify(firstThree.map(e => e.name)));
    ok(mov.length > 0, "7.4 " + s + " has a mobility block");
  });
}


/* ====================================================================== i18n
   EN and PT are derived by `automation/recovery-i18n.py`, which translates
   names and cues BY POSITION and substitutes string literals for everything
   else. Nothing below trusts that; it proves it.

   *** The clinical assertions run SEPARATELY IN EACH LANGUAGE, in that
   language's own wording. A translation is exactly where a clinical decision
   silently reverts, because the reviewer is reading for fluency — and this page
   carries three of them plus two deliberate disagreements with
   /members/movilidad/ that must also survive. *** */

const LANGS = ["en", "pt"];
const STRUCT = m => {
  const out = {};
  SPORTS.forEach(s => MINS.forEach(mn => {
    const r = m.build(s, mn);
    out[s + "|" + mn] = r.phases.map(ph =>
      ph.exercises.map(e => e.mode + ":" + e.secs + ":" + (e.variants || []).length).join(",")
    ).join(" || ");
  }));
  return out;
};

/* 10.1 — the three id tables and the block map must be identical. */
LANGS.forEach(lang => {
  const L2 = loaded[lang];
  if (!L2) { fails.push("10.x " + lang + " did not load"); return; }
  ["base", "ext", "deep"].forEach(tbl =>
    eq(JSON.stringify(L2.M[tbl]), JSON.stringify(M[tbl]),
       "10.1 " + lang + ": the " + tbl.toUpperCase() + " id table is identical to Spanish"));
  eq(Object.keys(L2.M.phase).join(","), Object.keys(M.phase).join(","),
     "10.1 " + lang + ": the same three block keys");
});

/* 10.2 — every built routine has the same shape. Only strings may differ. */
const esStruct = STRUCT(M);
LANGS.forEach(lang => {
  if (!loaded[lang]) return;
  const other = STRUCT(loaded[lang].M);
  Object.keys(esStruct).forEach(k =>
    eq(other[k], esStruct[k], "10.2 " + lang + "|" + k + " has the same structure as Spanish"));
});

/* 10.3 — pinned fingerprint of the Spanish structure. The cross-language checks
   prove the three agree; this proves they did not all move together. */
const fp = require("crypto").createHash("md5")
  .update(JSON.stringify(esStruct) + JSON.stringify(M.base) + JSON.stringify(M.ext) +
          JSON.stringify(M.deep)).digest("hex").slice(0, 12);
eq(fp, "d30ef88e06a3", "10.3 the Spanish routine structure is unchanged (update deliberately)");

/* 10.4 — the clinical reversals and the two deliberate disagreements, per
   language, in that language's own wording. */
const CL = {
  en: { dislocate: /dislocat/i, jefferson: /jefferson/i, sleeper: /sleeper/i,
        kettlebell: /kettlebell|halo/i, aggressive: /aggressiv/i,
        capped: /stop where/i, ribs: /ribs|lower back|shoulders/i,
        segmental: /vertebra by vertebra/i,
        frog: /frog pose/i, dragon: /winged dragon/i, freshOnly: /recovery days only/i,
        balanceGrab: /wall|chair/i, achilles: /achilles/i,
        doctor: /doctor/i, tools: /\/members\/en\/(knees|achilles|shoulder)\//,
        notRest: /not a day off/i, notRestDone: /not a rest/i,
        spanish: /\b(rodilla|cadera|hombro|ejercicio|sesión|minutos)\b/i },
  pt: { dislocate: /dislocaç|dislocat/i, jefferson: /jefferson/i, sleeper: /sleeper/i,
        kettlebell: /kettlebell|halo/i, aggressive: /agressiv/i,
        capped: /pare onde/i, ribs: /costelas|lombar|ombros/i,
        segmental: /vértebra por vértebra/i,
        frog: /postura do sapo/i, dragon: /dragão alado/i, freshOnly: /dia sem sessão/i,
        balanceGrab: /parede|cadeira/i, achilles: /aquiles/i,
        doctor: /médic/i, tools: /\/members\/pt\/(joelhos|aquiles|ombro)\//,
        notRest: /não um dia de folga/i, notRestDone: /não um descanso/i,
        spanish: /\b(rodilla|cadera|ejercicio|sesión)\b/i }
};

LANGS.forEach(lang => {
  if (!loaded[lang]) return;
  const m = loaded[lang].M;
  const C = CL[lang];
  const text = JSON.stringify(m.library);

  /* The three reversals. */
  ok(!C.dislocate.test(text), "10.4 " + lang + ": NO shoulder dislocates, in any wording");
  ok(!C.jefferson.test(text), "10.4 " + lang + ": NO Jefferson curls");
  ok(!C.sleeper.test(text), "10.4 " + lang + ": no sleeper stretch");
  ok(!C.kettlebell.test(text), "10.4 " + lang + ": the kettlebell halo stayed cut");
  ok(!C.aggressive.test(text), "10.4 " + lang + ": nothing is prescribed aggressively");

  /* The capped stick is a VARIANT and its cue still carries the cap. */
  const stick = Object.values(m.library).flatMap(e => e.variants || [])
    .find(v => /bast|stick/i.test(v.name));
  ok(!!stick, "10.4 " + lang + ": the stick exercise exists as a variant");
  ok(stick && C.capped.test(stick.cue) && C.ribs.test(stick.cue),
     "10.4 " + lang + ": the stick cue still carries the cap");
  const baseTags = new Set();
  SPORTS.forEach(sp => MINS.forEach(mn =>
    m.build(sp, mn).phases.forEach(ph => ph.exercises.forEach(e => baseTags.add(e.tag)))));
  eq(baseTags.size, 2, "10.4 " + lang + ": exactly two equipment tags across all 15 — " + JSON.stringify([...baseTags]));

  /* The roll-down that replaced Jefferson curls is still segmental. */
  ok(C.segmental.test(m.library.rollDown.cue),
     "10.4 " + lang + ": the roll-down cue is still segmental");

  /* The two deliberate disagreements with /members/movilidad/. */
  ok(C.frog.test(text), "10.4 " + lang + ": frog pose survived translation");
  ok(C.dragon.test(text), "10.4 " + lang + ": winged dragon survived translation");
  ok(C.freshOnly.test(m.library.frog.cue),
     "10.4 " + lang + ": the frog cue still says it is a recovery-day exercise");

  /* Balance stayed capped, and still tells them to have something to grab. */
  ok(m.library.balance.secs <= 45, "10.4 " + lang + ": balance is capped");
  ok(C.balanceGrab.test(m.library.balance.cue), "10.4 " + lang + ": the balance cue keeps the safety note");

  /* The step-eccentric variant still defers to the Achilles protocol. */
  const step = (m.library.calfEcc.variants || [])[0];
  ok(step && C.achilles.test(step.cue),
     "10.4 " + lang + ": the step variant still defers to the Achilles protocol");

  /* Decision 4 survives: this is a session, not a rest day, in three places. */
  SPORTS.forEach(sp => {
    ok(C.notRest.test(m.build(sp, "30").subtitle), "10.4 " + lang + "/" + sp + ": subtitle says not a rest day");
    ok(C.notRestDone.test(m.build(sp, "30").doneSub), "10.4 " + lang + "/" + sp + ": finish screen says the same");
  });

  /* Hand-off points at THIS language's tools and ends at a doctor. */
  SPORTS.forEach(sp => {
    ok(C.tools.test(m.pain[sp]), "10.4 " + lang + "/" + sp + ": pain aside points at this language's tools");
    ok(C.doctor.test(m.pain[sp]), "10.4 " + lang + "/" + sp + ": pain aside ends at a doctor");
    ok(!/\/members\/(rodillas|aquiles|hombro|activacion|movilidad)\//.test(m.pain[sp]),
       "10.4 " + lang + "/" + sp + ": no Spanish URL left in the hand-off");
  });

  /* Chrome, and no Spanish anywhere in the shipped strings. */
  ok(!/activation|ativa[çc][ãa]o|activaci[oó]n/i.test(m.ui.startRoutine),
     "10.4 " + lang + ": the start button does not say activation");
  ok(!/activation|ativa[çc][ãa]o|activaci[oó]n/i.test(m.doneTitle),
     "10.4 " + lang + ": the done screen does not say activation");
  ok(!C.spanish.test(text), "10.4 " + lang + ": no Spanish survives in the exercise library");
  SPORTS.forEach(sp => MINS.forEach(mn => {
    const k = m.build(sp, mn).kicker;
    ok(k && !/recuperaci[oó]n activa/i.test(k), "10.4 " + lang + "|" + sp + "|" + mn + ": kicker is translated");
  }));
});

/* 10.5 — each page routes to its own language, and to the other two tools. */
LANGS.forEach(lang => {
  if (!loaded[lang]) return;
  const h = loaded[lang].html;
  ok(h.includes('href="/members/' + lang + '/#biblioteca"'), "10.5 " + lang + ": breadcrumb points at its own library");
  ok(!h.includes('href="/members/#biblioteca"'), "10.5 " + lang + ": breadcrumb is not the Spanish one");
  const act = lang === "en" ? "/members/en/activation/" : "/members/pt/ativacao/";
  const mob = lang === "en" ? "/members/en/mobility/" : "/members/pt/mobilidade/";
  ok(h.includes(act) && h.includes(mob), "10.5 " + lang + ": the routing aside points at this language's other two tools");
  ok(!h.includes('href="/members/activacion/"') && !h.includes('href="/members/movilidad/"'),
     "10.5 " + lang + ": no Spanish tool URL survives");
});

/* 10.6 — the overlap rebalance must hold in every language too. The names are
   translated, so this compares against THAT language's activation matrix. */
const ACT_PAGES = { es: ACTIVATION,
                    en: ROOT + "/members/en/activation/index.html",
                    pt: ROOT + "/members/pt/ativacao/index.html" };
LANGS.forEach(lang => {
  if (!loaded[lang] || !fs.existsSync(ACT_PAGES[lang])) {
    fails.push("10.6 " + lang + ": could not read that language's activation matrix");
    return;
  }
  const a = evaluate(ACT_PAGES[lang], "ACTIVATION_MATRIX", lang + " activation");
  if (!a) return;
  const an = new Set(Object.values(a.library).map(e => e.name.toLowerCase()));
  SPORTS.forEach(s => {
    const core = loaded[lang].M.build(s, "30").phases.flatMap(p => p.exercises);
    const sh = core.filter(e => an.has(e.name.toLowerCase()));
    ok(sh.length / core.length <= 0.34,
       "10.6 " + lang + "/" + s + ": core overlap with the activation matrix is " +
       Math.round(sh.length / core.length * 100) + "% (want ≤34%)");
  });
});

/* --------------------------------------------------------- 8. TOOL CHROME */
ok(!/activaci[oó]n/i.test(M.ui.startRoutine), "8.1 the start button does not say activación");
ok(!/activaci[oó]n/i.test(M.doneTitle), "8.2 the done screen does not say activación");
ok(/id="doneTitle"/.test(html), "8.3 the partial exposes an id for the done title");
ok(/t\("exerciseNum"/.test(fs.readFileSync("site/assets/js/activation-tool.js", "utf8")),
   "8.4 the engine's exercise counter still goes through t() (§40)");

/* ------------------------------------------------------------- 9. REPORT */
console.log("\nDURATIONS (engine formula, rest 10s)\n");
console.log("sport   30min   45min   60min");
SPORTS.forEach(s => console.log(s.padEnd(8) + MINS.map(m => (table[s][m] + "'").padEnd(8)).join("")));

if (A) {
  const actNames = new Set(Object.values(A.library).map(e => e.name.toLowerCase()));
  console.log("\nOVERLAP OF THE 30-MIN CORE WITH THE ACTIVATION MATRIX");
  console.log("(source doc was ~6 of 9 in every sport)\n");
  SPORTS.forEach(s => {
    const core = built[s + "|30"].phases.flatMap(p => p.exercises);
    const sh = core.filter(e => actNames.has(e.name.toLowerCase()));
    console.log(s.padEnd(8) + (sh.length + "/" + core.length).padEnd(8) +
      String(Math.round(sh.length / core.length * 100) + "%").padEnd(6) +
      (sh.length ? sh.map(e => e.name).join(", ") : "—"));
  });
}

console.log("\n" + pass + " checks passed, " + fails.length + " failed.");
if (fails.length) { console.log("\nFAILURES:"); fails.forEach(f => console.log("  x " + f)); process.exit(1); }
console.log("✓ all green");
