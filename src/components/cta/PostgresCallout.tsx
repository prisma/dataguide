import React from 'react'
import styled from 'styled-components'
import { useLocation } from '@reach/router'
import PrismaLogo from '../../icons/PrismaLogo'
import { resolveCta, buildCtaUrl, CONSOLE_URL, ClusterId } from '../../cta'

// Inline, contextual Prisma Postgres callout for placing inside article bodies
// (MDX). Resolves copy/destination from the current page by default; pass an
// explicit `cluster` to override (e.g. on a page whose section default doesn't
// match the surrounding content).

const Callout = styled.div`
  background: #e1f5ee;
  border: 1px solid #9fe1cb;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 24px 0;
`

const Label = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .icon {
    background: #ffffff;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: #0f6e56;
  }
`

const Title = styled.p`
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #0f6e56;
`

const Body = styled.p`
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.6;
  color: #187367;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const PrimaryButton = styled.a`
  background: #16a394;
  color: #ffffff;
  border-radius: 4px;
  padding: 7px 14px;
  font-weight: 600;
  font-size: 13px;
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

const SecondaryLink = styled.a`
  color: #16a394;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  &:hover {
    color: #187367;
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
        <span className="icon">
          <PrismaLogo color="#16a394" />
        </span>
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
