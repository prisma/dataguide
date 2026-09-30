import React from 'react'
import styled from 'styled-components'
import introScene from '../images/section-art/intro-scene.svg'
import datamodelingScene from '../images/section-art/datamodeling-scene.svg'
import cubeGrid from '../images/section-art/cube-grid.svg'

// Decorative artwork for a section's card on the homepage and for the top of its pages, in the
// style of the Prisma brand kit (https://www.prisma.io/brand-kit): a scene in which Prismo, the
// mascot, works with the section's subject, over a colour wash with grain.

type ThemeName = 'intro' | 'datamodeling'

interface Theme {
  scene: string
  cubes?: boolean
  wash: string
}

const themes: Record<ThemeName, Theme> = {
  // Introduction to databases: Prismo storing a record in a database
  intro: {
    scene: introScene,
    wash: `radial-gradient(circle at 78% 34%, rgba(1, 215, 228, 0.2), transparent 55%),
      radial-gradient(circle at 100% 0%, rgba(243, 195, 6, 0.16), transparent 45%),
      radial-gradient(circle at 60% 90%, rgba(243, 74, 96, 0.08), transparent 50%)`,
  },
  // Data modeling: Prismo placing a tuple into a table, over the cube grid (the kit's element
  // for the structured data layer)
  datamodeling: {
    scene: datamodelingScene,
    cubes: true,
    wash: `radial-gradient(circle at 80% 30%, rgba(243, 195, 6, 0.18), transparent 55%),
      radial-gradient(circle at 100% 0%, rgba(243, 74, 96, 0.12), transparent 45%),
      radial-gradient(circle at 62% 88%, rgba(1, 215, 228, 0.1), transparent 50%)`,
  },
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
  return (
    <Art className="section-art" data-theme={theme} data-variant={variant} aria-hidden="true">
      <div className="wash" style={{ backgroundImage: art.wash }} />
      {art.cubes && <div className="cubes" style={{ backgroundImage: `url(${cubeGrid})` }} />}
      <div className="grain" />
      <img className="scene" src={art.scene} alt="" loading="lazy" decoding="async" />
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

  /* Sized by height, flush with the card's right edge so that the glass objects that bleed off
     the scene are cropped by the card; the card reserves room for each scene (see layout.tsx) */
  .scene {
    position: absolute;
    right: 0;
    width: auto;
    top: var(--scene-top);
    height: var(--scene-height);
  }
  &[data-theme='intro'] {
    --scene-top: 16px;
    --scene-height: 180px;
  }
  &[data-theme='datamodeling'] {
    --scene-top: 0px;
    --scene-height: 190px;
  }

  &[data-variant='page'] {
    width: 360px;
    height: 240px;
    &[data-theme='intro'] {
      --scene-top: 12px;
      --scene-height: 150px;
    }
    &[data-theme='datamodeling'] {
      --scene-top: 0px;
      --scene-height: 160px;
    }
  }

  @media (max-width: 767px) {
    display: none;
  }
`
