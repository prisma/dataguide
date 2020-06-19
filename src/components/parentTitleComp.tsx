import React from 'react'
import styled from 'styled-components'
import { useAllArticlesQuery } from '../hooks/useAllArticlesQuery'
import { getParentTitle } from '../utils/parentTitle'
import { AllArticles } from '../interfaces/AllArticles.interface'
import Link from './link'

const BreadcrumbTitle = styled.h2`
  color: var(--muted-font-color) !important;
  font-family: 'Rubik';
  font-weight: 500;
  line-height: 100%;
  margin: 0;
  a {
    color: var(--muted-font-color) !important;
    text-decoration: none;

    &:hover,
    &:focus {
      color: var(--muted-font-color) !important;
      text-decoration: underline;
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
  return (
    <BreadcrumbTitle>
      {parentTitle.length > 0
        ? parentTitle.map((part: any, index: number) => (
            <span key={index}>
              {part.link && !nonLink ? <Link to={part.link}>{part.title} </Link> : part.title}
              {parentTitle.length !== index + 1 ? ' / ' : ''}
            </span>
          ))
        : ''}
    </BreadcrumbTitle>
  )
}

export default ParentTitle
