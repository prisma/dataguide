# Section artwork

Each section of the Data Guide has a small scene in which Prismo, the Prisma mascot, does something with the section's subject. The site shows it in the section's card on the homepage and at the top of the section's pages (see `src/components/sectionArt.tsx`).

The SVGs are generated. Change a scene's `scene_<name>.py` (or the shared `kit.py`), then run:

```bash
python3 src/images/section-art/generate.py          # all scenes
python3 src/images/section-art/generate.py intro    # one scene
```

To give a new section a scene, add `scene_<section>.py`, generate it, add it to `themes` in `sectionArt.tsx` with its `viewBox` width / height as the `ratio`, and put `<SectionArt theme="<section>" />` under the section's heading in `content/index.mdx`.

## Style rules

These keep the scenes consistent with each other and with the [Prisma brand kit](https://www.prisma.io/brand-kit).

- **Prismo:** always draw him with `kit.prismo()`, never a copy. He stays whole and nearly level (`tilt` of 6° at most). Point his eyes at the action with `face` and `eye_drop`.
- **Hands:** use `kit.hand()`. They float, with no arms. Use `part='thumb'` and `part='body'` to put the thumb behind an object and the fingers in front of it. A hand should hold, push or rest on something, never hover.
- **One clear action:** each scene shows a single action, readable at 250px wide. Show movement with `kit.speed_lines()`, and show where something is going with a dashed slot or a faint ghost of the object.
- **Materials:** everything is chrome or glass: `glass_panel`, `glass_slab`, `glass_database`, or local shapes filled with `url(#glass)` and finished with `url(#sweep)` (7–20%), `url(#rim)` and `url(#prismEdge)`. Every object gets the shared `url(#soft)` shadow. Don't add floor shadows.
- **Colours:** use the three prism colours (cyan `#01D7E4`, yellow `#F3C306`, red `#F34A60`) and neutrals only. The visor bands are never recoloured.
- **Depth:** overlap the objects (Prismo in front of or beside the main object, the held object in front) so they read as one scene.
- **Avoid:** text, letters and third-party logos (no elephants, dolphins or leaves), and decorative sparkles.
- **Canvas:**
  - Crop the `viewBox` to the content.
  - Objects may bleed off the top and right edges, where the card crops them.
  - The site fades the bottom 20% of the image and aligns it to the card's top-right corner. Keep Prismo and the action above that fade, and don't let anything cut off at the left edge.
  - Scenes are shown at up to 256×200px on the homepage and 216×168px on section pages.
