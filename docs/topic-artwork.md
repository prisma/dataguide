# Topic artwork

These are custom illustrations generated with the built-in image-generation tool, inspired by
[Prisma's brand kit](https://www.prisma.io/brand-kit). They are experimental adaptations of
Prismo, not official mascot poses.

- `src/images/topic-themes/prismo-database-scene.webp`: Prismo inserting a data card into a database stack.
- `src/images/topic-themes/prismo-tuple-scene.webp`: Prismo aligning a tuple with an empty table row.

Each image includes its own character, data objects, lighting, and isometric ground in one
cohesive scene. The transparent PNG outputs are resized proportionally to 720 × 540 WebP
files with their alpha channels preserved. The site uses one decorative CSS background per
topic, shared by its homepage box, hub, and article headers.

References: the brand kit's [salute](https://www.prisma.io/brand-kit/mascot/salute.png) and
[thinking](https://www.prisma.io/brand-kit/mascot/thinking.png) mascot images, plus the initial
topic diagrams. The generated modeling scene was also a style reference for the introduction
scene. These are decorative illustrations, not executable examples or precise schema diagrams.

## Generation prompts

### Data modeling

```text
Use case: stylized-concept.
Asset type: cohesive decorative illustration for the Data modeling topic card and article headers in Prisma's Data Guide.
Input images: image 1 is ONLY a reference for Prismo's character identity, chrome round head, small pedestal base, expressive dark eyes and horizontal cyan/yellow/coral visor bands. Image 2 is ONLY a reference for the topic's relational tables, delicate isometric geometry and restrained coral/cyan/yellow accents.
Primary request: create a NEW scene of Prismo actively studying a relational table and carefully placing a tuple into it. Do not reuse the reference pose or paste the mascot over a separate diagram. Build the robot, table and tuple as one coherent 3D illustration with the same perspective, light and materials.
Scene: Prismo on the left, shown in three-quarter view with its gaze directed toward a larger floating table on the right. Two small articulated chrome hands reach toward the table. One hand is holding a single horizontal row strip with FOUR aligned cells, just in front of the matching empty row in the table. The other hand steadies the table edge. The table is an upright gently angled translucent rectangular panel with exactly FOUR columns and four rows; one bottom row is an empty slot matching the row being inserted. This is a tuple/row, NOT a cube, a puzzle piece or an extra table. A small secondary linked table and one subtle connecting line behind the main table suggest relationships without clutter.
Style: refined softly lit 3D editorial miniature, brushed silver and translucent frosted glass, crisp readable table geometry, gently curious robot expression. Restrained Prisma cyan #01D7E4, yellow #F3C306 and coral #F34A60 accents. Pale rose reflections suit a near-white coral background. Tiny subtle isometric floor grid integrated below the scene, fading out.
Composition: compact landscape 4:3 isolated vignette, table slightly larger than mascot, clear storytelling at 300px wide. Keep the entire character and objects inside the frame, level base, generous transparent margin, no cropping. One integrated illustration, not multiple stickers.
Lighting: soft consistent studio lighting and subtle contact shadows that ground both character and table together.
Constraints: genuinely transparent background; no background rectangle, no scenery, no text, letters, numbers, captions, logos, watermark or UI buttons. Keep recognizable visor band order and colors. No duplicated mascot, no face looking at viewer, no salute, no hand-on-chin thinking pose.
```

### Introduction to databases

```text
Use case: stylized-concept.
Asset type: cohesive decorative illustration for the Introduction to databases topic card and article headers in Prisma's Data Guide.
Input images: image 1 is a STYLE reference for the matching Data modeling illustration: one cohesive softly lit chrome Prismo interacting with a translucent data object, delicate isometric floor grid, colored accents and transparent surroundings. Image 2 is ONLY the mascot identity reference, not the requested pose. Image 3 is ONLY reference for the topic's database stack and cyan isometric geometry.
Primary request: make a matching NEW illustration of Prismo actively learning how to organize data by placing a small data card into a database stack. The robot and database must be physically integrated into one scene, all sharing perspective, materials and lighting. No pasted floating mascot.
Scene: Prismo on the left in three-quarter view, eyes looking at a large frosted-glass database cylinder on the right. The cylinder has THREE distinct stacked circular layers and a subtle narrow insertion slot in its middle layer. One articulated chrome hand carefully slides a single small rectangular data card with three tiny cyan/yellow/coral cells into that slot. The other hand steadies the database rim. One additional card lies flat nearby, suggesting organizing and storing data. A very faint cyan translucent rectangular pane behind the database supports the composition without clutter.
Style: match image 1 exactly in finish and world: refined soft 3D editorial miniature, brushed silver, frosted glass, rounded geometry, soft reflections. Prismo should have its round chrome head and pedestal base, dark expressive eyes, horizontal visor bands in cyan, yellow and coral order. Curious warm expression. Keep head upright rather than tilted. No salute pose.
Color palette: cool pale cyan reflections and restrained Prisma cyan #01D7E4, yellow #F3C306 and coral #F34A60 accents, matching a near-white cyan webpage. Fine subtle isometric grid underneath, fading out.
Composition: compact landscape 4:3 isolated vignette. Database slightly larger than the mascot, believable arm reach and clear card-inserting action at 300px wide. Keep whole character and objects visible, generous transparent margin, no cropping. One cohesive scene, not a collection of stickers.
Lighting: consistent soft studio lighting and subtle grounded contact shadows.
Constraints: genuinely transparent background; no background rectangle, no scenery, no written text, letters, numbers, captions, logos, watermark or UI buttons. Exactly one mascot and one database stack. No diagrams floating on top of the robot, no face looking at the viewer. Preserve visor band order and colors.
```
