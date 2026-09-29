import React from 'react'
import styled from 'styled-components'
import { resolveCta, buildCtaUrl, CONSOLE_URL } from '../../cta'

// End-of-article Prisma Postgres CTA.
// Auto-rendered from the page slug. Strong (panel + buttons) on high-intent
// pages, soft (single inline link to the product page) elsewhere. Suppressed
// on index pages.

const Panel = styled.div`
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(60% 120% at 100% 100%, rgba(254, 67, 82, 0.28), transparent 60%),
    radial-gradient(50% 120% at 70% 110%, rgba(254, 190, 41, 0.18), transparent 60%),
    radial-gradient(60% 140% at 0% 100%, rgba(4, 213, 231, 0.2), transparent 60%), var(--hero-bg);
  border-radius: var(--radius-lg);
  padding: 28px 32px;
  margin: 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px 32px;
  flex-wrap: wrap;
  @media (min-width: 0px) and (max-width: 767px) {
    padding: 24px;
  }
`

const PanelText = styled.div`
  flex: 1;
  min-width: 240px;
`

const Title = styled.p`
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 28px;
  font-weight: 500;
  color: #ffffff;
`

const Body = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 24px;
  color: rgba(255, 255, 255, 0.72);
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
`

const PrimaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  height: 40px;
  background: #ffffff;
  color: var(--ink);
  border-radius: 999px;
  padding: 0 18px;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover,
  &:link,
  &:visited,
  &:active {
    color: var(--ink);
  }
  &:hover {
    background: #ebebea;
  }
`

const SecondaryLink = styled.a`
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    color: #ffffff;
  }
`

const SoftCta = styled.p`
  margin: 1rem 0;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 15px;
  color: var(--text-muted);
  a {
    color: var(--text-strong);
    font-weight: 500;
    text-decoration: underline;
    text-decoration-color: var(--accent-underline);
    text-underline-offset: 3.5px;
    &:hover {
      color: var(--accent);
    }
  }
`

interface EndCtaProps {
  slug?: string
}

const EndCta = ({ slug = '' }: EndCtaProps) => {
  const cta = resolveCta(slug)

  // No commercial push on section index pages.
  if (cta.isIndex) return null

  if (cta.strength === 'soft') {
    const href = buildCtaUrl(cta, 'end_cta', { forceProduct: true })
    return (
      <SoftCta
        data-cta-cluster={cta.cluster}
        data-cta-placement="end_cta"
        data-cta-slug={cta.articleSlug}
      >
        {cta.copy.end.body}{' '}
        <a href={href} target="_blank" rel="noopener noreferrer">
          Explore Prisma Postgres →
        </a>
      </SoftCta>
    )
  }

  const primaryHref = buildCtaUrl(cta, 'end_cta')
  const isConsole = primaryHref.startsWith(CONSOLE_URL)
  const primaryText = isConsole ? 'Create a database' : 'Explore Prisma Postgres'
  const secondaryHref = isConsole
    ? buildCtaUrl(cta, 'end_cta', { forceProduct: true })
    : cta.docsUrl
  const secondaryText = isConsole ? 'Explore Prisma Postgres' : 'Read the docs'

  return (
    <Panel
      data-cta-cluster={cta.cluster}
      data-cta-placement="end_cta"
      data-cta-slug={cta.articleSlug}
    >
      <PanelText>
        <Title>{cta.copy.end.title}</Title>
        <Body>{cta.copy.end.body}</Body>
      </PanelText>
      <Actions>
        <PrimaryButton href={primaryHref} target="_blank" rel="noopener noreferrer">
          {primaryText}
        </PrimaryButton>
        <SecondaryLink href={secondaryHref} target="_blank" rel="noopener noreferrer">
          {secondaryText}
        </SecondaryLink>
      </Actions>
    </Panel>
  )
}

export default EndCta
