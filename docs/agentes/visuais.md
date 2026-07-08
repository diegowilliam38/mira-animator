# Visuals & data

Static visuals, charts, QR codes, true 3D and image-driven templates.

## `/mira-visuals`
Static images for slides: panels, diagrams, charts and infographics — when a concept is better shown as a fixed, dense visual than as motion.

## `/mira-chart`
Turns data into charts with impact: from a CSV/JSON, from an image of a chart, or from a hand-drawn sketch — and recommends the best chart type from a gallery.

## `/mira-chart-race`
Turns temporal data into an **animated race**: from a wide-format CSV (the first column is the period, the others are the series), it builds a slide where time runs on screen and the chart animates once to the end. Two modes to choose from: **bars** that swap rank position each period, or **lines** drawn progressively with the label chasing the tip. The data stays embedded in the slide (no `fetch`), so it runs from `file://` and offline. For a static chart use `/mira-chart`.

## `/mira-qrcode`
Inserts a large, centered, scannable **QR code** into a slide, generated from a link or text you provide. The QR is generated **locally** at build time (the `qrcode` npm package) and embedded as an inline SVG, with no runtime dependency, no external API and no CDN, so the slide works even from `file://`. Clean card, same pattern as `mira-3d`: just the slide title and the big QR, with no link caption underneath. Scannability drives the style: dark modules on a white card, quiet zone preserved, orange only on the frame and title. The QR stays static: the internal loop lives in the frame (glow pulse, breathing corners), never over the modules.

## `/mira-3d`
Adds a **true 3D element** to a slide's canvas (real depth, continuous auto-rotation and drag-to-rotate / zoom interaction) in a clean card where the element is maximized. It picks one of three layers from your request: pure CSS 3D (simple shapes), procedural Three.js (abstract forms like particle spheres and node networks, or low-poly objects built from primitives), or glTF (when you provide a `.glb`, or accept a search for a free, licensed model on the web). It inherits the mother-rule: the 3D never enters static, so auto-rotate pauses on drag and resumes.

!!! warning "The glTF layer needs a server"
    A slide that loads a local `.glb` does **not** open from `file://` (the browser blocks the model fetch), only over HTTP. In that case the agent starts a local server, hands you the `http://localhost` link, and writes a double-click launcher (`abrir-slide.cmd`) so you can present later. This layer needs **Node.js** installed. The CSS 3D and procedural layers use no local asset and open straight from `file://`, with no server.

## `/mira-svg-morph`
Generates a slide where one SVG shape **morphs into another**, in a continuous loop, with GSAP + MorphSVGPlugin vendored locally (the deck runs offline, from `file://`). You point it at 2 or more `.svg` files in the deck's `assets/`, in morph order: 2 SVGs go back and forth, N SVGs chain (A into B into C ... back to A). It inlines the `<path>`s with unique ids (no collision between several SVGs in one document), runs `convertToPath` on non-path shapes, and builds the loop. Clean card, same pattern as `mira-3d`: just the title and the shape morphing large and centered, in orange #FF904D. MorphSVG morphs path into path (not whole SVG into whole SVG): multi-path morphs pair by pair, only the silhouette morphs, and it is cleanest when both SVGs share the same viewBox. For dense or emergent metaphors (particles, explosions) use `mira-animator` instead.

## `/mira-icon-morph`
The same morph, but from **concepts in words** when you do not have the files. You say "a cloud turning into a lightbulb"; it searches the Iconify API, validates the license, downloads the SVGs, inlines them and builds the morph. It prefers single-path icons in viewBox 0 0 24 24 (they morph clean), uses only open licenses (MIT, Apache-2.0, CC0 or CC-BY), records attribution in the deck's `CREDITS.md`, and refuses protected IP (franchise characters), suggesting original art. The internet is used only at build time; the final deck stays offline. Reuses the render core of `mira-svg-morph`.

## `/mira-svg-animator`
Animates an SVG you provide, giving the shape its own motion (it does not turn into another shape, that is morph). You pass one `.svg` and describe the motion in words: flap wings, spin a wheel, slide, pulse, draw the outline, follow a curve. It picks the GSAP technique to match: transform (rotate/scale/translate), DrawSVG (the stroke draws itself) or MotionPath (motion along a curve). Key point: to animate a part, the part must be a separate element; if the SVG is a single merged path, it splits the part (clip by an axis, or edit the path to isolate or remove a segment, like keeping the antennae still). It also removes opaque backgrounds and sets the motion origin (the hinge or rotation center). Loop and `prefers-reduced-motion` honored; vendored GSAP, works from `file://`.

## `/mira-animated-typing`
Generates the **"prompt typed in zoom"** scene: a single line of giant terminal monospace type on a dark background, typed character by character with a Windows-style blinking bar cursor, simulating someone writing a command to an agent harness (Claude Code, Codex). When the typing point reaches 100px before the right edge, the whole text slides left keeping the cursor anchored (sliding window). You pass the text as the argument and can color spans with the `color=#HEX` tag (the tag never shows; the rest is white). When it finishes, it pauses with the cursor blinking and restarts in a loop. Pure JS/CSS, zero dependencies, works from `file://`.

## `/mira-image-template`
Creates a **new deck template from image(s)**. You send screenshots of screens/slides and/or the logo, and the agent recognizes the whole design system (colors, background, typography, corners, shadows, glassmorphism, glows) and, when a screenshot is given, the **arrangement of the elements**, then builds a complete template: the skeleton `mira-templates/decks/<name>/index.html` with the identity embedded, plus the theme `mira-templates/themes/<name>.css`. At the end it asks for a **name** and saves. The template is then offered by `/mira-new` alongside the existing ones, and its same-name theme becomes the natural default. The screenshot drives the layout; the logo drives the palette.
