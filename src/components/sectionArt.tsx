import React from 'react'
import styled from 'styled-components'
import introScene from '../images/section-art/intro-scene.svg'
import datamodelingScene from '../images/section-art/datamodeling-scene.svg'
import typesScene from '../images/section-art/types-scene.svg'
import postgresqlScene from '../images/section-art/postgresql-scene.svg'
import mysqlScene from '../images/section-art/mysql-scene.svg'
import sqliteScene from '../images/section-art/sqlite-scene.svg'
import mssqlScene from '../images/section-art/mssql-scene.svg'
import mongodbScene from '../images/section-art/mongodb-scene.svg'
import databaseToolsScene from '../images/section-art/database-tools-scene.svg'
import managingDatabasesScene from '../images/section-art/managing-databases-scene.svg'
import serverlessScene from '../images/section-art/serverless-scene.svg'
import justForFunScene from '../images/section-art/just-for-fun-scene.svg'
import cubeGrid from '../images/section-art/cube-grid.svg'

// Decorative artwork for a section's card on the homepage and for the top of its pages, in the
// style of the Prisma brand kit (https://www.prisma.io/brand-kit): a scene in which Prismo, the
// mascot, works with the section's subject, over a colour wash with grain.

type ThemeName =
  | 'intro'
  | 'datamodeling'
  | 'types'
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'mssql'
  | 'mongodb'
  | 'database-tools'
  | 'managing-databases'
  | 'serverless'
  | 'just-for-fun'

interface Theme {
  scene: string
  // Width / height of the scene's canvas (its SVG viewBox)
  ratio: number
  cubes?: boolean
  wash: string
}

// Every scene fits the same frame
const frames = { card: { width: 256, height: 200 }, page: { width: 216, height: 168 } }

// A soft wash led by one of the prism colours, with a second one in the corner. The sections take
// turns leading with cyan, yellow and red.
const prism = { cyan: '1, 215, 228', yellow: '243, 195, 6', red: '243, 74, 96' }
type PrismColour = keyof typeof prism
const wash = (lead: PrismColour, corner: PrismColour, low: PrismColour) =>
  `radial-gradient(circle at 80% 32%, rgba(${prism[lead]}, ${lead === 'red' ? 0.14 : 0.19}), transparent 55%),
    radial-gradient(circle at 100% 0%, rgba(${prism[corner]}, 0.14), transparent 45%),
    radial-gradient(circle at 60% 90%, rgba(${prism[low]}, 0.09), transparent 50%)`

// Each scene's ratio is its SVG's viewBox width / height
const themes: Record<ThemeName, Theme> = {
  // Introduction to databases: Prismo storing a record in a database
  intro: { scene: introScene, ratio: 192 / 186, wash: wash('cyan', 'yellow', 'red') },
  // Data modeling: Prismo placing a tuple into a table, over the cube grid (the kit's element
  // for the structured data layer)
  datamodeling: {
    scene: datamodelingScene,
    ratio: 296 / 220,
    cubes: true,
    wash: wash('yellow', 'red', 'cyan'),
  },
  // Database types: Prismo picking a document card out of a row with a table and a graph
  types: { scene: typesScene, ratio: 250 / 192, wash: wash('red', 'cyan', 'yellow') },
  // PostgreSQL: Prismo fitting an extension, a puzzle piece, into a database
  postgresql: { scene: postgresqlScene, ratio: 222 / 190, wash: wash('cyan', 'yellow', 'red') },
  // MySQL: Prismo carrying a row from the primary to a replica
  mysql: { scene: mysqlScene, ratio: 256 / 194, wash: wash('yellow', 'red', 'cyan') },
  // SQLite: Prismo putting a database file into a phone
  sqlite: { scene: sqliteScene, ratio: 190 / 204, wash: wash('red', 'cyan', 'yellow') },
  // SQL Server: Prismo pushing a drive into a server
  mssql: { scene: mssqlScene, ratio: 230 / 200, wash: wash('cyan', 'yellow', 'red') },
  // MongoDB: Prismo filing a document into a collection
  mongodb: { scene: mongodbScene, ratio: 206 / 186, wash: wash('yellow', 'red', 'cyan') },
  // Database tools: Prismo tightening a nut on a database with a wrench
  'database-tools': {
    scene: databaseToolsScene,
    ratio: 217 / 186,
    wash: wash('red', 'cyan', 'yellow'),
  },
  // Managing databases: Prismo pointing out a spike on a monitoring dashboard
  'managing-databases': {
    scene: managingDatabasesScene,
    ratio: 268 / 210,
    wash: wash('cyan', 'yellow', 'red'),
  },
  // Serverless architecture: Prismo sending a function up into the cloud
  serverless: { scene: serverlessScene, ratio: 262 / 190, wash: wash('yellow', 'red', 'cyan') },
  // Just for fun: Prismo juggling databases
  'just-for-fun': { scene: justForFunScene, ratio: 196 / 190, wash: wash('red', 'cyan', 'yellow') },
}

// The theme for a page, from its section: `/01-intro/01-what-are-databases` -> `intro`
export const sectionThemeForSlug = (slug?: string): ThemeName | undefined => {
  const section = slug
    ?.replace(/\d{2,}-/g, '')
    .replace(/^\/+/, '')
    .split('/')[0]
  return section && section in themes ? (section as ThemeName) : undefined
}

interface SectionArtProps {
  theme: ThemeName
  // `card` for a homepage section card, `page` for the top of a section's pages
  variant?: 'card' | 'page'
}

const SectionArt = ({ theme, variant = 'card' }: SectionArtProps) => {
  const art = themes[theme]
  if (!art) return null
  const frame = frames[variant]
  const width = Math.min(frame.width, frame.height * art.ratio)
  return (
    <Art className="section-art" data-theme={theme} data-variant={variant} aria-hidden="true">
      <div className="wash" style={{ backgroundImage: art.wash }} />
      {art.cubes && <div className="cubes" style={{ backgroundImage: `url(${cubeGrid})` }} />}
      <div className="grain" />
      <img
        className="scene"
        src={art.scene}
        alt=""
        width={Math.round(width)}
        height={Math.round(width / art.ratio)}
        loading="lazy"
        decoding="async"
      />
    </Art>
  )
}

export default SectionArt

// Fine film grain, as the brand kit uses over colour-washed panels
const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

const Art = styled.div`
  /* Sits behind the card's content (the card creates the stacking context) */
  position: absolute;
  z-index: -1;
  top: 0;
  right: 0;
  width: 420px;
  height: 300px;
  pointer-events: none;

  .wash,
  .cubes,
  .grain {
    position: absolute;
    inset: 0;
    /* Fade out towards the content, from the top-right corner */
    mask-image: radial-gradient(120% 110% at 100% 0%, #000 35%, transparent 72%);
  }
  .cubes {
    background-size: 24.249px 42px;
    opacity: 0.7;
  }
  .grain {
    background-image: ${grain};
    opacity: 0.12;
    mix-blend-mode: multiply;
  }

  /* Aligned to the card's top-right corner, so glass objects that bleed off the scene are
     cropped by the card (which reserves room for the frame, see layout.tsx). The bottom fades out
     so that nothing ends in a hard edge. */
  .scene {
    position: absolute;
    top: 0;
    right: 0;
    mask-image: linear-gradient(180deg, #000 78%, transparent);
  }

  &[data-variant='page'] {
    width: 360px;
    height: 240px;
  }

  @media (max-width: 767px) {
    display: none;
  }
`
