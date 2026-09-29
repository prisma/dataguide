import React from 'react'
import styled from 'styled-components'
import { resolveCta, buildCtaUrl, CONSOLE_URL } from '../../cta'

// Cluster-aware Prisma Postgres sidebar promo.
// Copy and destination are resolved from the current page's slug via the
// shared CTA config (src/cta). Replaces the legacy randomized Pulse-era promos.

const PromoCard = styled.div`
  position: relative;
  margin: 24px 8px 8px 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  padding: 16px;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--prisma-cyan),
      var(--prisma-yellow) 50%,
      var(--prisma-coral)
    );
  }
`

const PromoText = styled.p`
  margin: 0 0 12px;
  color: var(--text);
  font-size: 13px;
  line-height: 20px;
`

const PromoButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  background: var(--ink);
  color: var(--surface);
  border-radius: 999px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
  &:hover,
  &:link,
  &:visited,
  &:active {
    color: var(--surface);
  }
  &:hover {
    background: #333436;
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
