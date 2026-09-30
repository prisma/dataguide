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

## Repeat the workflow for a future section

This work used Codex's built-in `image_gen.imagegen` tool, with local reference images
and `transparent_background: true`. No image API script, manually drawn replacement,
or separately overlaid mascot was used. The tool's model/version and random seed were
not exposed or recorded. Repeating these inputs can produce the same visual direction,
but does not reproduce identical pixels. The original generated PNGs are local tool
outputs, not tracked in this repository; the committed WebP scenes are the durable
references for future work.

### 1. Choose a topic action

Read the section's overview and article list. Pick one concrete action that represents
what readers learn: inserting a row, inspecting a relationship, sorting documents, or
connecting a tool. Describe what each hand does, what Prismo looks at, and the main
data object. Keep the action recognizable at the homepage's 300px artwork width.

Use a visual metaphor rather than a claim about a vendor's architecture. Avoid vendor
logos, readable text, and miniature technical diagrams that imply an executable example.

### 2. Supply the approved references

Use these two committed assets, in this order, as character and style references:

1. `src/images/topic-themes/prismo-tuple-scene.webp`
2. `src/images/topic-themes/prismo-database-scene.webp`

Inspect both before generation, then attach them or supply their absolute local paths
to the built-in tool. These scenes establish the chrome mascot, visor colors, frosted
glass, perspective, soft lighting, and fading floor grid. Ask for a new pose and action,
not a copy of either reference. The original brand-kit images and topic diagrams helped
establish the first two scenes; they are not required to extend the approved set.

### 3. Generate one cohesive scene

Copy the [shared prompt](#shared-prompt) verbatim and append a new ending following the
[topic-specific examples](#topic-specific-prompt-endings):

```text
Topic: <section title>.
Scene: <one action, gaze direction, what each hand does, main data objects, and a subtle topic reflection color>.
```

Submit the assembled prompt with the two references and actual transparency enabled.
For an agent with the same built-in tool, the input shape is:

```json
{
  "prompt": "<shared prompt followed by the new Topic and Scene lines>",
  "referenced_image_paths": [
    "<absolute repository path>/src/images/topic-themes/prismo-tuple-scene.webp",
    "<absolute repository path>/src/images/topic-themes/prismo-database-scene.webp"
  ],
  "transparent_background": true
}
```

The angle-bracket values are placeholders to replace, not literal paths or prompt text.
Request the 4:3 composition in the prompt; the built-in tool does not provide a size or
quality argument in this workflow. Save the returned PNG without flattening its alpha.

### 4. Review and iterate

Inspect the full output and a 300px-wide preview on the intended pale background. Check:

- One recognizable Prismo, with visor bands in cyan, yellow, coral order and exactly two hands.
- A visible interaction with the data object, a gaze directed at the task, and consistent lighting and perspective.
- Readable geometry, modest transparent margins, and no clipped character or main object.
- Real transparent pixels rather than an opaque white rectangle or a painted checkerboard.
- No text, vendor logos, watermark, extra limbs, or unrelated props.

If a candidate misses the action or style, regenerate with the approved references.
For a small correction, edit the candidate with a single focused instruction and state
which features must remain unchanged. Retain the accepted prompt and any edit prompts
in this document. Do not paste a stock mascot onto a separately generated background.

### 5. Export the accepted asset

Use the site's installed `sharp` dependency to resize proportionally to 720 × 540 and
encode WebP with `quality: 85` and `alphaQuality: 100`, the settings used for the ten
additional scenes. Run this from the repository root after installing dependencies;
replace the PNG path and choose a new `prismo-<topic>-scene.webp` filename:

```bash
node - "/absolute/path/to/accepted-scene.png" "src/images/topic-themes/prismo-new-topic-scene.webp" <<'JS'
const sharp = require('sharp')
const [input, output] = process.argv.slice(2)
;(async () => {
  const metadata = await sharp(input).metadata()
  const stats = await sharp(input).stats()
  if (metadata.width * 3 !== metadata.height * 4 || !metadata.hasAlpha || stats.isOpaque) {
    throw new Error('Expected a 4:3 source with actual transparency; review or regenerate it.')
  }
  await sharp(input).resize({ width: 720 }).webp({ quality: 85, alphaQuality: 100 }).toFile(output)
  const saved = await sharp(output).metadata()
  console.log({ output, width: saved.width, height: saved.height, hasAlpha: saved.hasAlpha })
})().catch(error => { console.error(error); process.exitCode = 1 })
JS
```

Inspect the exported WebP again. Keep the image proportional and preserve the alpha;
do not stretch it to fit or bake the page's wash color into the asset. Record the saved
path, references, assembled prompt, edits, and export settings here. Add only the final
WebP to `src/images/topic-themes/`; keep rejected candidates out of the site bundle.

### 6. Connect the homepage and subpages

Use the topic's stable top-level URL segment (for example, `postgresql`), not its title:

1. Add the slug to `THEMED_TOPICS` in `src/utils/topicThemes.ts`.
2. Add a matching block in `src/styles/topic-themes.css`, following the existing pattern:

   ```css
   .topic-home > section[data-topic='new-topic'],
   .top-section[data-topic='new-topic'] {
     --topic-wash: #effbfd;
     --topic-border: #d0e9ed;
     --topic-scene: url('../images/topic-themes/prismo-new-topic-scene.webp');
   }
   ```

3. Link the section's `##` heading in `content/index.mdx` to `/new-topic`. The
   `rehypeTopicSections` plugin in `gatsby-config.ts` adds `data-topic` to the generated
   homepage section from this link. Heading copy and anchor ids can change freely.
4. `src/templates/docs.tsx` uses the same `getThemedTopic` helper for hubs and nested
   article headers. No additional per-article markup or theme list is needed.

Choose wash and border colors that fit the scene and keep the existing dark text readable.
The registry/CSS regression test fails when a slug is missing from either side, an asset
is missing, or a registered topic has no matching homepage hook. Extend the topic rather
than introducing a new heading-id selector or another mascot layer.

### 7. Verify the complete section

Run `npm test`, `npm run typecheck`, and a clean production build with
`npm run clean` followed by `ADD_PREFIX=true npm run build`. Review the generated
`/dataguide/` homepage, `/dataguide/new-topic`, and a nested article in a fresh browser
at 1440px, 1280px, 1024px, 768px, and 390px. A local server bound to `127.0.0.1` can
serve `public/` mounted under `/dataguide/` to match the production path prefix.

Check that all three surfaces show the same scene, existing topics still render, assets
load beneath the production prefix, and there are no horizontal overflows or JavaScript
errors. Review long titles, inline tables of contents, share buttons, and update dates.
Homepage artwork stays beside the copy on desktop; subpage artwork is larger and extends
into the share-row area at desktop widths of 1280px and above. The themed subpage header
uses spacing to separate its title and share controls, with no horizontal divider.
Narrow screens keep a separate artwork area above the title. Record the commands actually
run and the pages/widths checked in
the PR, including any limitations.

## Remaining sections

The ten additional scenes use the approved tuple and database illustrations as character
and style references. They are generated with the same built-in tool and saved alongside
the first two assets as transparent WebP files.

| Topic                   | Saved asset                                            | Scene                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database types          | `src/images/topic-themes/prismo-types-scene.webp`      | Prismo compares three different ways to organize data.                                                                                                                                                   |
| PostgreSQL              | `src/images/topic-themes/prismo-postgresql-scene.webp` | Prismo leans toward a blue frosted relational table panel, using a handheld magnifying glass to inspect a highlighted cell.                                                                              |
| MySQL                   | `src/images/topic-themes/prismo-mysql-scene.webp`      | Prismo actively filters rows from a relational database: one hand guides a small horizontal row strip toward a translucent funnel, the other receives a matching highlighted row from the narrow output. |
| SQLite                  | `src/images/topic-themes/prismo-sqlite-scene.webp`     | Prismo slides a thin compact database-file tile into a small open laptop.                                                                                                                                |
| Microsoft SQL Server    | `src/images/topic-themes/prismo-mssql-scene.webp`      | Prismo carefully slides a rectangular relational-table module into an open bay of a small organized server cabinet.                                                                                      |
| MongoDB                 | `src/images/topic-themes/prismo-mongodb-scene.webp`    | Prismo organizes flexible document records into a translucent collection tray.                                                                                                                           |
| Database tools          | `src/images/topic-themes/prismo-tools-scene.webp`      | Prismo uses a small chrome wrench to tighten a connection between a frosted database cylinder and a simple upright application panel showing a tiny data grid.                                           |
| Managing databases      | `src/images/topic-themes/prismo-management-scene.webp` | Prismo checks and maintains a database while making a backup.                                                                                                                                            |
| Serverless architecture | `src/images/topic-themes/prismo-serverless-scene.webp` | Prismo assembles a small cloud data workflow.                                                                                                                                                            |
| Just for fun            | `src/images/topic-themes/prismo-fun-scene.webp`        | Prismo playfully explores interesting data: it is arranging three colorful frosted bar-chart blocks on a tiny podium while inspecting a small translucent globe with abstract continent silhouettes.     |

### Shared prompt

For each additional scene, the exact submitted prompt consists of the following shared
text, followed by `Topic: <title>.` and `Scene: <scene description>` from the entries below.

```text
Use case: stylized-concept.
Asset type: decorative topic-card and article-header illustration for Prisma's Data Guide.
Input images: the two images are ONLY references for the approved visual world and character identity. Make a new scene; do not reuse or paste the reference poses.
Style: match the references' refined softly lit 3D editorial miniature. One round chrome Prismo head on its small pedestal base, exactly two articulated chrome hands, expressive dark eyes, recognizable horizontal visor bands in cyan, yellow, coral order. Brushed silver and translucent frosted glass, rounded readable geometry, soft consistent studio lighting, subtle contact shadows, fine sparse isometric floor grid fading away.
Composition: compact landscape 4:3 isolated vignette. Prismo at left in three-quarter view actively looking at and handling the topic objects on the right. The objects occupy slightly more space than the character. Make the action obvious at 300px wide. Entire character and all main objects inside the frame with modest transparent margins. Robot and objects share the same perspective, material treatment and lighting as one cohesive scene.
Palette: restrained Prisma cyan #01D7E4, yellow #F3C306 and coral #F34A60 accents; preserve visor colors. Follow the topic-specific subtle reflection color below.
Constraints: genuinely transparent background, no rectangular background or large opaque ground plane. No text, letters, numbers, captions, brand logos or watermarks. Exactly one robot. No face looking at viewer, no salute or hand-on-chin pose, no disembodied extra hands. No photographic scenery or unnecessary props. These are decorative topic metaphors, not literal schema or architecture specifications.
```

### Topic-specific prompt endings

#### Database types

```text
Topic: Database types.
Scene: Prismo compares three different ways to organize data. Three small frosted pedestals hold an upright table grid, a document card with nested colored blocks, and a branching graph of four connected spheres. Prismo holds one small data tile between its hands, studying which pedestal to place it on. Keep all three structures recognizable and balanced; the scene conveys choosing among database types. Pale violet reflections.
```

#### PostgreSQL

```text
Topic: PostgreSQL.
Scene: Prismo leans toward a blue frosted relational table panel, using a handheld magnifying glass to inspect a highlighted cell. Its other hand traces a thin link from that row to a second smaller table beside a compact database cylinder. The magnifier should visibly enlarge the cell shape, without text. Convey exploring queries and relationships, with cool blue reflections. No elephant or vendor logo.
```

#### MySQL

```text
Topic: MySQL.
Scene: Prismo actively filters rows from a relational database: one hand guides a small horizontal row strip toward a translucent funnel, the other receives a matching highlighted row from the narrow output. Three small rows are visible entering the wide funnel, one neatly organized row exits toward a compact frosted database cylinder. Clearly show filtering and selecting data, keep the funnel and output row large and simple. Pale amber reflections. No dolphin or vendor logo.
```

#### SQLite

```text
Topic: SQLite.
Scene: Prismo slides a thin compact database-file tile into a small open laptop. The tile has a tiny embossed stack-of-disks symbol but no lettering. One hand inserts the tile into the laptop's side slot, the other rests lightly on the laptop keyboard. The laptop screen shows a simple 3-column table with a few colored cells and no text. Convey a self-contained database in a local device, with cool silver-blue reflections. No vendor logo.
```

#### Microsoft SQL Server

```text
Topic: Microsoft SQL Server.
Scene: Prismo carefully slides a rectangular relational-table module into an open bay of a small organized server cabinet. The module's front shows a clear 3-column grid with tiny colored cells; the cabinet has three rounded stacked horizontal bays and discreet cyan indicator lights. One hand pushes the module, the other steadies the cabinet. Convey structured data in a server system. Pale coral reflections. No Microsoft logo or Windows symbol.
```

#### MongoDB

```text
Topic: MongoDB.
Scene: Prismo organizes flexible document records into a translucent collection tray. It holds a rounded upright document card containing three differently sized nested colored blocks, placing it among two other document cards with visibly different internal block arrangements. The other hand steadies the tray. Add one tiny branching connector linking two nested blocks to suggest document structure. Clear document silhouettes, no table grid. Soft pale green reflections. No leaf vendor logo.
```

#### Database tools

```text
Topic: Database tools.
Scene: Prismo uses a small chrome wrench to tighten a connection between a frosted database cylinder and a simple upright application panel showing a tiny data grid. Its other hand holds the cylindrical connector steady; a short curved translucent cable joins the two objects. The wrench, connector and active hands are the focus. Convey tools that help applications work with databases. Soft lilac reflections, no text or vendor logos.
```

#### Managing databases

```text
Topic: Managing databases.
Scene: Prismo checks and maintains a database while making a backup. It holds a small inspection probe against a large frosted database stack; its other hand guides a data tile along a short curved transfer path toward a smaller matching backup stack. A simple small clock dial behind the backup has hands and tick marks but no numbers. Convey care, monitoring and backups rather than emergency repair. Pale mint reflections. No padlock claims, labels or vendor logos.
```

#### Serverless architecture

```text
Topic: Serverless architecture.
Scene: Prismo assembles a small cloud data workflow. A soft frosted-glass cloud on the right cradles a tiny database cylinder. Two small rounded function tiles connect to it with a single curved line; each tile has only a simple abstract lightning glyph, no code or lettering. Prismo's hands snap the nearer function tile onto the connection, looking at the join. Keep cloud and hands large and clear. Pale sky-cyan reflections, no server rack or vendor logos.
```

#### Just for fun

```text
Topic: Just for fun.
Scene: Prismo playfully explores interesting data: it is arranging three colorful frosted bar-chart blocks on a tiny podium while inspecting a small translucent globe with abstract continent silhouettes. One hand lifts the shortest chart bar into place, the other gently turns the globe on its stand. The curious happy expression and tactile chart should feel like a small data experiment. Soft pale yellow reflections. No text, numeric scales, flags or specific geographic data claims.
```

## Generation prompts for the first two scenes

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
