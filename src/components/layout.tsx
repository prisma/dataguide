import * as React from 'react'
import styled from 'styled-components'
import { useLayoutQuery } from '../hooks/useLayoutQuery'
import Header from './header'
import Footer from './footer'
import { MDXProvider } from '@mdx-js/react'
import customMdx from '../components/customMdx'
import HomePageHeader from '../components/homePageHeader'
import '@fontsource-variable/inter'
import '@fontsource-variable/sora'
import '@fontsource-variable/geist-mono'
import '../styles/layout.css'
import Sidebar from './sidebar'
import { LocationProvider, PageLocation } from '../hooks/useLocation'
import { isIndexSlug } from '../utils/navigation'

interface PathProps {
  isHomePage?: boolean
  slug?: string
  location: PageLocation
  // Shown in a column to the right of the article on wide screens (the "On this page" list)
  aside?: React.ReactNode
}

// interface ThemeProps {
//   colorPrimary: string
// }

// const theme: ThemeProps = {
//   colorPrimary: '#663399',
// }

type LayoutProps = React.PropsWithChildren<PathProps>

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  padding: 0 16px;
  @media (min-width: 0px) and (max-width: 767px) {
    padding: 0 10px;
  }
`

const Content = styled.main<{ $moveUp?: boolean }>`
  flex: 1 1 880px;
  min-width: 0;
  max-width: 880px;
  margin: ${(p) => (p.$moveUp ? '-3rem 0 1rem 0' : '0.5rem 0 1rem 0')};
  position: relative;
  z-index: 100;
  @media (min-width: 0px) and (max-width: 1024px) {
    width: 100%;
    max-width: 100%;
  }
`

const MaxWidth = styled.article<{ $noIndex: boolean }>`
  > section {
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-card);
    border-radius: var(--radius-lg);
    margin-top: 16px;
    padding: 32px 40px;
    &.top-section {
      padding-top: 36px;
    }
    @media (min-width: 0px) and (max-width: 1024px) {
      margin-top: 12px;
    }
    @media (min-width: 0px) and (max-width: 767px) {
      padding: 24px;
      border-radius: 16px;
      &.top-section {
        padding-top: 24px;
      }
    }
    &:last-of-type {
      padding-bottom: ${(p) => p.$noIndex && '164px'};
    }

    /* Cards with section artwork: the art sits behind the content and is cropped by the card,
       and the heading and intro text leave room for it */
    &:has(> .section-art) {
      position: relative;
      overflow: hidden;
      isolation: isolate;
      @media (min-width: 768px) {
        > h2,
        > p:first-of-type {
          padding-right: 240px;
        }
        h1,
        nav[aria-label='Breadcrumb'] {
          padding-right: 200px;
        }
      }
    }
  }
`

const SkipLink = styled.a`
  position: absolute;
  left: 16px;
  top: -48px;
  z-index: 1000;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--ink);
  color: #ffffff;
  font-weight: 500;
  text-decoration: none;
  &:focus {
    top: 12px;
  }
`

// Present on every article page at this width, even when empty, so the layout lines up with the
// header across pages
const AsideColumn = styled.div`
  flex: 0 0 240px;
  margin: 24px 0 0 32px;
  @media (max-width: 1279px) {
    display: none;
  }
`

const NotMobile = styled.div`
  display: flex;
  @media (min-width: 0px) and (max-width: 1024px) {
    display: none;
  }
`

const Layout: React.FunctionComponent<LayoutProps> = ({
  children,
  isHomePage,
  slug,
  location,
  aside,
}) => {
  const { site } = useLayoutQuery()
  const { header, footer } = site.siteMetadata
  const isIndexPage = isIndexSlug(slug)

  // const isHomePage = useLocation().pathname === '/'

  return (
    // <ThemeProvider theme={theme}>
    <LocationProvider value={location}>
      <MDXProvider components={customMdx}>
        <SkipLink href="#main-content">Skip to content</SkipLink>
        {!isHomePage && <Header headerProps={header} />}
        {isHomePage && <HomePageHeader />}
        <Wrapper>
          {!isHomePage && (
            <NotMobile>
              <Sidebar isMobile={false} slug={slug} />
            </NotMobile>
          )}
          <Content $moveUp={isHomePage} id="main-content" tabIndex={-1}>
            <MaxWidth $noIndex={!isIndexPage}>{children}</MaxWidth>
          </Content>
          {!isHomePage && <AsideColumn>{aside}</AsideColumn>}
        </Wrapper>
        <Footer footerProps={footer} isHomePage={isHomePage} />
      </MDXProvider>
    </LocationProvider>
    // </ThemeProvider>
  )
}

export default Layout
