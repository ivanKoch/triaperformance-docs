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

  // Absolute URL helper, for canonical and hreflang tags.
  eleventyConfig.addFilter("absoluteUrl", function (path) {
    const base = "https://triaperformance.com";
    if (!path) return base + "/";
    if (path.startsWith("http")) return path;
    return base + path;
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
