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
 * RESOLUTION ORDER, per article:
 *   1. `heroImage` in the article's own front matter  — a specific photo
 *   2. topics/<topic>.jpg                             — the topic's default
 *   3. nothing                                        — coloured card, still fine
 *
 * Step 3 is the point. The blog had to look right the day this shipped, with
 * zero images in the repo, or the layout work would have been blocked on
 * sourcing nine photos first. Images improve these cards; they are not load
 * bearing.
 *
 * NAMING: topics/<topic-slug>.jpg|jpeg|png|webp — the slug from i18n.json's
 * closed topic list. Anything else is ignored on purpose, so a stray file
 * can't half-appear.
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "assets", "images", "blog");
const EXT = /\.(jpe?g|png|webp|avif)$/i;

function indexDir(sub) {
  const full = path.join(DIR, sub);
  const out = {};
  if (!fs.existsSync(full)) return out;
  for (const f of fs.readdirSync(full)) {
    if (!EXT.test(f)) continue;
    out[f.replace(EXT, "")] = `/assets/images/blog/${sub}/${f}`;
  }
  return out;
}

module.exports = () => {
  const topics = indexDir("topics");
  const articles = indexDir("articles");
  return {
    topics,
    articles,
    // Convenience for the templates: how many exist, so a build log or a future
    // audit can tell "no images yet" apart from "images broken".
    count: Object.keys(topics).length + Object.keys(articles).length,
  };
};
