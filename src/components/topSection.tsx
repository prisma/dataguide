import * as React from 'react'
import styled from 'styled-components'
import TOC from './toc'
import ParentTitle from './parentTitleComp'

const TopSectionWrapper = styled.div`
  position: relative;
  hr.bigger-margin {
    margin-top: 3.5rem;
    margin-bottom: 4rem;
  }
  .tech-switch-block {
    position: relative;
  }
`

const MainTitle = styled.h1`
  font-family: var(--font-display);
  font-size: 40px;
  line-height: 48px;
  font-style: normal;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--text-strong);
  margin: 12px 0 28px;
  text-wrap: balance;
  @media only screen and (max-width: 767px) {
    font-size: 28px;
    line-height: 36px;
    margin-bottom: 20px;
  }
`

const TopSection = ({ title, slug, toc }: any) => {
  return (
    <TopSectionWrapper>
      <ParentTitle slug={slug} />
      <MainTitle>{title}</MainTitle>
      {toc && toc.items && toc.items.length > 0 && <TOC headings={toc.items} />}
    </TopSectionWrapper>
  )
}

export default TopSection
