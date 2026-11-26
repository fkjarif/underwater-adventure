# Underwater Adventure w/ FKJ

**Pilot a research submersible through the dreamy Abyssal Garden — right in your browser.**

A faithful evolution of [Abyssal Garden by Noniv](https://github.com/Noniv/abyssal-garden): the same towering kelp forests, sunbeams, shipwreck, purple grotto and manta rays — now explored from inside a fully-modelled, physics-driven submersible.

![Submersible in kelp forest](.github/screenshots/whale-fluke.jpg)

## Try it

1. Download [`index.html`](index.html) (~115 KB, ~45 KB gzipped).
2. Open it in **Chrome** or **Edge** on desktop (WebGPU required).
3. Wait for “Building the abyss…”, then press **Dive In**.

Works offline. If you see “This scene needs WebGPU”, update Chrome/Edge.

## The world

Preserved from the original:

- Kelp forests with animated leaves and gold/green sparkles
- Cyan → deep-blue depth gradients, god rays, caustics, shimmering surface
- Rock canyons, arches, tunnels, overhangs, floating boulders
- Purple/pink foliage, magenta ground cover, barrel sponges, coral
- Manta rays, fish schools, rising bubbles, drifting particles
- Sunken wooden ship + stone whale-fluke sculpture
- Purple grotto
- Procedural soundscape (rumble, whale calls, chimes, bubbles)

## The submersible

Compact futuristic research vessel, procedurally generated (no external models):

- Streamlined hull with orange accent stripe
- Transparent canopy, headlights, nav lights
- Side propulsion pods, vertical thrusters, rear propeller
- Propellers animate with thrust, lights visible, subtle bob

## Controls

### Desktop

| Action | Keys |
|---|---|
| Forward / Reverse | W / S or ↑ / ↓ |
| Steer left / right | A / D or ← / → |
| Ascend | Space |
| Descend | Ctrl (either) |
| Boost | Hold Shift |
| Camera | C (toggle chase / cockpit) |
| Sonar ping | R |
| Pause | Esc or ≡ |
| Mute | M |
| Stats | H |

All keys support continuous hold; arrow keys and WASD are interchangeable. Brake via drag when releasing thrust.

### Mobile

- **Left stick** – push forward to accelerate, back to reverse, left/right to steer
- **Right slider** – up to ascend, down to descend
- **⚡ Boost**, **◉ Camera**, **Ⅱ Pause** buttons
- Multitouch supported (steer while ascending)
- Landscape recommended; portrait auto-rotates via CSS

### Camera

- **Third-person (chase)** – default, follows behind & slightly above, smooth follow, terrain-aware (won’t clip through rock)
- **First-person (cockpit)** – inside canopy, headlights visible, integrated HUD, subtle frame

Switch with C (desktop) or camera button (mobile). Transitions preserve position/velocity.

### HUD

Bottom bar shows depth (m), speed (knots), boost state, heading, camera mode. In cockpit, a centered depth/speed/heading readout appears. Stats (H) show FPS, frame times, GPU time, resolution.

## Audio

Procedural Web Audio — no sound files:

- Deep rumble, surface wash, drone, chimes, whale calls (original)
- Propulsion hum that rises with thrust, thruster whoosh, boost layer, sonar ping

Mute with M or pause menu.

## Detail levels

Same adaptive system as original (High/Medium/Low):

| Level | What changes | Default for |
|---|---|---|
| High | Full foliage, shadows, 4× MSAA, 34 ray steps | Desktops |
| Medium | Half leaves/sparkles, fewer shadows | 8 GB phones |
| Low | Quarter leaves, no MSAA, coarser meshes | Low-memory devices |

If load crashes or GPU is lost, next visit drops one level. Resolution and draw distance auto-tune for 60 fps.

## Performance

Built for 60 fps; dynamic resolution + draw-distance scaling. Original target reference: 180 fps @ 2560×1440 on RTX 5070 Ti. Mobile targets 30 fps stable, 60 fps on capable hardware.

## Source & Build

Modular source in [`source`](source) — still WebGPU + WGSL, no Three.js/Babylon, no texture files. Final distributable is self-contained `index.html`.

```bash
cd source
npm install
npm run build          # minified index.html (production)
npm run build:readable # readable index.html for debugging
npm run build:dev      # dev.html + fly-through tools
```

Source files:

- `quality.js` – detail level + storage
- `math.js` – noise, quaternions, mesh helpers
- `shaders.js` – WGSL (includes submarine shader `W_SUB`)
- `world.js` – world layout & procedural population
- `submarine.js` – procedural submersible meshes
- `main.js` – renderer, vehicle physics, camera, input, HUD
- `audio.js` – procedural ambience + vehicle audio

Bundle size (minified): **~115 KB** ( **~45 KB gzipped** ).

## License

MIT — © 2026 Maksymilian Dendura (original Abyssal Garden). Submersible game evolution by FKJ fork; same license. See [LICENSE](LICENSE).

## Attribution

Original project: **Abyssal Garden** by Noniv — https://github.com/Noniv/abyssal-garden
