import React from 'react'
import styled from 'styled-components'
import { useAllArticlesQuery } from '../hooks/useAllArticlesQuery'
import { getParentTitle } from '../utils/parentTitle'
import { AllArticles } from '../interfaces/AllArticles.interface'

const BreadcrumbTitle = styled.h2`
  color: var(--muted-font-color) !important;
  font-family: 'Rubik';
  font-weight: 500;
  line-height: 100%;
  margin: 0;
`

interface ParentTitleProps {
  slug: string
}

const ParentTitle = ({ slug }: ParentTitleProps) => {
  const { allMdx }: AllArticles = useAllArticlesQuery()
  const parentTitle = getParentTitle(slug, allMdx)
  return <BreadcrumbTitle>{parentTitle}</BreadcrumbTitle>
}

export default ParentTitle
