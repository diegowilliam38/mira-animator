# Responsive agents

Square, vertical and rule-of-thirds versions of a deck, plus the 9:16 recording studio.

## `/mira-squared`
Generates a **square** (1:1) version of a deck from the 16:9 original, or creates square slides from scratch. Each content slide keeps only the main title at the top and the animation in a standardized square canvas below; the animation's axis is **reworked per metaphor to fill the square** (no black bars), the title auto-shrinks to two lines, and each animation's `viewBox` is matched to the square. The square's side equals the 16:9 height (`100vh`), centered, with **gray #333 side margins**. Writes a new `index-1x1.html` next to the original. For Instagram feed, LinkedIn, etc.

## `/mira-vertical`
Generates a **vertical** (9:16) version. Each content slide keeps only the main title at the top and a tall, standardized animation canvas below; the title auto-shrinks to fit at most two lines, and each animation's axis is reworked for portrait (horizontal flow becomes vertical, side-by-side comparison becomes stacked). Writes `index-9x16.html`. For Reels, Shorts, TikTok, Stories.

## `/mira-thirds`
Reframes a deck on the **rule of thirds** without changing the aspect ratio. Pushes each slide's content (title + animation) into columns 1 and 2 of a 3×3 grid (the left two-thirds) and paints the right column **gray #333, 100% clean** — for you to overlay text, a lower-third or the presenter's camera in editing. The animation is **reworked per metaphor to fill the two-thirds box** (no thin strip). Works on top of 16:9, 1:1 or 9:16. Writes a `-thirds` file. Gray side is the right by default; can be flipped.

## `/mira-studio`
Creates a **9:16 recording deck** (1080×1920) where the presenter's webcam is embedded **live inside the slide** via getUserMedia — no chroma key needed. Each content slide declares one of three layouts: `camera` (webcam fills the column), `split` (square animation on top + camera below) or `full` (full-column vertical animation). Without a camera the area falls back to pure chroma green #00FF00. A side panel (or the **R** key) records only the 9:16 column to a native 1080×1920 MP4 (H.264) via Region Capture; OBS window capture remains an alternative. The panel shows the active GPU (e.g. `GPU - NVIDIA GeForce RTX 4070`) and has an OBS-style encoder selector listing **all** GPUs on the machine — **Auto / active GPU / other GPUs / CPU (software)** — with a real encode test on selection (picking a non-active GPU guides you to reopen via the launcher). On hybrid laptops, the `mira-studio-windows.bat` launcher in the deck root starts the local server (`mira/mira-studio-server.cjs`, which also feeds the panel the real GPU names) and opens a dedicated Chrome on the high-performance GPU via Chrome's official flag, without touching the Windows registry; closing the window shuts the server down. For Reels, Shorts, TikTok and video lessons with the presenter on screen.
