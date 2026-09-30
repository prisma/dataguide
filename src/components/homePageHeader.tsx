import * as React from 'react'
import styled from 'styled-components'
import { withPrefix } from 'gatsby'
import HeaderDiagram from '../icons/HeaderDiagram'
import Logo from '../icons/Logo'
import Search from '../components/search'
import { useLocation } from '../hooks/useLocation'
import { Wordmark } from './header'
import { headerCtaUrl } from '../cta'

const HeaderWrapper = styled.header`
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(38% 55% at 88% 100%, rgba(254, 67, 82, 0.24), transparent 70%),
    radial-gradient(30% 45% at 64% 105%, rgba(254, 190, 41, 0.16), transparent 70%),
    radial-gradient(45% 70% at 6% 105%, rgba(4, 213, 231, 0.18), transparent 70%),
    radial-gradient(60% 80% at 75% 20%, rgba(90, 63, 216, 0.35), transparent 70%),
    linear-gradient(135deg, #100d20 0%, #1b1540 55%, #26152f 100%);
  min-height: 540px;
  display: flex;
  justify-content: center;
  color: #ffffff;

  /* A faint grid, like the isometric pattern on prisma.io */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%);
    pointer-events: none;
  }

  .sub-wrapper {
    position: relative;
    max-width: 1127px;
    width: 1127px;
    margin-top: 20px;

    @media (min-width: 0px) and (max-width: 1159px) {
      padding: 0 16px;
    }
  }

  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 56px 0 72px;
    max-width: 1040px;
    margin: 0 auto;
    > * {
      flex: 1;
    }

    h1 {
      font-family: var(--font-display);
      font-style: normal;
      font-weight: 500;
      font-size: 64px;
      line-height: 1.02;
      letter-spacing: -0.035em;
      color: #ffffff;
      margin: 0 0 24px;
    }

    .tagline {
      font-family: var(--font-sans);
      font-size: 20px;
      font-weight: 400;
      line-height: 32px;
      letter-spacing: 0;
      max-width: 430px;
      color: rgba(255, 255, 255, 0.72);
      margin: 0;
    }
  }

  @media (min-width: 0) and (max-width: 1024px) {
    .sub-wrapper {
      width: 100%;
    }
    .container {
      flex-direction: column;
      align-items: center;
      padding-top: 40px;

      .content {
        margin: 0;
        text-align: center;
        padding: 0 8%;

        > * {
          width: auto;
          margin-left: auto;
          margin-right: auto;
        }
      }
      svg {
        margin-top: 24px;
      }
    }
  }
  @media (min-width: 0px) and (max-width: 500px) {
    min-height: 0;
    .container h1 {
      font-size: 44px;
    }
    .container .tagline {
      font-size: 18px;
      line-height: 28px;
    }
    .container .content {
      padding: 0 4px;
    }
    .container .main-image {
      width: 100%;
      height: auto;
    }
  }
`

const Highlight = styled.span`
  font-weight: 500;
  background: linear-gradient(
    90deg,
    var(--prisma-cyan),
    var(--prisma-yellow) 55%,
    var(--prisma-coral)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`

const SearchComponent = styled(Search)`
  position: absolute;
  top: 12px;
  width: auto;
  left: 12px;
`

const SearchWrapper = styled.div`
  > * {
    width: 100%;
    display: none; // Temporarily hidden
    &.show {
      width: calc(100% - 32px);
    }
  }
`

const HeaderNavWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;

  ${Wordmark} {
    color: #ffffff;
    .separator {
      color: rgba(255, 255, 255, 0.4);
    }
    .product:hover {
      color: #d7ceff;
    }
  }
`

const CtaButton = styled.a`
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  background: #ffffff;
  color: var(--ink);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover {
    background: #ebebea;
  }
  @media (max-width: 420px) {
    display: none;
  }
`

const HomePageHeader = () => {
  const [showDataguideBtn, setShowDataguideBtn] = React.useState(true)
  const changeHitsStatus = (status: boolean) => setShowDataguideBtn(!status)
  const location = useLocation()
  return (
    <HeaderWrapper>
      <div className="sub-wrapper">
        <HeaderNavWrapper>
          <Wordmark>
            <a className="prisma-logo" href="https://www.prisma.io" aria-label="Prisma">
              <Logo />
            </a>
            <span className="separator" aria-hidden="true">
              /
            </span>
            <a className="product" href={withPrefix('/').replace(/\/$/, '') || '/'}>
              dataguide
            </a>
          </Wordmark>
          <SearchWrapper>
            <SearchComponent hitsStatus={changeHitsStatus} location={location} />
          </SearchWrapper>
          <CtaButton
            href={headerCtaUrl()}
            target="_blank"
            rel="noopener noreferrer"
            data-cta-cluster="postgres_global"
            data-cta-placement="header_cta"
          >
            Prisma Postgres
          </CtaButton>
        </HeaderNavWrapper>
        <div className="container">
          <div className="content">
            <h1>Prisma's Data Guide</h1>
            <p className="tagline">
              Learn how databases work, how to choose the right one, and{' '}
              <Highlight>how to use databases</Highlight> with your applications to their full
              potential.
            </p>
          </div>
          <div>
            <HeaderDiagram className="main-image" />
          </div>
        </div>
      </div>
    </HeaderWrapper>
  )
}

export default HomePageHeader
