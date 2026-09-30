# Topic artwork

The two decorative themes pair official Prisma mascot assets with original SVG diagrams:

- Introduction: Prismo saluting, database stacks, and an isometric grid.
- Data modeling: Prismo thinking, connected tables, and the same grid.

Sources: [Prisma brand kit](https://www.prisma.io/brand-kit),
[salute PNG](https://www.prisma.io/brand-kit/mascot/salute.png), and
[thinking PNG](https://www.prisma.io/brand-kit/mascot/thinking.png).
The transparent PNGs are proportionally resized to 480 × 480 WebP files for the site.
The character's pose and visor colors are preserved.

`src/styles/topic-themes.css` shares each theme between its homepage section and the
headers of its topic hub and articles. Artwork is decorative CSS imagery; article
content and navigation keep their existing semantics. Gatsby bundles all assets locally.
