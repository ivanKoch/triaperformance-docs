/**
 * Race landing pages, loaded from data/races/*.json at build time.
 *
 * WHY JSON FILES AND NOT A CSV. Every other dataset in data/ is a table because
 * something outside this repo produces it as one — the plan inventory is a
 * TrainingPeaks export. Race pages are the opposite: most of a race row is
 * multi-paragraph prose in three languages, and a CSV cell is the wrong
 * container for that. The July 2026 races.csv already carried 900-character
 * quoted fields with embedded commas and was unreadable in every tool that
 * opens a CSV. One file per race, one commit per race, and a diff that shows
 * which paragraph changed.
 *
 * WHAT THIS FILE HANDS THE TEMPLATE. Not the raw row — one flattened page
 * object per (race x language), with every field already resolved to a string
 * in that language. The alternative is `race.course_notes[lang]` scattered
 * through the template, which puts the language fallback rule in twenty places
 * instead of one. A race appears in a language only if it lists that language
 * in `language_market`.
 *
 * NO PLAN DATA IS READ HERE. The ladder is a constant (race-page-data-schema.md)
 * and is resolved by the `raceLadder` filter against the plan inventory at
 * render time, so a retired plan drops off every race page at the next build
 * with nothing to update here.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DIR = path.join(__dirname, "../../data/races");

/** Per-language URL base. All three languages share one tree, with the SPORT
 *  as the level that holds race pages.
 *
 *  Portuguese used to sit under `/pt/planos/maratona/`, which is a distance
 *  level — fine while every researched race was a marathon, and broken the
 *  first time a half-marathon race page exists, because Portuguese would split
 *  its race set across two hubs while ES and EN kept theirs in one. Moved
 *  September 11, 2026, while exactly one Portuguese race page existed.
 *
 *  (The reason usually given for this — that mismatched paths break hreflang —
 *  is not true: hreflang exists precisely to map differently-shaped URLs to
 *  each other, and it was emitting correctly across all three before the move.
 *  The argument is maintenance, not search.) */
const URL_BASE = {
  es: "/planes/running/",
  en: "/en/plans/running/",
  pt: "/pt/planos/running/",
};

const IMAGE_WIDTHS = [960, 1600, 2560];

/** Resolve a `{es,en,pt}` object to one language. Plain values pass through, so
 *  a field that is genuinely language-neutral needs no ceremony. */
function pick(field, lang) {
  if (field === null || field === undefined) return null;
  if (typeof field !== "object" || Array.isArray(field)) return field;
  return field[lang] !== undefined ? field[lang] : null;
}

/** Weeks-back calendar math. "12 or 18 weeks" is abstract; "the 18-week block
 *  starts on 2 August" is the answer to the query people actually type. Only
 *  computable where the organiser has published a date — where they have not,
 *  the page says to count back from the typical window instead of inventing a
 *  Sunday. */
function startByDates(iso, weeks, today) {
  if (!iso) return null;
  const out = {};
  for (const w of weeks) {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - w * 7);
    const start = d.toISOString().slice(0, 10);
    // Only durations you can still START. Printing "the 18-week block starts
    // 2 August" to someone reading in October is not a calculation, it is a
    // page that has not noticed what day it is. The box rebuilds at 6am daily,
    // so this re-evaluates every morning without anyone touching it.
    if (start >= today) out[w] = start;
  }
  return Object.keys(out).length ? out : null;
}

/** The edition year a page should claim, for a race that happens every year.
 *
 *  While the published date is ahead, that date's year. ONCE IT PASSES, the
 *  next anniversary — because for an annual race the next edition is certainly
 *  next year even when the organiser has not named the day. The year is a far
 *  safer inference than the date: whether Valencia 2027 falls on 5 or 12
 *  December is unknown, that there IS a Valencia 2027 is not. It matters
 *  because "maratón valencia 2027" is what people type from 7 December onward,
 *  and a page still saying 2026 that morning is answering last year's question.
 *
 *  Loops rather than adding one, so a date two editions stale still resolves. */
function editionYear(iso, today) {
  if (!iso) return null;
  let y = Number(iso.slice(0, 4));
  const md = iso.slice(4);
  while (`${y}${md}` < today) y += 1;
  return y;
}

/** Whole weeks from today to race day. Null when the organiser has not
 *  published a date — which is the case the plan row must still handle. */
function weeksUntil(iso, today) {
  if (!iso) return null;
  const ms = new Date(iso + "T12:00:00Z") - new Date(today + "T12:00:00Z");
  return Math.floor(ms / (7 * 24 * 3600 * 1000));
}
function daysUntil(iso, today) {
  if (!iso) return null;
  const ms = new Date(iso + "T12:00:00Z") - new Date(today + "T12:00:00Z");
  return Math.round(ms / (24 * 3600 * 1000));
}

/** Durations the ladder offers for a distance. Kept here rather than imported
 *  from the raceLadder filter because this file must not depend on the plan
 *  inventory — the whole point of the constant ladder is that a race row never
 *  consults it. If these ever disagree, the filter wins and the page shows the
 *  filter's plans; this only decides which dates are printed. */
const LADDER_WEEKS = { "42k": [12, 18], "21k": [12, 16] };

/* ---------------------------------------------------------------------------
 * THE PUBLISH GATE (part 1 of 2: what can be checked from the data alone).
 *
 * Nineteen pages built from one template is the shape search engines call a
 * doorway set: identical headings, one token swapped. The defence is not good
 * intentions, it is that a page which does not differ REFUSES TO BUILD.
 *
 * A failing race is DROPPED, not thrown — one unfinished city must never stop
 * the other eighteen from shipping. Same idiom as plans.js, which drops a dead
 * plan and collects it in `problems` rather than failing the site.
 *
 * The complement lives in automation/race-page-check.js, which checks what only
 * exists after a build: hreflang completeness, schema/DOM agreement, title
 * length, breadcrumb depth.
 * ------------------------------------------------------------------------- */

/** Below this many weeks to race day, the shortest block has already started
 *  and the page says so instead of pretending the reader is on time. Iván's
 *  call, September 11, 2026: eight. Above it, compression is a real answer for
 *  someone already running; below it, it is a different plan. */
const LATE_WEEKS = 8;

/** Fields without which a race page is scaffolding with a city name in it. */
const REQUIRED = [
  ["hook", "the one sentence under the race name"],
  ["course_notes", "the km-by-km course"],
  ["where_they_struggle", "where the field comes apart — the clone-diff"],
  ["typical_window", "when the race is held"],
  ["registration_window", "how you get in"],
];

/** Bag-of-words similarity, 0..1. Deliberately crude and dependency-free: it
 *  cannot tell that two paragraphs make the same point in different words, and
 *  it does not need to. What it catches is the failure that actually happens —
 *  one city's paragraph pasted into another with the nouns changed. The content
 *  engine's research agent uses the same idea for duplicate article titles. */
function similarity(a, b) {
  const bag = (t) => new Set(String(t).toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  const A = bag(a), B = bag(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.min(A.size, B.size);
}

const CLONE_LIMIT = 0.55;

module.exports = function () {
  if (!fs.existsSync(DIR)) {
    console.log("[races] no data/races/ directory — no race pages will be built");
    return { all: [], byLanguage: { es: [], en: [], pt: [] }, count: 0 };
  }

  const TODAY = new Date().toISOString().slice(0, 10);
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  const byLanguage = { es: [], en: [], pt: [] };
  const all = [];
  const problems = [];
  const blocked = [];
  const heroHashes = new Map();
  const seenProse = {};

  for (const file of files) {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
    } catch (e) {
      // A malformed race file fails the build rather than silently dropping a
      // page — a missing race page is invisible, and invisible is how the Lima
      // plan_id mix-up survived a sweep.
      throw new Error(`[races] ${file} is not valid JSON: ${e.message}`);
    }

    const id = raw.race_id;
    if (!id) throw new Error(`[races] ${file} has no race_id`);
    if (id !== path.basename(file, ".json")) {
      throw new Error(`[races] ${file} declares race_id "${id}" — filename and id must match, because the id is also the hero-image filename`);
    }

    // The hero image is addressed by race_id with no field in the data. Verify
    // it exists at build time: a race page whose hero 404s is worse than one
    // that fails to build, and this is the exact class of error the blogImages
    // data file was written to prevent.
    const imgDir = path.join(__dirname, "../assets/images/races");
    const missing = IMAGE_WIDTHS.flatMap((w) =>
      ["webp", "jpg"].map((e) => `${id}-${w}.${e}`)
    ).filter((f) => !fs.existsSync(path.join(imgDir, f)));
    if (missing.length) problems.push(`${id}: missing ${missing.length} image file(s), first is ${missing[0]}`);

    // ── Gate, per race. Anything appended to `fails` drops this race.
    const fails = [];
    // A race that publishes in more than one language must give city and
    // country per language. No post-build check can catch the failure this
    // replaces — a wrong-but-well-formed place name is indistinguishable from
    // a right one once it is rendered — so the defence has to be the shape of
    // the data, not an assertion about the output.
    for (const field of ["city", "country"]) {
      const v = raw[field];
      if (raw.language_market.length > 1) {
        if (!v || typeof v !== "object" || Array.isArray(v)) {
          fails.push(`${field} must be per-language on a race that publishes in more than one`);
        } else {
          for (const lang of raw.language_market) {
            if (!v[lang]) fails.push(`${field} has no "${lang}" value`);
          }
        }
      } else if (!v) {
        fails.push(`missing ${field}`);
      }
    }

    for (const [field, why] of REQUIRED) {
      const v = raw[field];
      const empty = !v || (typeof v === "object" && !Object.values(v).some((x) => String(x || "").trim()));
      if (empty) fails.push(`missing ${field} (${why})`);
    }
    if (!(raw.sources || []).length) fails.push("no sources — every figure has to be traceable or removed");
    if (missing.length) fails.push(`hero image incomplete (${missing.length} file(s) missing, first ${missing[0]})`);

    // A hero shared between two cities is the single clearest doorway signal,
    // and it is the one mistake a bulk image pass makes. Hash, not filename.
    const heroPath = path.join(imgDir, `${id}-1600.jpg`);
    if (fs.existsSync(heroPath)) {
      const hash = crypto.createHash("sha1").update(fs.readFileSync(heroPath)).digest("hex");
      if (heroHashes.has(hash)) fails.push(`hero image is identical to ${heroHashes.get(hash)}`);
      else heroHashes.set(hash, id);
    }

    // The two paragraphs that make a race page a page, checked against every
    // race already loaded. Structure is meant to be shared; these are not.
    for (const field of ["where_they_struggle", "hook"]) {
      for (const [otherId, otherText] of (seenProse[field] || [])) {
        for (const lang of Object.keys(raw[field] || {})) {
          const mine = (raw[field] || {})[lang], theirs = (otherText || {})[lang];
          if (!mine || !theirs) continue;
          const sim = similarity(mine, theirs);
          if (sim >= CLONE_LIMIT) {
            fails.push(`${field} (${lang}) is ${(sim * 100).toFixed(0)}% the same as ${otherId} — that paragraph is the page`);
          }
        }
      }
    }
    seenProse.where_they_struggle = seenProse.where_they_struggle || [];
    seenProse.hook = seenProse.hook || [];
    seenProse.where_they_struggle.push([id, raw.where_they_struggle]);
    seenProse.hook.push([id, raw.hook]);

    if (fails.length) {
      blocked.push({ id, fails });
      continue;
    }

    const futureDate =
      raw.next_edition_date && raw.next_edition_date >= TODAY ? raw.next_edition_date : null;

    for (const lang of raw.language_market || []) {
      if (!byLanguage[lang]) continue;
      const slug = pick(raw.slug, lang) || id;
      const page = {
        id,
        lang,
        transKey: id,
        // 🚨 PER LANGUAGE, and this was a real defect. These two were plain
        // strings, so an English page said "Race guide · Nueva York", alt text
        // "Nueva York, Estados Unidos", and — the part that mattered — carried
        // "Estados Unidos" inside its SportsEvent JSON-LD. Six of twelve
        // non-Spanish pages were wrong; the other six were right only because
        // "Portugal" and "Brasil" happen to be the same word in both languages,
        // which is exactly why nobody caught it.
        city: pick(raw.city, lang),
        country: pick(raw.country, lang),
        // US races get US date order in English. Derived from the country
        // rather than a flag, now that the country knows what language it is in.
        usDates: !!(raw.country && raw.country.en === "United States"),
        distance: raw.distance,
        name: pick(raw.name, lang),
        officialName: raw.official_name || null,
        officialUrl: raw.official_url || null,
        slug,
        url: `${URL_BASE[lang]}${slug}/`,

        nextEditionDate: raw.next_edition_date || null,
        typicalWindow: pick(raw.typical_window, lang),
        startTime: pick(raw.start_time, lang),

        // 🚨 THE DATE DEMOTES ITSELF. Once the published date is behind us it is
        // treated as absent everywhere — no countdown, no start-by arithmetic,
        // no SportsEvent — and the page falls back to `typical_window`, which
        // is the undated shape the template already renders. Tested against a
        // clone dated three weeks back: before this, the page said "Próxima
        // edición: 30 de agosto" and "Faltan -2 semanas", and told Google the
        // event was still ahead. Nothing caught it, because nothing was
        // looking. The year still rolls (see editionYear) — the day is unknown,
        // the year is not.
        nextEditionDate: futureDate,
        datePassed: Boolean(raw.next_edition_date) && !futureDate,
        year: editionYear(raw.next_edition_date, TODAY),
        startBy: startByDates(futureDate, LADDER_WEEKS[raw.distance] || [], TODAY),
        weeksToRace: weeksUntil(futureDate, TODAY),
        daysToRace: daysUntil(futureDate, TODAY),
        // Which of four situations the reader is in, decided once here so the
        // template switches instead of re-deriving the arithmetic three times:
        //   undated  — organiser has published no date
        //   imminent — days away; this page is about the next edition
        //   late     — the shortest block has already started
        //   tight   — closer than the shortest block; only that block is offered
        //   band    — between the shortest and longest; BOTH are real answers
        //   ample   — more time than the longest block needs
        ladderPhase: (() => {
          const w = weeksUntil(futureDate, TODAY);
          const all = LADDER_WEEKS[raw.distance] || [];
          if (w === null || !all.length) return "undated";
          const lo = Math.min(...all), hi = Math.max(...all);
          // imminent — the race is days away. "tight" tells the reader they are
          // inside the 12-week window, which is false at two weeks out, and the
          // string reads "Faltan 1 semanas" into the bargain. A race this close
          // is a page about the NEXT edition, and it says so.
          if (w < 3) return "imminent";
          // late — inside the shortest block's window on paper, but the block
          // has already started. Iván's threshold, September 11, 2026: eight
          // weeks. Above it, a runner already training can compress the opening
          // weeks and the "you are inside the window" line is true. Below it,
          // that line is the page calling itself a liar — Lisbon shipped four
          // weeks out saying exactly that.
          if (w < LATE_WEEKS) return "late";
          return w < lo ? "tight" : w <= hi ? "band" : "ample";
        })(),
        coachHook: pick(raw.coach_hook, lang),

        // The date the conditions and entry facts were last checked against the
        // organiser. This block rots every season — a stamp is the honest
        // mitigation, and it is cheaper than pretending it will be maintained.
        lastVerified: raw.last_verified || null,

        hook: pick(raw.hook, lang),
        courseProfile: pick(raw.course_profile, lang),
        elevationGainM: raw.elevation_gain_m ?? null,
        elevationNote: pick(raw.elevation_note, lang),
        altitudeM: raw.altitude_m ?? null,
        courseNotes: pick(raw.course_notes, lang),
        whereTheyStruggle: pick(raw.where_they_struggle, lang),
        typicalWeather: pick(raw.typical_weather, lang),
        // Editorial, not derived: "is heat a real variable on this race". It is
        // a judgement and not a figure, so an explicit field is the right shape.
        // Whether the link RENDERS is a separate question, answered by whether
        // raceUi has a calculator URL in this language — so a Portuguese race
        // can be flagged today and light up the day the PT tool ships, with no
        // second pass over the data.
        heatTool: raw.heat_tool === true,
        // Editorial, two or three each. Derived pairing (same country, same
        // distance) produces junk neighbours; a human picking "the reader
        // choosing between these two" does not. Ids only — the template
        // resolves name and URL in its own language and silently drops a
        // sibling that has no page there, which is why a Spanish-only race can
        // sit in a Portuguese race's list without breaking anything.
        siblings: Array.isArray(raw.siblings) ? raw.siblings : [],

        cutOff: raw.cut_off ? { year: raw.cut_off.year || null, text: pick(raw.cut_off, lang) } : null,
        field: raw.field
          ? { ...raw.field, note: pick(raw.field.note, lang) }
          : null,

        registrationWindow: pick(raw.registration_window, lang),
        // The state, surfaced next to the plan cards rather than only in the
        // entry block further up. open | window | sold_out.
        registrationState: raw.registration_state || null,
        // An optional caveat printed under the plan row — for races where a
        // ladder rung does not mean what it means everywhere else (Boston's
        // low-volume block, on a race you cannot enter without a qualifier).
        planNote: pick(raw.plan_note, lang),
        registrationWhen: pick(raw.registration_when, lang),
        registrationModel: pick(raw.registration_model, lang),
        sellOutNote: pick(raw.sell_out_note, lang),
        qualifying: pick(raw.qualifying, lang),
        corralPolicy: pick(raw.corral_policy, lang),
        proofOfTime: pick(raw.proof_of_time, lang),

        howToTrain: pick(raw.how_to_train, lang),
        targetQueries: pick(raw.target_queries, lang) || [],
        sources: raw.sources || [],
        confidenceFlags: raw.confidence_flags || [],

        image: {
          base: `/assets/images/races/${id}`,
          widths: IMAGE_WIDTHS,
        },
      };
      byLanguage[lang].push(page);
      all.push(page);
    }
  }

  for (const lang of Object.keys(byLanguage)) {
    byLanguage[lang].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (problems.length) {
    console.log(`[races] ⚠️  ${problems.length} image problem(s):`);
    for (const p of problems) console.log(`[races]    ${p}`);
  }
  if (blocked.length) {
    console.log(`[races] 🚫 ${blocked.length} race(s) BLOCKED from publishing:`);
    for (const b of blocked) {
      console.log(`[races]    ${b.id}`);
      for (const f of b.fails) console.log(`[races]       - ${f}`);
    }
  }
  console.log(
    `[races] ${files.length} race file(s) -> ${all.length} page(s): ` +
    `es ${byLanguage.es.length} / en ${byLanguage.en.length} / pt ${byLanguage.pt.length}` +
    (blocked.length ? ` — ${blocked.length} blocked` : "")
  );

  return { all, byLanguage, count: all.length, problems, blocked };
};
