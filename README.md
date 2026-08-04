# Benchmark Golf — hero visualiser

The Benchmark Golf homepage rebuilt from `Home.pdf`, with the hero replaced by a
**drag-and-drop video visualiser** for reviewing hero-asset variations side by side.

## Using it

Drop video files anywhere on the page (or hit **Choose files**). Every clip is slaved to
one master clock, so **clips dropped at different moments land on the same frame** — drop
variation 1, watch it, drop variations 2 and 3 a minute later, and all three play together
from the same instant.

| | |
|---|---|
| `Space` | play / pause |
| `←` `→` | nudge 1s |
| `⇧` `←` `→` | step one frame |
| `R` | restart |
| `F` | fullscreen |
| `M` | mute all |

Per clip: **speaker** solos its audio, **±** shifts that clip's offset by 100 ms (for takes
that start late), **×** removes it. The layout re-flows automatically as clips are added.

Speed (¼×–2×), loop, and the scrubber apply to every clip at once.

Files never leave the browser — they're read as object URLs, nothing is uploaded. That also
means teammates open the same link and drop **their own** clips.

## Assets

Every image is lifted from the source comp: photography extracted from the PDF's embedded
JPEGs, product renders cropped from the page and alpha-keyed so they sit on any background.
Type is Hanken Grotesk (self-hosted), sized to match the comp's measured text widths.

FAQ answers 2–4 are written to match the brand voice — the comp only shows them collapsed.

## Running locally

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>. No build step, no dependencies.
