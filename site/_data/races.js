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

const DIR = path.join(__dirname, "../../data/races");

/** Per-language URL base. PT marathons sit under the existing `maratona` hub —
 *  there is no `corrida` hub in Portuguese and every researched race is a
 *  marathon, so inventing one would create an empty level. Revisit if a
 *  half-marathon race page is ever built. */
const URL_BASE = {
  es: "/planes/running/",
  en: "/en/plans/running/",
  pt: "/pt/planos/maratona/",
};

const IMAGE_WIDTHS = [960, 1600, 2560];

/** Resolve a `{es,en,pt}` object to one language. Plain values pass through, so
 *  a field that is genuinely language-neutral needs no ceremony. */
function pick(field, lang) {
  if (field === null || field === undefined) return null;
  if (typeof field !== "object" || Array.isArray(field)) return field;
  return field[lang] !== undefined ? field[lang] : null;
}

module.exports = function () {
  if (!fs.existsSync(DIR)) {
    console.log("[races] no data/races/ directory — no race pages will be built");
    return { all: [], byLanguage: { es: [], en: [], pt: [] }, count: 0 };
  }

  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
  const byLanguage = { es: [], en: [], pt: [] };
  const all = [];
  const problems = [];

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

    for (const lang of raw.language_market || []) {
      if (!byLanguage[lang]) continue;
      const slug = pick(raw.slug, lang) || id;
      const page = {
        id,
        lang,
        transKey: id,
        city: raw.city,
        country: raw.country,
        distance: raw.distance,
        name: pick(raw.name, lang),
        officialName: raw.official_name || null,
        officialUrl: raw.official_url || null,
        slug,
        url: `${URL_BASE[lang]}${slug}/`,

        nextEditionDate: raw.next_edition_date || null,
        typicalWindow: pick(raw.typical_window, lang),
        startTime: pick(raw.start_time, lang),

        hook: pick(raw.hook, lang),
        courseProfile: pick(raw.course_profile, lang),
        elevationGainM: raw.elevation_gain_m ?? null,
        elevationNote: pick(raw.elevation_note, lang),
        altitudeM: raw.altitude_m ?? null,
        courseNotes: pick(raw.course_notes, lang),
        whereTheyStruggle: pick(raw.where_they_struggle, lang),
        typicalWeather: pick(raw.typical_weather, lang),

        cutOff: raw.cut_off ? { year: raw.cut_off.year || null, text: pick(raw.cut_off, lang) } : null,
        field: raw.field
          ? { ...raw.field, note: pick(raw.field.note, lang) }
          : null,

        registrationWindow: pick(raw.registration_window, lang),
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
  console.log(
    `[races] ${files.length} race file(s) -> ${all.length} page(s): ` +
    `es ${byLanguage.es.length} / en ${byLanguage.en.length} / pt ${byLanguage.pt.length}`
  );

  return { all, byLanguage, count: all.length, problems };
};
