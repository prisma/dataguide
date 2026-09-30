import * as React from 'react'
import styled, { css } from 'styled-components'
import Logo from '../icons/Logo'
import Clear from '../icons/Clear'
import Search from '../components/search'
import Sidebar from '../components/sidebar'
import { HeaderProps } from '../interfaces/Layout.interface'
import { Link } from 'gatsby'
import { useLocation } from '../hooks/useLocation'
import { headerCtaUrl } from '../cta'

type HeaderViewProps = {
  headerProps: HeaderProps
}

// Stays at the top while scrolling, so search and navigation are always at hand
const HeaderWrapper = styled.header`
  background: rgba(249, 250, 245, 0.8);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border);
  height: 64px;
  img {
    margin-bottom: 0;
  }
  padding: 0 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 200;

  .container {
    width: 1127px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Matches the article layout's width once the "On this page" column appears */
  @media (min-width: 1280px) {
    .container {
      width: 100%;
      max-width: 1391px;
    }
  }

  @media (min-width: 0px) and (max-width: 1024px) {
    .container {
      width: 100%;
    }
  }
`

const HeaderNav = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`

export const Wordmark = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  color: var(--ink);

  .prisma-logo {
    display: flex;
    color: inherit;
    svg {
      display: block;
      height: 26px;
      width: auto;
    }
  }

  .separator {
    font-family: var(--font-mono);
    font-size: 18px;
    color: var(--text-subtle);
  }

  .product {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: inherit;
    text-decoration: none;
    &:hover {
      color: var(--accent);
    }
  }

  @media (min-width: 0px) and (max-width: 420px) {
    gap: 8px;
    .prisma-logo svg {
      height: 22px;
    }
    .separator,
    .product {
      font-size: 16px;
    }
  }
`

const SearchComponent = styled(Search)`
  position: absolute;
  top: 12px;
  left: 12px;
  max-width: 175px;
`

const DocsMobileButton = styled.button`
  cursor: pointer;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-strong);
  font: 500 14px var(--font-sans);
  display: none;
  padding: 0 16px;
  height: 36px;
  margin-left: 8px;
  position: relative;
  z-index: 300;
  svg path {
    stroke: var(--text-strong);
  }
  &:hover {
    border-color: var(--border-strong);
  }
  @media (min-width: 0px) and (max-width: 1024px) {
    display: flex;
    align-items: center;
  }
`

const MobileOnlyNav = styled.div`
  display: none;
  position: absolute;
  z-index: 210;
  top: 64px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-pop);
  width: 100%;
  left: 0;
  padding: 0 2rem;
  max-height: calc(100vh - 64px);
  overflow: auto;
  @media (min-width: 0px) and (max-width: 1024px) {
    display: block;
  }
  @media (min-width: 0px) and (max-width: 767px) {
    padding: 1rem;
  }
`
const PrismaLink = styled.div`
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  @media (min-width: 0px) and (max-width: 1024px) {
    display: none;
  }
`
const PrismaButton = styled.a`
  color: var(--surface);
  background: var(--ink);
  border-radius: 999px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  font-weight: 500;
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: background 0.15s;
  &:hover {
    background: #333436;
  }
`

const SearchContainer = styled.div<{ $isSticky?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media only screen and (min-width: 1025px) {
    display: none;
  }
  ${({ $isSticky }) =>
    $isSticky &&
    css`
      z-index: 120;
      padding: 8px;
      margin-top: 0;
      margin-left: -8px;
      width: 100% !important;
      background: var(--page-bg);
    `};
`

const Header = ({ headerProps }: HeaderViewProps) => {
  const [showDataguideBtn, setShowDataguideBtn] = React.useState(true)
  const [showMobileNav, setShowMobileNav] = React.useState(false)
  const location = useLocation()

  const toggleMobileNav = () => setShowMobileNav(!showMobileNav)

  const changeHitsStatus = (status: boolean) => setShowDataguideBtn(!status)
  return (
    <HeaderWrapper>
      <div className={'container'}>
        <HeaderNav>
          <Wordmark>
            <a className="prisma-logo" href="https://www.prisma.io" aria-label="Prisma">
              <Logo />
            </a>
            <span className="separator" aria-hidden="true">
              /
            </span>
            <Link className="product" to={headerProps.logoLink}>
              dataguide
            </Link>
          </Wordmark>
        </HeaderNav>
        <SearchContainer>
          {!showMobileNav && (
            <SearchComponent hitsStatus={changeHitsStatus} location={location} header mobile />
          )}
          <DocsMobileButton
            type="button"
            onClick={toggleMobileNav}
            aria-expanded={showMobileNav}
            aria-label={showMobileNav ? 'Close menu' : 'Open menu'}
          >
            {showMobileNav ? <Clear /> : 'Menu'}
          </DocsMobileButton>
        </SearchContainer>
        {showMobileNav && (
          <MobileOnlyNav>
            <Sidebar isMobile={true} />
          </MobileOnlyNav>
        )}
        <PrismaLink>
          <SearchComponent hitsStatus={changeHitsStatus} location={location} header />
          <PrismaButton
            href={headerCtaUrl()}
            target="_blank"
            rel="noopener noreferrer"
            data-cta-cluster="postgres_global"
            data-cta-placement="header_cta"
          >
            Prisma Postgres
          </PrismaButton>
        </PrismaLink>
      </div>
    </HeaderWrapper>
  )
}

export default Header
