import React from 'react'
import styled from 'styled-components'
import { resolveCta, buildCtaUrl, CONSOLE_URL } from '../../cta'

// Cluster-aware Prisma Postgres sidebar promo.
// Copy and destination are resolved from the current page's slug via the
// shared CTA config (src/cta). Replaces the legacy randomized Pulse-era promos.

const PromoCard = styled.div`
  margin: 1.5rem 15px 15px 15px;
  border: 1px solid #16a394;
  border-radius: 5px;
  padding: 14px;
  font-size: 0.8rem;
`

const PromoText = styled.p`
  margin: 0 0 12px;
  color: #187367;
  font-size: 14px;
  line-height: 1.5;
`

const PromoButton = styled.a`
  display: block;
  text-align: center;
  background: #16a394;
  color: #ffffff;
  border-radius: 4px;
  padding: 8px 10px;
  font-weight: 600;
  text-decoration: none;

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

interface PromoProps {
  slug?: string
}

export const Promo = ({ slug = '' }: PromoProps) => {
  const cta = resolveCta(slug)
  const href = buildCtaUrl(cta, 'sidebar_cta')
  const isConsole = href.startsWith(CONSOLE_URL)
  const buttonText = isConsole ? 'Create a database' : 'Explore Prisma Postgres'

  return (
    <PromoCard className="sidebar-promo">
      <PromoText>{cta.copy.sidebar}</PromoText>
      <PromoButton
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-cta-cluster={cta.cluster}
        data-cta-placement="sidebar_cta"
        data-cta-slug={cta.articleSlug}
      >
        {buttonText}
      </PromoButton>
    </PromoCard>
  )
}
