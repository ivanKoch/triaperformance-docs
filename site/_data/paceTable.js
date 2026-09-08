/* Reference table for the pace converter — generated at BUILD time, not by JS.
 *
 * Why a data file and not a Nunjucks loop: Nunjucks has no usable arithmetic for
 * this, and doing it in the browser would leave the page with no body copy at
 * all for a crawler. The zones hub already carries that SEO trade-off knowingly
 * (see calculadora-de-zonas/index.njk); this page does not need to repeat it —
 * the table IS the page's indexable content, and it is exactly what someone
 * searching "5:00 min/km en millas" wants to land on.
 *
 * One row every 15 seconds from 3:00 to 8:00 per km — the range real endurance
 * athletes train and race in. Below 3:00 and above 8:00 the rows stop being
 * looked up and start being filler.
 *
 * The conversion constant lives here and in assets/js/pace-converter.js. That
 * is the one duplication in this tool and it is deliberate: 1 mile = 1.609344 km
 * is an exact definition, not a figure that can move.
 */
const MI = 1.609344;

const pad = (n) => String(n).padStart(2, "0");
const clock = (sec) => {
  const t = Math.round(sec);
  return Math.floor(t / 60) + ":" + pad(t % 60);
};

module.exports = () => {
  const rows = [];
  for (let s = 180; s <= 480; s += 15) {
    rows.push({
      km: clock(s),
      mi: clock(s * MI),
      kmh: (3600 / s).toFixed(1),
      mph: (3600 / s / MI).toFixed(1),
    });
  }
  return rows;
};
