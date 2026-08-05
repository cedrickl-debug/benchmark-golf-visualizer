# Benchmark Golf — hero preview

A drag-and-drop tool for reviewing hero-asset variations, built from the `Home.pdf` comp.

**<https://cedrickl-debug.github.io/benchmark-golf-visualizer/>**

## What it does

The page opens with two **sets** — a **desktop** frame (1920×985) beside a **mobile** frame
(375×891), twice over — each rendered at its real breakpoint size and then scaled down, so
proportions match the comp exactly rather than being approximated. **Set** adds another pair.

The mobile frame is measured straight off `Product Page _ Golf At Home - Mobile.png` (1125px
wide, i.e. 375pt @3×) and divided by three, so the copy stack — centred headline, the three
rule-separated awards, the full-width pill, the 2 × 2 tile grid — lands where the comp puts it.

Drop a video **on a frame** to load just that one. Drop several **anywhere** and they fill
every frame in order, spawning extra desktop frames if you have more clips than frames.
Add frames with the **Desktop** / **Mobile** buttons — each orientation owns its own track.
A new horizontal frame stacks **under** the horizontals; a new vertical lands to the **right**
of the verticals, so you can line several phone variations up beside each other.

Every clip runs off one master clock, so **variations dropped at different moments still sit
on the same frame** — load variation 1, watch it, drop 2 and 3 a minute later, and all three
play together from the same instant.

| | |
|---|---|
| `Space` | play / pause |
| `←` `→` | nudge 1s |
| `⇧` `←` `→` | step one frame |
| `R` | restart |
| `M` | mute all |

Speed (¼×–2×), loop and the scrubber drive every frame at once. The speaker button solos
one frame's audio. A frame whose clip is shorter than the longest one dims and holds its
last frame rather than looping on its own.

Files never leave the browser — they're read as object URLs, nothing is uploaded. Teammates
open the same link and drop **their own** clips; the link carries the tool, not the footage.

## Also here

`reference.html` — the full Benchmark Golf homepage rebuilt from the comp, if you need the
sections below the hero. Photography is extracted from the PDF's embedded JPEGs; product
renders are cropped from the page and alpha-keyed so they sit on any background. Type is
Hanken Grotesk, self-hosted, sized against the comp's measured text widths.

FAQ answers 2–4 on that page are written to match the brand voice — the comp only shows
them collapsed.

## Running locally

```
python3 -m http.server 8000
```

No build step, no dependencies.
