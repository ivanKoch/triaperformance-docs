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

module.exports = function () {
  const csvPath = path.join(__dirname, "../../data/training_plans_inventory.csv");
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8").replace(/^﻿/, ""));
  const header = rows.shift().map((h) => h.trim());

  // Measured link status, if the checker has been run.
  const statusPath = path.join(__dirname, "../../data/plan_link_status.json");
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

    const plan = {
      id,
      name: o.plan_name,
      language: o.language,
      sport: o.sport,
      distance: o.distance,
      difficulty: o.difficulty,
      weeks: parseInt(o.weeks, 10) || null,
      price: o.price,
      url: o.link,
      metric: o.hr_based === "TRUE" ? "hr"
            : o.power_based === "TRUE" ? "power"
            : o.pace_based === "TRUE" ? "pace" : null,
      strength: o.strength === "TRUE",
    };
    byId[id] = plan;
    all.push(plan);
  }

  console.log(
    `[plans] ${all.length} linkable plans loaded ` +
    `(excluded: ${problems.dead.length} known-dead, ` +
    `${problems.duplicate.length} duplicate rows, ` +
    `${problems.missingLink.length} missing/expired links)`
  );

  return { byId, all, problems, verified: linkStatus !== null };
};
