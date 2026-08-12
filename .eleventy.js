/**
 * Eleventy config for triaperformance.com
 *
 * Source of truth:  site/          (templates, partials, data, CSS)
 * Build output:     _site/         (plain static HTML — never edited by hand, never committed)
 * Deployed by:      the VPS cron job, which builds and then rsyncs _site/ into /var/www/triaperformance
 *
 * The output is ordinary static HTML/CSS/JS — exactly what Caddy serves today.
 * Nothing about hosting, HTTPS, or the /members/* auth gate changes: Caddy still
 * gates that path with forward_auth at request time. The build has no idea auth exists.
 */

const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  // ---------------------------------------------------------------------------
  // Static assets. `images` and `guias` have been migrated into site/assets/
  // (Phase 5 cleanup, July 29 2026) and are covered by the site/assets
  // passthrough below — no separate line needed for them anymore.
  //
  // `website/hubfs` stays here PERMANENTLY, unlike the rest of website/ —
  // do not move it. Its exact route (triaperformance.com/hubfs/tp_marketplace/*)
  // is hotlinked by TrainingPeaks' own marketplace pages across ~300 live plan
  // listings. Moving it would break those images on TrainingPeaks' site, not
  // just ours, and there's no way to fix ~300 external references after the fact.
  // ---------------------------------------------------------------------------
  eleventyConfig.addPassthroughCopy({ "website/hubfs": "hubfs" });
  eleventyConfig.addPassthroughCopy({ "site/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "site/robots.txt": "robots.txt" });

  // ---------------------------------------------------------------------------
  // Translation map — the reason this build exists.
  //
  // Any page can declare `transKey: home` in its front matter. Every page
  // sharing a transKey is treated as the same page in a different language,
  // and the base layout emits the correct <link rel="alternate" hreflang>
  // tags plus a language switcher that points at the *equivalent* page rather
  // than always dumping the visitor on the language homepage.
  //
  // This is what stops hreflang from becoming unmaintainable at 100+ articles
  // across three languages. Add a translation, get the tags for free.
  // ---------------------------------------------------------------------------
  eleventyConfig.addCollection("translations", (collectionApi) => {
    const map = {};
    for (const item of collectionApi.getAll()) {
      const key = item.data.transKey;
      const lang = item.data.lang;
      if (!key || !lang) continue;
      if (!map[key]) map[key] = {};
      map[key][lang] = item.url;
    }
    return map;
  });

  // ---------------------------------------------------------------------------
  // Blog posts, newest first, per language.
  // ---------------------------------------------------------------------------
  // Built from a glob, not a tag. Tagging was the obvious approach, but Eleventy
  // deep-merges `tags` down the data cascade, so `tags: ["post"]` in a blog
  // directory data file also lands on that directory's index.njk and the listing
  // page lists itself. The escape hatch (eleventyExcludeFromCollections) removes
  // the page from getAll() entirely — which silently stripped the listing pages
  // out of the translations map below and killed their hreflang. Globbing the
  // article files and excluding index.njk avoids both problems. (July 2026)
  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi
      .getFilteredByGlob([
        "site/blog/*.njk",
        "site/en/blog/*.njk",
        "site/pt/blog/*.njk",
      ])
      .filter((p) => !p.inputPath.endsWith("index.njk"))
      .sort((a, b) => b.date - a.date)
  );

  // ---------------------------------------------------------------------------
  // planCard — renders a TrainingPeaks plan from the real inventory.
  //
  // An article names a plan by ID and never types a URL. If the ID doesn't
  // resolve (unpublished, expired link, or on the known-404 list), the BUILD
  // FAILS rather than shipping a dead link to a buyer. That guard is the point.
  // ---------------------------------------------------------------------------
  eleventyConfig.addShortcode("planCard", function (planId, blurb) {
    const plans = this.ctx?.plans || this.context?.environments?.plans;
    const plan = plans && plans.byId[String(planId)];
    if (!plan) {
      throw new Error(
        `planCard: plan_id "${planId}" is not linkable. It is either unpublished, ` +
        `has an expired link, or is on the known-404 list in site/_data/plans.js. ` +
        `Pick a different plan — do not hand-write the URL.`
      );
    }
    // Card furniture is localised off the page's own language, so the same
    // shortcode works in an ES, EN or PT article without per-language variants.
    const lang = (this.ctx && this.ctx.lang) || "es";
    const L = {
      es: { weeks: "semanas", hr: "Frecuencia cardíaca", power: "Potencia",
            pace: "Por ritmo", gym: "Incluye gimnasio",
            level: { Beginner: "Principiante", Intermediate: "Intermedio", Advanced: "Avanzado" } },
      en: { weeks: "weeks", hr: "Heart rate", power: "Power",
            pace: "Pace based", gym: "Includes gym work",
            level: { Beginner: "Beginner", Intermediate: "Intermediate", Advanced: "Advanced" } },
      pt: { weeks: "semanas", hr: "Frequência cardíaca", power: "Potência",
            pace: "Por ritmo", gym: "Inclui academia",
            level: { Beginner: "Iniciante", Intermediate: "Intermediário", Advanced: "Avançado" } },
    }[lang];

    const meta = [
      plan.weeks ? `${plan.weeks} ${L.weeks}` : null,
      L.level[plan.difficulty] || plan.difficulty,
      plan.metric === "hr" ? L.hr
        : plan.metric === "power" ? L.power
        : plan.metric === "pace" ? L.pace : null,
      plan.strength ? L.gym : null,
    ].filter(Boolean).join(" · ");
    return `<div class="plan-pick">
  <h3><a href="${plan.url}" target="_blank" rel="noopener">${plan.name}</a></h3>
  <p class="plan-pick-meta">${meta}</p>
  ${blurb ? `<p class="plan-pick-blurb">${blurb}</p>` : ""}
  <p class="plan-pick-price">US$ ${plan.price}</p>
</div>`;
  });

  // ---------------------------------------------------------------------------
  // zoneTable — renders a sport's zone table from data/zones.csv.
  //
  // Added August 12, 2026. Four published articles (the ES/EN/PT threshold piece
  // and the ES Norwegian-method piece) each carried a HAND-TYPED seven-zone
  // table, and all four disagreed with data/zones.csv on nearly every row. Worse,
  // each printed ONE column of percentages while claiming it applied to both
  // velocity and heart rate -- and the real model has a separate table per
  // sport-and-metric precisely because those diverge. An athlete who read the
  // article and then used the calculator got two different sets of zones.
  //
  // The fix is not to retype the numbers correctly. A second typed copy is how
  // they diverged in the first place, and it would diverge again the next time
  // the model is tuned. Numbers come from the CSV, prose comes from
  // _data/zoneCopy.json, and the article supplies neither.
  //
  // Usage:  {% zoneTable "running" %}
  // Language is taken from the page, so ES/EN/PT siblings use the identical tag.
  // ---------------------------------------------------------------------------
  eleventyConfig.addShortcode("zoneTable", function (sport) {
    const ctx = this.ctx || {};
    const zones = ctx.zones || this.context?.environments?.zones;
    const copyAll = ctx.zoneCopy || this.context?.environments?.zoneCopy;
    const lang = ctx.lang || "es";

    // Fail the build rather than render an empty or partial table. A zone table
    // that silently loses a column is indistinguishable from an editorial
    // decision, which is the failure mode this shortcode exists to remove.
    if (!zones || !zones.tables[sport]) {
      throw new Error(
        `zoneTable: no zone tables for sport "${sport}". Known sports: ` +
        `${Object.keys((zones && zones.tables) || {}).join(", ") || "none loaded"}.`
      );
    }
    const copy = copyAll && copyAll[lang];
    if (!copy) {
      throw new Error(
        `zoneTable: no zoneCopy for language "${lang}". Add it to ` +
        `site/_data/zoneCopy.json before publishing this article.`
      );
    }

    const metrics = zones.metricsBySport[sport];
    const missing = metrics.filter((m) => !copy.metricLabels[m]);
    if (missing.length) {
      throw new Error(
        `zoneTable: zoneCopy.${lang}.metricLabels is missing [${missing.join(", ")}] ` +
        `for sport "${sport}". Every metric with a zone table needs a column header.`
      );
    }

    // Percentages are stored as floats (72.0). Render 72, not 72.0 -- but keep a
    // real decimal if one is ever introduced, rather than rounding it away.
    const n = (v) => (Number.isInteger(v) ? String(v) : String(v));

    const head =
      `<tr><th>${copy.zoneHeader}</th>` +
      metrics.map((m) => `<th>${copy.metricLabels[m]}</th>`).join("") +
      `</tr>`;

    const rows = zones.order.map((z) => {
      const label = copy.zoneNames[z] || z;
      const purpose = copy.zonePurpose[z] || "";
      const cells = metrics.map((m) => {
        const band = zones.tables[sport][m].find((r) => r.zone === z);
        return `<td>${n(band.floor)} – ${n(band.ceiling)}%</td>`;
      }).join("");
      const zLabel = /^\d+$/.test(z) ? `Z${z}` : z;
      return `<tr><td><strong>${zLabel}</strong> — ${label}` +
             (purpose ? `<span class="zone-purpose">${purpose}</span>` : "") +
             `</td>${cells}</tr>`;
    }).join("\n    ");

    return `<div class="zone-table-wrap">
  <table class="zone-table">
    <thead>${head}</thead>
    <tbody>
    ${rows}
    </tbody>
  </table>
</div>
${copy.caption ? `<p class="datanote">${copy.caption}</p>` : ""}`;
  });

  // ---------------------------------------------------------------------------
  // withUtm — appends UTM + plan_id to a TrainingPeaks plan URL.
  //
  // Every outbound redirect from the storefront to a TP purchase page must
  // carry these (Phase 1 standing decision, growth-roadmap.md storefront
  // section: "all redirects carry UTM + plan_id"). Built with the URL API so
  // it's correct regardless of whether the source link already has a query
  // string (none currently do, but this doesn't assume that stays true).
  // ---------------------------------------------------------------------------
  /**
   * Cache-busting for CSS/JS. Appends `?v=<8 chars of the file's md5>` so a
   * changed file is a changed URL and no cache can serve the old one.
   *
   * Added August 6, 2026 after a full afternoon lost to it. Caddy sends no
   * `Cache-Control` for /assets/*, so caches fall back to heuristic freshness
   * and hold JS for hours. Symptom: the mobile filter chips "still didn't
   * work" across three rounds of fixes, on a phone that was running
   * two-versions-old JavaScript against current CSS — a combination that
   * cannot work and looks exactly like a code bug. Proven by fetching the
   * same URL twice, once bare and once with a dummy query: the bare URL
   * returned stale code, the query returned current code.
   *
   * A content hash, not a build timestamp: unchanged files keep their URL and
   * stay cached, so this costs nothing on deploys that don't touch them.
   */
  const crypto = require("crypto");
  const assetHashes = new Map();
  eleventyConfig.addFilter("v", function (url) {
    if (!url) return url;
    if (!assetHashes.has(url)) {
      let hash = "";
      try {
        const file = path.join(__dirname, "site", url.replace(/^\//, ""));
        hash = crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
      } catch (e) {
        /* Changed from fail-open to fail-loud, August 12, 2026.
         *
         * This used to warn and emit the bare URL. That was the right trade
         * when the only cost was a stale file for a few hours. It stopped being
         * right the same day Caddy started sending
         * `Cache-Control: public, max-age=31536000, immutable` for /assets/css
         * and /assets/js: an asset that slips through WITHOUT a ?v= fingerprint
         * is now pinned in every visitor's browser for a year, with no way to
         * bust it short of renaming the file.
         *
         * So the two possible failures are no longer comparable. Fail open: a
         * year of serving stale CSS to people who cannot clear it, announced by
         * one warning line in a build log nobody reads. Fail closed: a build
         * that stops, names the file, and is fixed in about thirty seconds.
         *
         * The realistic trigger is a typo in a page's `pageCss` front matter,
         * which is exactly the case where a silent fallback looks like it
         * worked and ships a page with no stylesheet.
         */
        throw new Error(
          `cache-bust: cannot read "${url}" (looked in site${url}).\n` +
          `Every CSS/JS URL must be fingerprinted, because Caddy now serves ` +
          `/assets/css and /assets/js as immutable for a year — an unfingerprinted ` +
          `file would be uncacheable-to-fix for that long.\n` +
          `Check the filename, or the pageCss/css value in the page's front matter.`
        );
      }
      assetHashes.set(url, hash ? url + "?v=" + hash : url);
    }
    return assetHashes.get(url);
  });

  /**
   * seoTitle — fit a page title into the ~60 characters Google renders.
   *
   * Added August 6, 2026: 355 of 374 titles were over 60, the longest 134, so
   * the back half of every plan title was being truncated in results. Two
   * causes, both fixed here rather than by rewriting 321 product names:
   *   1. The template appended "— Plan de N semanas" to names that already
   *      began "Plan N Semanas" — pure duplication, ~20 wasted characters.
   *   2. "| Triaperformance" was appended unconditionally, costing 18 more.
   *
   * Rules, in order: keep the brand if the whole thing still fits; drop the
   * brand if the name alone fits; otherwise cut at a word boundary. The front
   * of a plan name carries the searchable part (distance, weeks, level), so
   * truncation loses the tail, not the meaning. Titles are checked for
   * uniqueness after truncation — see the build test.
   */
  eleventyConfig.addFilter("seoTitle", function (name, brand) {
    const LIMIT = 60;
    const clean = String(name || "").replace(/\s{2,}/g, " ").trim();
    const suffix = brand ? ` | ${brand}` : "";
    if (clean.length + suffix.length <= LIMIT) return clean + suffix;
    if (clean.length <= LIMIT) return clean;

    /* Truncating from the end alone produced 16 duplicate titles: sibling plans
     * differ only in their tail — "(Intermedio - 4x)" vs "(Avanzado - 5x)" —
     * so cutting the tail is cutting the one part that distinguishes them.
     * Keep a short trailing qualifier (a parenthetical, or the last dash-
     * separated segment) and truncate the middle instead. */
    const tailMatch = clean.match(/\(([^()]{1,26})\)\s*$/) || clean.match(/[-–—]\s*([^-–—]{1,26})\s*$/);
    const tail = tailMatch ? tailMatch[1].trim() : "";
    if (tail) {
      const room = LIMIT - tail.length - 4;           // "… (" + ")"
      if (room > 20) {
        const head = clean.slice(0, room);
        return head.slice(0, head.lastIndexOf(" ")) + "… (" + tail + ")";
      }
    }
    const cut = clean.slice(0, LIMIT - 1);
    return cut.slice(0, cut.lastIndexOf(" ")) + "…";
  });

  /**
   * seoTitleAuto — site-wide guardrail applied in base.njk to EVERY title.
   *
   * Most over-length titles were 61-79 characters, i.e. a perfectly good title
   * plus the 18-character " | Triaperformance" suffix. Google already shows the
   * site name beside the result, so the suffix is the first thing to go: drop
   * it and the title fits, with nothing lost and no ellipsis. Only if the title
   * is still too long on its own does it get cut.
   *
   * Applied globally rather than page by page so that anything added later —
   * including articles written by the content engine — is covered without
   * anyone remembering to check.
   */
  eleventyConfig.addFilter("seoTitleAuto", function (title) {
    const LIMIT = 60;
    const s = String(title || "").replace(/\s{2,}/g, " ").trim();
    if (s.length <= LIMIT) return s;
    const stripped = s.replace(/\s*[|—–-]\s*Triaperformance\s*$/, "").trim();
    if (stripped.length <= LIMIT) return stripped;
    const cut = stripped.slice(0, LIMIT - 1);
    return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\-–—|]$/, "").trim() + "…";
  });

  /**
   * clamp — cut a meta description to `n` characters on a word boundary.
   * Descriptions are assembled from a plan name plus real weekly figures, and
   * plan names run to 94 characters, so the combined string routinely blew
   * past the ~160 Google renders. Front-loaded facts survive; the tail doesn't
   * need to.
   */
  eleventyConfig.addFilter("clamp", function (text, n) {
    const s = String(text || "").replace(/\s{2,}/g, " ").trim();
    const limit = n || 158;
    if (s.length <= limit) return s;
    const cut = s.slice(0, limit - 1);
    return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\-–—]$/, "") + "…";
  });

  eleventyConfig.addFilter("withUtm", function (url, planId) {
    try {
      const u = new URL(url);
      u.searchParams.set("utm_source", "triaperformance");
      u.searchParams.set("utm_medium", "website");
      u.searchParams.set("utm_campaign", "plan_storefront");
      u.searchParams.set("plan_id", planId);
      return u.toString();
    } catch (e) {
      return url; // malformed URL — fail open rather than break the page build
    }
  });

  // ---------------------------------------------------------------------------
  // formatWeeklyStat — renders one weekly-breakdown value (avg duration or
  // longest session) for display. Source units are inconsistent by design
  // (running/biking/strength are "duration" HH:MM:SS, swimming is "meters",
  // a handful are "mi") — this normalizes the common HH:MM:SS→H:MM case
  // (drops a leading "00:" hour) and passes other units through with a label.
  // ---------------------------------------------------------------------------
  eleventyConfig.addFilter("formatWeeklyStat", function (value, unit) {
    if (!value) return "—";
    if (unit === "duration") {
      const m = value.match(/^(\d{2}):(\d{2}):(\d{2})$/);
      if (!m) return value;
      const h = parseInt(m[1], 10), min = m[2];
      return h > 0 ? `${h}:${min} h` : `${parseInt(min, 10)} min`;
    }
    if (unit === "meters") return `${value} m`;
    if (unit === "mi") return `${value} mi`;
    return value;
  });

  // ---------------------------------------------------------------------------
  // facetValues — unique, sorted, non-empty values of a field across a plan
  // list. Used to build the catalog's facet checkboxes server-side from
  // whatever the data actually contains, rather than a hand-maintained list
  // that drifts from the CSV.
  // ---------------------------------------------------------------------------
  eleventyConfig.addFilter("facetValues", function (plans, key) {
    const set = new Set();
    for (const p of plans || []) { if (p[key]) set.add(p[key]); }
    return Array.from(set).sort();
  });

  // ---------------------------------------------------------------------------
  // facetCrossMap — for each distinct value of `valueKey` across plans, the
  // sorted set of `groupKey` values it co-occurs with. Built to make one
  // facet group depend on another client-side (distance/enfoque options
  // narrowed to whatever's actually relevant to the checked sport(s), rather
  // than always listing every distance value in the whole catalog — e.g.
  // "1900m" is a swim distance and has no business showing up once Running
  // is checked). Computed from the real data, same reasoning as facetValues.
  // ---------------------------------------------------------------------------
  eleventyConfig.addFilter("facetCrossMap", function (plans, valueKey, groupKey) {
    const map = {};
    for (const p of plans || []) {
      const v = p[valueKey], g = p[groupKey];
      if (!v || !g) continue;
      (map[v] = map[v] || new Set()).add(g);
    }
    const out = {};
    for (const v in map) out[v] = Array.from(map[v]).sort();
    return out;
  });

  // ---------------------------------------------------------------------------
  // zonePlans — the plans the zones calculator offers after the email capture.
  //
  // Selected by RULE, not by a hardcoded ID list: sport + the inventory's
  // `distance` column doubling as a goal facet (Cycling has FTP/VO2Max,
  // Swimming has Speed). That keeps the block correct as the catalogue changes,
  // instead of pointing at plan IDs that were true in August 2026.
  //
  // Running deliberately returns nothing: its plans are organised by race
  // distance, so there is no "improve your threshold" set to select. The page
  // renders an honest empty state rather than a marathon plan relabelled as a
  // threshold plan. Hand-picked IDs pending — see zones-calculator-brief.md §4b.
  // ---------------------------------------------------------------------------
  eleventyConfig.addFilter("zonePlans", function (plansForLang, sportName, goals, limit) {
    if (!plansForLang || !goals || !goals.length) return [];
    return plansForLang
      .filter((p) => p.sport === sportName && goals.includes(p.distance))
      .sort((a, b) => (a.weeks || 0) - (b.weeks || 0))
      .slice(0, limit || 3);
  });

  // Absolute URL helper, for canonical and hreflang tags.
  eleventyConfig.addFilter("absoluteUrl", function (path) {
    const base = "https://triaperformance.com";
    if (!path) return base + "/";
    if (path.startsWith("http")) return path;
    return base + path;
  });

  // Filter a post collection to one language.
  //
  // Do NOT use Nunjucks' `selectattr("data.lang", ...)` for this: Nunjucks does
  // not resolve dotted attribute paths the way Jinja2 does, so it silently
  // returns an empty list rather than erroring. That shipped a live blog index
  // reading "no articles published" while the article existed. (July 2026)
  eleventyConfig.addFilter("byLang", (posts, lang) =>
    (posts || []).filter((p) => p.data.lang === lang)
  );

  // Machine-readable date for <time datetime="...">. Nunjucks has no built-in
  // `date` filter — that one is Liquid's — so it's defined here.
  eleventyConfig.addFilter("htmlDate", (d) =>
    new Date(d).toISOString().slice(0, 10)
  );

  // Readable post dates, per language.
  eleventyConfig.addFilter("postDate", (d, lang = "es") => {
    const locale = { es: "es-AR", en: "en-US", pt: "pt-BR" }[lang] || "es-AR";
    return new Date(d).toLocaleDateString(locale, {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
    });
  });

  return {
    dir: {
      input: "site",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
