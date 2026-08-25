# Blog card images

Optional. The listing renders a topic-coloured panel when no file is here, so
the grid is complete with none of these present — photos are an upgrade, not a
dependency. Nothing breaks if this folder stays empty.

## Where files go

    topics/<topic>.jpg      one image per topic, reused by every article on it
    articles/<slug>.jpg     overrides the topic image for one article

`<topic>` is a slug from the closed list (see `site/_data/i18n.json`):

    running  cycling  swimming  triathlon  nutrition
    recovery  physiology  strength  weight-loss

`<slug>` is the article's filename without `.njk` — e.g. an image for
`site/blog/durabilidad-maraton-evitar-muro.njk` goes at
`articles/durabilidad-maraton-evitar-muro.jpg`.

`.jpg`, `.jpeg`, `.png`, `.webp` and `.avif` are all recognised. Anything not
matching these names is ignored on purpose, so a stray file can't half-appear.

## Sizing

Cards crop to 16:10, the lead card to 2:1, and the largest render is about
700px wide. **Resize to ~1400px wide and compress before committing** — these
are static files in a git repo served straight off the VPS, with no image
pipeline to resize them. A 4MB original will be sent to every visitor at full
size, on mobile data, forever.

## Licensing

Licensed stock is permitted **for these cards only**, per the August 24, 2026
amendment to `brand-guidelines.md` §6. AI-generated athletes remain prohibited
everywhere, and article heroes and marketing pages still take real photography
or nothing. Unsplash and Pexels both permit commercial use without attribution;
attribution is still good manners where the photographer asks for it.

Prefer images that read at thumbnail size and don't fight the topic colour
behind them: a wide landscape with a clear subject beats a busy crowd shot.
