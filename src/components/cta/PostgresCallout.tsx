import React from 'react'
import styled from 'styled-components'
import { useLocation } from '../../hooks/useLocation'
import PrismaMark from '../../icons/PrismaMark'
import { resolveCta, buildCtaUrl, CONSOLE_URL, ClusterId } from '../../cta'

// Inline, contextual Prisma Postgres callout for placing inside article bodies
// (MDX). Resolves copy/destination from the current page by default; pass an
// explicit `cluster` to override (e.g. on a page whose section default doesn't
// match the surrounding content).

const Callout = styled.div`
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 22px;
  margin: 28px 0;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(21, 21, 21, 0.04);
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

const Label = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  span {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
`

const Title = styled.p`
  margin: 0 0 6px !important;
  font-family: var(--font-display);
  font-size: 18px !important;
  line-height: 26px !important;
  font-weight: 500;
  color: var(--text-strong);
`

const Body = styled.p`
  margin: 0 0 16px !important;
  font-size: 15px !important;
  line-height: 24px !important;
  color: var(--text-muted);
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const PrimaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  height: 36px;
  background: var(--ink);
  color: var(--surface);
  border-radius: 999px;
  padding: 0 16px;
  font-weight: 500;
  font-size: 14px;
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

const SecondaryLink = styled.a`
  color: var(--text-strong);
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  &:hover {
    color: var(--accent);
  }
`

interface PostgresCalloutProps {
  cluster?: ClusterId
}

const PostgresCallout = ({ cluster }: PostgresCalloutProps) => {
  const location = useLocation()
  // Resolve from the current page; an explicit `cluster` overrides the mapping.
  const resolved = resolveCta(location?.pathname || '', cluster)

  const primaryHref = buildCtaUrl(resolved, 'inline_cta')
  const isConsole = primaryHref.startsWith(CONSOLE_URL)
  const primaryText = isConsole ? 'Create a database' : 'Explore Prisma Postgres'

  return (
    <Callout
      data-cta-cluster={resolved.cluster}
      data-cta-placement="inline_cta"
      data-cta-slug={resolved.articleSlug}
    >
      <Label>
        <PrismaMark size={16} />
        <span>Prisma Postgres</span>
      </Label>
      <Title>{resolved.copy.inline.title}</Title>
      <Body>{resolved.copy.inline.body}</Body>
      <Actions>
        <PrimaryButton href={primaryHref} target="_blank" rel="noopener noreferrer">
          {primaryText}
        </PrimaryButton>
        <SecondaryLink href={resolved.docsUrl} target="_blank" rel="noopener noreferrer">
          Read the docs →
        </SecondaryLink>
      </Actions>
    </Callout>
  )
}

export default PostgresCallout
