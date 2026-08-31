/* Credentials band rows, resolved per language. Added August 27, 2026.
 *
 * Why this file exists rather than doing the work in the template: the band
 * groups credentials by ISSUING BODY, so one tile can carry more than one
 * credential (TrainingPeaks issued both Level 2 Accredited and Coach Match).
 * Joining those captions in Nunjucks needs array mutation inside nested loops,
 * which Nunjucks does not have — `caps.push(...)` throws, and emitting the
 * separator inline produced doubled and trailing dots because the inner loop
 * cannot know whether the outer one has more to come.
 *
 * The important property is preserved: credentials.json `items` remains the
 * single owner of every credential name. This file only looks ids up and
 * joins. Add a credential to `items`, add its id to a band row, done.
 */
const credentials = require("./credentials.json");

module.exports = function () {
  const out = {};
  for (const lang of ["es", "en", "pt"]) {
    const byId = Object.fromEntries(credentials[lang].items.map((i) => [i.id, i]));
    out[lang] = credentials.band.map((row) => {
      const caps = row.items.map((id) => {
        const item = byId[id];
        if (!item) {
          // Fail loud, same reasoning as the `v` cache-bust filter (§17): a band
          // row pointing at a deleted credential should stop the build, not
          // silently render a tile with a logo and no caption.
          throw new Error(
            `credentialsBand: band row "${row.org}" references item id "${id}", ` +
            `which does not exist in credentials.${lang}.items`
          );
        }
        // The caption IS the full mark. Derived from `name` rather than stored
        // separately so there is no second copy of a credential name to drift.
        // `captSuffix` carries only what is not part of the mark itself — the
        // IRONMAN U year, the ESCI organisation name spelled out.
        return item.name + (item.captSuffix || "");
      });
      return { org: row.org, logo: row.logo, markType: row.markType, capt: caps.join(" · ") };
    });
  }
  return out;
};
