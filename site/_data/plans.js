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
