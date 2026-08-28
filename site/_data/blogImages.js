/**
 * Which blog images actually exist on disk, resolved once at build time.
 *
 * WHY A DATA FILE AND NOT A TEMPLATE CHECK
 * Nunjucks can't ask the filesystem whether a file exists, so a template that
 * hardcodes `/assets/images/blog/topics/running.jpg` renders a broken <img>
 * until someone remembers to add the file. Globbing here inverts that: drop a
 * correctly-named image into the folder and it appears on the next build; take
 * it away and the card falls back to its coloured treatment. Nothing to wire up
 * per image, and no state that can disagree with the folder.
 *
 * RESOLUTION ORDER, per article (applied by the `cardImage` filter):
 *   1. articles/<slug>.jpg   — this article's own photo, pinned
 *   2. topics/<topic>*.jpg   — one of the topic's photos, picked from the slug
 *   3. nothing               — coloured card, still fine
 *
 * Step 3 is the point. The blog had to look right the day this shipped, with
 * zero images in the repo, or the layout work would have been blocked on
 * sourcing nine photos first. Images improve these cards; they are not load
 * bearing.
 *
 * NAMING
 *   topics/running.jpg                       one photo for the topic
 *   topics/running-1.jpg, running-2.jpg …    several; one is picked per article
 *   articles/durabilidad-maraton-evitar-muro.jpg   overrides for one article
 *
 * The numbered variants exist because a single photo per topic means every
 * running article shows the same picture — and filtering the listing to
 * Running then renders five identical cards, which looks worse than no photos
 * at all. Variants give the grid variety with no per-article work: drop files
 * in, the filter spreads them.
 *
 * Trailing `-<digits>` is the only thing stripped, so `weight-loss-2.jpg`
 * correctly groups under `weight-loss` and not `weight`.
 *
 * CAVEAT worth knowing: which photo an article gets is derived from the pool
 * size, so ADDING a photo to a topic reshuffles that topic's assignments. The
 * choice is stable across builds, not across folder changes. If a specific
 * article must keep a specific photo, that is what articles/<slug>.jpg is for.
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "assets", "images", "blog");
const EXT = /\.(jpe?g|png|webp|avif)$/i;

/** One path per basename — used for articles/, where names are unique. */
function indexFlat(sub) {
  const full = path.join(DIR, sub);
  const out = {};
  if (!fs.existsSync(full)) return out;
  for (const f of fs.readdirSync(full)) {
    if (!EXT.test(f)) continue;
    out[f.replace(EXT, "")] = `/assets/images/blog/${sub}/${f}`;
  }
  return out;
}

/** Arrays keyed by topic — `running.jpg` and `running-3.jpg` both land on `running`. */
function indexPools(sub) {
  const full = path.join(DIR, sub);
  const out = {};
  if (!fs.existsSync(full)) return out;
  // Sorted so the pool order is identical on every machine; readdirSync order
  // is filesystem-dependent and would otherwise make builds differ between
  // Iván's Mac and the VPS for no visible reason.
  for (const f of fs.readdirSync(full).sort()) {
    if (!EXT.test(f)) continue;
    const key = f.replace(EXT, "").replace(/-\d+$/, "");
    (out[key] = out[key] || []).push(`/assets/images/blog/${sub}/${f}`);
  }
  return out;
}

module.exports = () => {
  const topics = indexPools("topics");
  const articles = indexFlat("articles");
  const topicFiles = Object.values(topics).reduce((n, a) => n + a.length, 0);
  return {
    topics,
    articles,
    // So a build log or a future audit can tell "no images yet" apart from
    // "images broken".
    count: topicFiles + Object.keys(articles).length,
  };
};
