import React from 'react'
import styled from 'styled-components'
import prismoSalute from '../images/section-art/prismo-salute.webp'
import prismoThinking from '../images/section-art/prismo-thinking.webp'
import glassDatabase from '../images/section-art/glass-database.webp'
import glassLayers from '../images/section-art/glass-layers.webp'
import cubeGrid from '../images/section-art/cube-grid.svg'

// Decorative artwork for a section's card on the homepage and for the top of its pages, built
// from the Prisma brand kit (https://www.prisma.io/brand-kit): a colour wash with grain, glass
// shapes cropped by the card edge, the cube grid, and Prismo, the mascot. Following the kit,
// Prismo is shown whole and level, and at most once per page.

type ThemeName = 'intro' | 'datamodeling'

interface Theme {
  mascot: string
  glass: { src: string; width: number }
  cubes?: boolean
  wash: string
}

const themes: Record<ThemeName, Theme> = {
  // Introduction to databases: Prismo saluting (the kit's face for welcomes and onboarding)
  // next to a glass database
  intro: {
    mascot: prismoSalute,
    glass: { src: glassDatabase, width: 150 },
    wash: `radial-gradient(circle at 78% 34%, rgba(1, 215, 228, 0.2), transparent 55%),
      radial-gradient(circle at 100% 0%, rgba(243, 195, 6, 0.16), transparent 45%),
      radial-gradient(circle at 60% 90%, rgba(243, 74, 96, 0.08), transparent 50%)`,
  },
  // Data modeling: the cube grid (the kit's element for the structured data layer), stacked
  // glass layers like tables, and Prismo thinking
  datamodeling: {
    mascot: prismoThinking,
    glass: { src: glassLayers, width: 190 },
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
  // Leave Prismo out, e.g. when he already appears elsewhere on the page
  mascot?: boolean
}

const SectionArt = ({ theme, variant = 'card', mascot = true }: SectionArtProps) => {
  const art = themes[theme]
  if (!art) return null
  return (
    <Art
      className="section-art"
      data-variant={variant}
      aria-hidden="true"
      style={{ '--glass-width': `${art.glass.width}px` } as React.CSSProperties}
    >
      <div className="wash" style={{ backgroundImage: art.wash }} />
      {art.cubes && <div className="cubes" style={{ backgroundImage: `url(${cubeGrid})` }} />}
      <div className="grain" />
      <img className="glass" src={art.glass.src} alt="" loading="lazy" decoding="async" />
      {mascot && <img className="mascot" src={art.mascot} alt="" loading="lazy" decoding="async" />}
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

  /* Glass sits in the background, cropped by the card's edge */
  .glass {
    position: absolute;
    top: 12px;
    right: -34px;
    width: var(--glass-width);
    height: auto;
    opacity: 0.92;
  }

  /* Prismo stays whole and level, standing just clear of the glass */
  .mascot {
    position: absolute;
    top: 36px;
    right: calc(var(--glass-width) - 18px);
    width: 128px;
    height: auto;
    filter: drop-shadow(0 12px 18px rgba(18, 18, 18, 0.12));
  }

  &[data-variant='page'] {
    width: 360px;
    height: 240px;
    .glass {
      top: 12px;
      width: calc(var(--glass-width) * 0.85);
    }
    .mascot {
      top: 40px;
      right: calc(var(--glass-width) * 0.85 - 18px);
      width: 104px;
    }
  }

  @media (max-width: 767px) {
    display: none;
  }
`
