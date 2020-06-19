import Link from '../components/link'
import * as React from 'react'
import styled, { css } from 'styled-components'
import styledTS from 'styled-components-ts'
import HeaderLogo from '../icons/Logo'
import Clear from '../icons/Clear'
import Search from '../components/search'
import Sidebar from '../components/sidebar'
import { HeaderProps } from '../interfaces/Layout.interface'

type HeaderViewProps = {
  headerProps: HeaderProps
}

const HeaderWrapper = styled.div`
  background: var(--white-color);
  box-shadow: 0px 2px 4px rgba(88, 86, 95, 0.08);
  height: 4rem;
  img {
    margin-bottom: 0;
  }
  padding: 30px 10px 24px;
  display: flex;
  justify-content: center;
  align-items: center;

  .container {
    width: 1110px;
    display: flex;
    justify-content: space-between;
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
  justify-content: space-between;

  @media (min-width: 0px) and (max-width: 1024px) {
    padding: 0 16px;
  }
`

const SearchComponent = styled(Search)`
  position: absolute;
  top: 12px;
  left: 12px;
`

const LogoContainer = styled.div`
  padding-right: 0.75rem;
`

const DocsMobileButton = styled.div`
  background: var(--main-theme-color);
  box-shadow: 0px 4px 8px rgba(60, 45, 111, 0.1), 0px 1px 3px rgba(60, 45, 111, 0.15);
  border-radius: 5px;
  color: white;
  display: none;
  padding: 0 14px;
  height: 42px;
  margin-left: 8px;
  font-weight: 600;
  position: relative;
  z-index: 300;
  svg path{
    stroke: white;
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
  top: 0px;
  transition: top 0.35s;
  background: var(--main-theme-color);
  box-shadow: 0px 4px 8px rgba(60, 45, 111, 0.1), 0px 1px 3px rgba(60, 45, 111, 0.15);
  color: black;
  width: 100%;
  left: 0;
  padding: 0 2rem;
  @media (min-width: 0px) and (max-width: 1024px) {
    top: 65px;
    display: block;
  }
  @media (min-width: 0px) and (max-width: 767px) {
    padding: 2rem 1rem;
  }
`

const SearchContainer = styledTS<{ isSticky: boolean }>(styled.div)`
  display: flex;
  justify-content: space-between;
  position: relative;
  ${({ isSticky }: any) =>
    isSticky &&
    css`
      z-index: 120;
      padding: 8px;
      margin-top: 0;
      margin-left: -8px;
      width: 100% !important;
      background: linear-gradient(180deg, rgba(13, 15, 20, 0.18) 0%, rgba(27, 32, 43, 0) 100%),
        var(--header-gradient-color);
    `};
`

const Header = ({ headerProps }: HeaderViewProps) => {
  const [showDocsBtn, setShowDocsBtn] = React.useState(true)
  const [showMobileNav, setShowMobileNav] = React.useState(false)

  const toggleMobileNav = () => setShowMobileNav(!showMobileNav)

  const changeHitsStatus = (status: boolean) => setShowDocsBtn(!status)

  return (
    <HeaderWrapper>
      <div className={'container'}>
        <HeaderNav>
          <div style={{ display: 'flex' }}>
            <Link
              to={headerProps.logoLink || '/'}
              style={{
                color: 'white',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LogoContainer>
                <HeaderLogo />
              </LogoContainer>
            </Link>
          </div>
        </HeaderNav>
        <SearchContainer>
          {/* <SearchComponent hitsStatus={changeHitsStatus} /> */}
          {showDocsBtn && (
            <DocsMobileButton onClick={toggleMobileNav}>
              {showMobileNav ? <Clear /> : 'Docs'}
            </DocsMobileButton>
          )}
        </SearchContainer>
      </div>

      {showMobileNav && (
        <MobileOnlyNav>
          <Sidebar isMobile={true} />
        </MobileOnlyNav>
      )}

    </HeaderWrapper>
  )
}

export default Header
