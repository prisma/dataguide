import React from 'react'
import styled from 'styled-components'
import { resolveCta, buildCtaUrl, CONSOLE_URL } from '../../cta'

// End-of-article Prisma Postgres CTA.
// Auto-rendered from the page slug. Strong (panel + buttons) on high-intent
// pages, soft (single inline link to the product page) elsewhere. Suppressed
// on index pages.

const Panel = styled.div`
  background: #e1f5ee;
  border-radius: 8px;
  padding: 24px;
  margin: 2.5rem 0 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
`

const PanelText = styled.div`
  flex: 1;
  min-width: 240px;
`

const Title = styled.p`
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #0f6e56;
`

const Body = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #187367;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
`

const PrimaryButton = styled.a`
  background: #16a394;
  color: #ffffff;
  border-radius: 4px;
  padding: 10px 18px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;

  &:hover,
  &:link,
  &:visited,
  &:active {
    color: #ffffff;
  }
  &:hover {
    background: #187367;
  }
`

const SecondaryLink = styled.a`
  color: #16a394;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    color: #187367;
  }
`

const SoftCta = styled.p`
  margin: 2.5rem 0 1rem;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
  color: #4a5568;

  a {
    color: #16a394;
    font-weight: 600;
    text-decoration: none;
    &:hover {
      color: #187367;
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
