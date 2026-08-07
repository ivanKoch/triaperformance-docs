/**
 * Plan catalog, loaded from data/training_plans_inventory.csv at build time.
 *
 * WHY THIS EXISTS: articles must never contain hand-typed or model-generated
 * TrainingPeaks URLs. An article references a plan by `plan_id`; this file
 * supplies the real name, price, duration and link. That means a plan URL in a
 * published article is always one that existed in the inventory at build time.
 *
 * It also refuses to link a plan that the link checker has recorded as broken —
 * linking one from an article would silently send a buyer to a dead page.
 * Referencing a blocked plan fails the build.
 *
 * DEAD LINKS ARE DETERMINED BY MEASUREMENT, NOT BY A LIST. An earlier version of
 * this file hard-coded six "known dead" plan IDs copied from old crawl notes.
 * All six were wrong: 434680 was live and buyable, and the other five had already
 * been removed from the inventory. Ground truth now comes from
 * data/plan_link_status.json, written by automation/check-plan-links.py.
 * If that file is absent, nothing is blocked and the build says so.
 */

const fs = require("fs");
const path = require("path");

/** Minimal CSV parser — handles quoted fields and embedded commas/newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/**
 * Slugify a plan name for the individual plan-page URL.
 *
 * Strips emoji (251/321 published plan names carry one, e.g. "8 Week 5 km
 * Prep: Run 🏃 (First Timer Focus)"), strips accents (Spanish/Portuguese
 * names), lowercases, and hyphenates. The plan_id is always appended by the
 * caller — the name alone is not guaranteed unique (several plans share a
 * name across difficulty tiers that differ only by ID), the ID is.
 */
function slugifyName(name) {
  return name
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, "") // strip emoji/symbols
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Language column value -> URL language code + section noun, used for slugging and grouping. */
const LANG_CODE = { Spanish: "es", English: "en", Portuguese: "pt" };

/** Individual plan-page URL base per language — confirmed with Iván July 30, 2026. */
const PAGE_BASE = { es: "/planes/p/", en: "/en/plans/p/", pt: "/pt/planos/p/" };

/** Catalog URL per language — the 4 existing ES category pages keep their own paths (see catalogs). */
const CATALOG_URL = { es: "/planes/", en: "/en/plans/", pt: "/pt/planos/" };

/** Weeks facet bucket for the catalog filters — 4 buckets covering the 4-24 week range in the data. */
function weeksBucket(weeks) {
  if (!weeks) return null;
  if (weeks <= 8) return "1-8";
  if (weeks <= 12) return "9-12";
  if (weeks <= 18) return "13-18";
  return "19+";
}

/**
 * Weekly breakdown, joined from data/plan_weekly_breakdown.csv (765 rows,
 * 301 plans — TP's per-plan workout stats, crawled July 2026, never exposed
 * in the plan export itself). ~20 published plans have no breakdown; those
 * plans get `weeklyBreakdown: null` and the plan template must degrade
 * gracefully (no table, not a broken one).
 *
 * "Day Off" rows become `restDaysPerWeek` rather than an activity row.
 * activity_type casing is inconsistent in the source ("Strength" vs
 * "strength") — normalized here so the template doesn't have to know.
 */
function loadWeeklyBreakdown() {
  const csvPath = path.join(__dirname, "../../data/plan_weekly_breakdown.csv");
  if (!fs.existsSync(csvPath)) return {};
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8").replace(/^﻿/, ""));
  const header = rows.shift().map((h) => h.trim());
  const byPlanId = {};

  for (const r of rows) {
    if (!r.length || !r[0].trim()) continue;
    const o = {};
    header.forEach((h, i) => (o[h] = (r[i] || "").trim()));
    const id = o.plan_id;
    if (!id) continue;
    if (!byPlanId[id]) byPlanId[id] = { activities: [], restDaysPerWeek: 0 };

    if (o.activity_type === "Day Off") {
      byPlanId[id].restDaysPerWeek = parseInt(o.weekly_count, 10) || 0;
      continue;
    }
    const type = o.activity_type.charAt(0).toUpperCase() + o.activity_type.slice(1).toLowerCase();
    byPlanId[id].activities.push({
      type,
      weeklyCount: parseInt(o.weekly_count, 10) || null,
      weeklyAvg: o.weekly_avg || null,
      weeklyAvgUnit: o.weekly_avg_unit || null,
      longest: o.longest_workout || null,
      longestUnit: o.longest_workout_unit || null,
    });
  }
  return byPlanId;
}

module.exports = function () {
  const csvPath = path.join(__dirname, "../../data/training_plans_inventory.csv");
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8").replace(/^﻿/, ""));
  const header = rows.shift().map((h) => h.trim());

  // Measured link status, if the checker has been run.
  //
  // PLAN_LINK_STATUS lets a machine that generates its own results point at a
  // file outside the repo. The VPS checkout is reset --hard on every deploy, so
  // anything a cron writes inside it is destroyed; results written to, say,
  // ~/.hermes/plan_link_status.json survive and are picked up here.
  // Falls back to the committed copy, which is what a local build uses.
  const statusPath =
    process.env.PLAN_LINK_STATUS ||
    path.join(__dirname, "../../data/plan_link_status.json");
  let linkStatus = null;
  if (fs.existsSync(statusPath)) {
    const raw = JSON.parse(fs.readFileSync(statusPath, "utf8"));
    linkStatus = raw.plans || {};
    console.log(`[plans] link status loaded (checked ${raw.generated_at}, ${raw.bad} bad)`);
  } else {
    console.log(
      "[plans] NOTE: data/plan_link_status.json not found — no plan links have been " +
      "verified. Run: python3 automation/check-plan-links.py"
    );
  }

  // Only a definite 404/410 blocks a plan. Deliberately NOT "anything that isn't
  // 200" — a timeout or a 429 recorded during a bad run would otherwise take
  // working plans out of the catalog and quietly shrink every article's offers.
  const isDead = (id) =>
    linkStatus && linkStatus[id] && [404, 410].includes(linkStatus[id].status);

  const weeklyBreakdownByPlanId = loadWeeklyBreakdown();

  const byId = {};
  const all = [];
  const problems = { dead: [], duplicate: [], missingLink: [] };

  for (const r of rows) {
    if (!r.length || !r[0].trim()) continue;
    const o = {};
    header.forEach((h, i) => (o[h] = (r[i] || "").trim()));

    const id = o.plan_id;
    if (!id || id === "Not built") continue;
    if (o.is_published !== "TRUE") continue;
    if (!o.link || o.link === "Expired") { problems.missingLink.push(id); continue; }
    if (isDead(id)) { problems.dead.push(id); continue; }
    if (byId[id]) { problems.duplicate.push(id); continue; }

    const langCode = LANG_CODE[o.language] || null;

    const displayName = o.plan_name
      .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    const plan = {
      id,
      name: o.plan_name, // raw, kept for existing planCard consumers (blog shortcode)
      displayName, // emoji stripped — used on the plan page itself and in <title>/schema
      langCode, // es | en | pt — drives which storefront section this plan lives under
      language: o.language, // Spanish | English | Portuguese — kept for existing planCard consumers
      sport: o.sport,
      distance: o.distance,
      difficulty: o.difficulty,
      weeks: parseInt(o.weeks, 10) || null,
      price: o.price,
      url: o.link, // individual TP plan page — the Phase 1 redirect target
      groupUrl: o.web || null, // TP's group/category page for this plan's collection — not the redirect target
      metric: o.hr_based === "TRUE" ? "hr"
            : o.power_based === "TRUE" ? "power"
            : o.pace_based === "TRUE" ? "pace" : null,
      strength: o.strength === "TRUE",
      weightLoss: o.weight_loss === "TRUE",
      timeGoal: o.time_goal === "TRUE",
      slug: langCode ? `${slugifyName(o.plan_name)}-${id}` : null,
      weeksBucket: weeksBucket(parseInt(o.weeks, 10) || null),
      weeklyBreakdown: weeklyBreakdownByPlanId[id] || null,
    };
    // pageUrl: our own plan-page URL (catalog cards + "browse more" links point
    // here, not straight to TP) — keeps the email-capture surface in the path
    // to every purchase, not just the ones landing directly from Google.
    plan.pageUrl = langCode ? `${PAGE_BASE[langCode]}${plan.slug}/` : null;
    byId[id] = plan;
    all.push(plan);
  }

  // Per-language groups, used by the plan-page pagination templates
  // (site/planes/p/, site/en/plans/p/, site/pt/planos/p/) and the catalogs.
  const byLanguage = { es: [], en: [], pt: [] };
  for (const plan of all) {
    if (plan.langCode && byLanguage[plan.langCode]) byLanguage[plan.langCode].push(plan);
  }

  // ---------------------------------------------------------------------------
  // Derived fields for the plan-page content sections (August 6, 2026).
  //
  // The page body is generated from data rather than copied from the
  // TrainingPeaks listings: the hand-written listing rewrites only cover 20 of
  // 321 plans, and reusing their text verbatim would put these pages in
  // duplicate-content competition with trainingpeaks.com, which outranks this
  // domain. Everything below is computed once here so the templates stay
  // declarative and the same numbers are available to the race pages later.
  // ---------------------------------------------------------------------------

  // Total weekly training time, summed across the duration-based activities.
  // Swim volume is recorded in metres and a handful of runs in miles; those are
  // deliberately excluded from the sum rather than guessed at, so a swim-only
  // plan reports sessions but no hours instead of a fabricated number.
  const toSeconds = (v) => {
    const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(v || "");
    return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null;
  };
  const DIFFICULTY_ORDER = ["Beginner", "Intermediate", "Advanced"];

  for (const plan of all) {
    const acts = (plan.weeklyBreakdown && plan.weeklyBreakdown.activities) || [];
    const sessions = acts.reduce((n, a) => n + (a.weeklyCount || 0), 0);
    const secs = acts.reduce((n, a) => n + (a.weeklyAvgUnit === "duration" ? (toSeconds(a.weeklyAvg) || 0) : 0), 0);
    const longestSecs = acts.reduce(
      (n, a) => Math.max(n, a.longestUnit === "duration" ? (toSeconds(a.longest) || 0) : 0), 0);
    const fmt = (s) => {
      const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
      return h ? (m ? `${h}:${String(m).padStart(2, "0")} h` : `${h} h`) : `${m} min`;
    };
    plan.weeklyTotals = acts.length
      ? {
          sessions: sessions || null,
          hoursText: secs ? fmt(secs) : null,
          longestText: longestSecs ? fmt(longestSecs) : null,
          restDays: plan.weeklyBreakdown.restDaysPerWeek || null,
        }
      : null;
  }

  // ---------------------------------------------------------------------------
  // seoTitle — a <=60 character page title, guaranteed unique within a language.
  //
  // Truncating long plan names alone produced duplicate titles, because sibling
  // plans differ in the middle ("Volumen 55-90 km" vs "Intermedio 90-110km") or
  // at the very end. Uniqueness can't be decided one plan at a time, so it's
  // resolved here where the whole catalogue is in scope: truncate first, then
  // walk the collisions and re-append the distinguishing attribute — difficulty,
  // then week count. Anything still colliding after that is a genuinely
  // duplicated listing on TrainingPeaks, not a titling problem, and is reported
  // in the build log rather than papered over.
  // ---------------------------------------------------------------------------
  const LIMIT = 60;
  const shorten = (s, limit = LIMIT) => {
    const t = s.replace(/\s{2,}/g, " ").trim();
    if (t.length <= limit) return t;
    const tail = t.match(/\(([^()]{1,26})\)\s*$/);
    if (tail) {
      const room = limit - tail[1].length - 4;
      if (room > 20) {
        const head = t.slice(0, room);
        return head.slice(0, head.lastIndexOf(" ")) + "… (" + tail[1] + ")";
      }
    }
    const cut = t.slice(0, limit - 1);
    return cut.slice(0, cut.lastIndexOf(" ")) + "…";
  };
  const DIFF_SHORT = {
    es: { Beginner: "Principiante", Intermediate: "Intermedio", Advanced: "Avanzado" },
    en: { Beginner: "Beginner", Intermediate: "Intermediate", Advanced: "Advanced" },
    pt: { Beginner: "Iniciante", Intermediate: "Intermediário", Advanced: "Avançado" },
  };

  const trueDuplicates = [];
  for (const code of ["es", "en", "pt"]) {
    const seen = new Map();
    for (const plan of byLanguage[code]) {
      plan.seoTitle = shorten(plan.displayName);
      if (!seen.has(plan.seoTitle)) seen.set(plan.seoTitle, []);
      seen.get(plan.seoTitle).push(plan);
    }
    for (const [title, group] of seen) {
      if (group.length < 2) continue;
      for (const plan of group) {
        for (const extra of [DIFF_SHORT[code][plan.difficulty], plan.weeks && `${plan.weeks} sem`]) {
          if (!extra) continue;
          const candidate = shorten(plan.displayName, LIMIT - extra.length - 3) + " · " + extra;
          if (!group.some((p) => p !== plan && p.seoTitle === candidate)) { plan.seoTitle = candidate; break; }
        }
      }
      const still = group.filter((p, i) => group.findIndex((q) => q.seoTitle === p.seoTitle) !== i);
      if (still.length) trueDuplicates.push({ title, ids: group.map((p) => p.id) });
    }
  }
  if (trueDuplicates.length) {
    console.log(`[plans] ${trueDuplicates.length} plan(s) share an identical name on TrainingPeaks ` +
      `— not a titling problem, the listings themselves are duplicates:`);
    for (const d of trueDuplicates) console.log(`         ${d.ids.join(" / ")}  ${d.title}`);
  }

  // Sibling plans for the "not the right fit?" cross-links. Same language, same
  // sport and same distance/focus — a wrong-fit visitor gets sent one click
  // sideways instead of back to Google. Nearest match wins: for difficulty, the
  // adjacent step with the closest week count; for duration, the next plan up or
  // down at the same difficulty.
  for (const plan of all) {
    if (!plan.langCode) continue;
    const family = byLanguage[plan.langCode].filter(
      (p) => p.id !== plan.id && p.sport === plan.sport && p.distance === plan.distance);
    const rank = DIFFICULTY_ORDER.indexOf(plan.difficulty);
    const nearestWeeks = (list) =>
      list.slice().sort((a, b) =>
        Math.abs((a.weeks || 0) - (plan.weeks || 0)) - Math.abs((b.weeks || 0) - (plan.weeks || 0)))[0] || null;
    const atRank = (r) => (r < 0 || r >= DIFFICULTY_ORDER.length
      ? [] : family.filter((p) => p.difficulty === DIFFICULTY_ORDER[r]));
    const sameDiff = family.filter((p) => p.difficulty === plan.difficulty && p.weeks);

    // Flattened to the three fields the template renders, deliberately NOT the
    // plan object: plan A's sibling is plan B, whose sibling is plan A, and
    // Eleventy deep-merges its data cascade — the object graph blows the stack
    // with "Maximum call stack size exceeded" before a single page renders.
    const ref = (p) => (p ? { pageUrl: p.pageUrl, difficulty: p.difficulty, weeks: p.weeks } : null);

    plan.siblings = {
      easier: ref(rank > 0 ? nearestWeeks(atRank(rank - 1)) : null),
      harder: ref(rank >= 0 && rank < DIFFICULTY_ORDER.length - 1 ? nearestWeeks(atRank(rank + 1)) : null),
      shorter: ref(sameDiff.filter((p) => p.weeks < plan.weeks).sort((a, b) => b.weeks - a.weeks)[0]),
      longer: ref(sameDiff.filter((p) => p.weeks > plan.weeks).sort((a, b) => a.weeks - b.weeks)[0]),
    };
  }

  console.log(
    `[plans] ${all.length} linkable plans loaded ` +
    `(excluded: ${problems.dead.length} known-dead, ` +
    `${problems.duplicate.length} duplicate rows, ` +
    `${problems.missingLink.length} missing/expired links) — ` +
    `es ${byLanguage.es.length} / en ${byLanguage.en.length} / pt ${byLanguage.pt.length}, ` +
    `${all.filter((p) => p.weeklyBreakdown).length} with weekly breakdown`
  );

  return { byId, all, byLanguage, problems, verified: linkStatus !== null };
};
