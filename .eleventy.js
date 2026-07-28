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

module.exports = function (eleventyConfig) {
  // ---------------------------------------------------------------------------
  // Static assets. Images, PDFs and marketplace artwork are copied through
  // untouched. They still live under website/ during the migration so the
  // current live site keeps working; move them into site/assets/ once the
  // last page is migrated and website/ is deleted.
  // ---------------------------------------------------------------------------
  eleventyConfig.addPassthroughCopy({ "website/images": "images" });
  eleventyConfig.addPassthroughCopy({ "website/hubfs": "hubfs" });
  eleventyConfig.addPassthroughCopy({ "website/guias": "guias" });
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
