import React from 'react'
import styled from 'styled-components'
import { useAllArticlesQuery } from '../hooks/useAllArticlesQuery'
import { getParentTitle } from '../utils/parentTitle'
import { AllArticles } from '../interfaces/AllArticles.interface'
import Link from './link'

const BreadcrumbTitle = styled.nav`
  color: var(--accent) !important;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0;
  margin: 0;
  .separator {
    color: var(--text-subtle);
    margin: 0 6px;
  }
  a {
    color: var(--accent) !important;
    text-decoration: none;

    &:hover,
    &:focus {
      color: var(--accent-strong) !important;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
  }
`

interface ParentTitleProps {
  slug: string
  nonLink?: boolean
}

const ParentTitle = ({ slug, nonLink }: ParentTitleProps) => {
  const { allMdx }: AllArticles = useAllArticlesQuery()
  const parentTitle = getParentTitle(slug, allMdx)
  if (parentTitle.length === 0) return null

  return (
    <BreadcrumbTitle as={nonLink ? 'div' : 'nav'} aria-label={nonLink ? undefined : 'Breadcrumb'}>
      {parentTitle.length > 0
        ? parentTitle.map((part: any, index: number) => (
            <span key={index}>
              {part.link && !nonLink ? <Link to={part.link}>{part.title}</Link> : part.title}
              {parentTitle.length !== index + 1 ? <span className="separator">/</span> : ''}
            </span>
          ))
        : ''}
    </BreadcrumbTitle>
  )
}

export default ParentTitle
