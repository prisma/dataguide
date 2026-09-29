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
import Banner from './banner'
import { LocationProvider, PageLocation } from '../hooks/useLocation'
import { isIndexSlug } from '../utils/navigation'

interface PathProps {
  isHomePage?: boolean
  slug?: string
  location: PageLocation
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

const Content = styled.article<{ $moveUp?: boolean }>`
  max-width: 880px;
  width: 880px;
  margin: ${(p) => (p.$moveUp ? '-3rem 0 1rem 0' : '0.5rem 0 1rem 0')};
  position: relative;
  z-index: 100;
  @media (min-width: 0px) and (max-width: 1024px) {
    width: 100%;
    max-width: 100%;
  }
`

const MaxWidth = styled.div<{ $noIndex: boolean }>`
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
  }
`

const NotMobile = styled.section`
  display: flex;
  @media (min-width: 0px) and (max-width: 1024px) {
    display: none;
  }
`

const Layout: React.FunctionComponent<LayoutProps> = ({ children, isHomePage, slug, location }) => {
  const { site } = useLayoutQuery()
  const { header, footer } = site.siteMetadata
  const isIndexPage = isIndexSlug(slug)

  // const isHomePage = useLocation().pathname === '/'

  return (
    // <ThemeProvider theme={theme}>
    <LocationProvider value={location}>
      <MDXProvider components={customMdx}>
        {!isHomePage && <Header headerProps={header} />}
        {isHomePage && <HomePageHeader />}
        <Wrapper>
          {!isHomePage && (
            <NotMobile>
              <Sidebar isMobile={false} slug={slug} />
            </NotMobile>
          )}
          <Content $moveUp={isHomePage}>
            <MaxWidth $noIndex={!isIndexPage}>{children}</MaxWidth>
          </Content>
        </Wrapper>
        <Footer footerProps={footer} isHomePage={isHomePage} />
      </MDXProvider>
    </LocationProvider>
    // </ThemeProvider>
  )
}

export default Layout
