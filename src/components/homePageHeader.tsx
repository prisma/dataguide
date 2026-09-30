import * as React from 'react'
import styled from 'styled-components'
import { withPrefix } from 'gatsby'
import heroScene from '../images/home/connected-data-scene.webp'
import grain from '../images/home/grain.svg'
import Logo from '../icons/Logo'
import Search from '../components/search'
import { useLocation } from '../hooks/useLocation'
import { Wordmark } from './header'
import { headerCtaUrl } from '../cta'

const HeaderWrapper = styled.header`
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse 50% 42% at 100% 100%, #ffe8eb, transparent 85%),
    radial-gradient(ellipse 42% 36% at 58% 100%, #fff7e0, transparent 85%),
    radial-gradient(ellipse 65% 56% at 12% 100%, #dcfdff, transparent 85%), #ffffff;
  min-height: 540px;
  display: flex;
  justify-content: center;
  color: var(--ink);

  /* Fine grain over the spectral wash, following prisma.io/brand. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url(${grain});
    opacity: 0.06;
    mix-blend-mode: multiply;
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
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    gap: 24px;
    align-items: center;
    padding: 56px 0 72px;
    max-width: 1040px;
    margin: 0 auto;
    .main-image {
      display: block;
      width: 100%;
      height: auto;
      margin: 0;
    }

    h1 {
      font-family: var(--font-display);
      font-style: normal;
      font-weight: 500;
      font-size: 64px;
      line-height: 1.08;
      letter-spacing: -0.035em;
      text-wrap: balance;
      color: var(--ink);
      margin: 0 0 24px;
    }

    .tagline {
      font-family: var(--font-sans);
      font-size: 20px;
      font-weight: 400;
      line-height: 32px;
      letter-spacing: 0;
      max-width: 430px;
      color: var(--text);
      margin: 0;
    }
  }

  @media (max-width: 800px) {
    .sub-wrapper {
      width: 100%;
    }
    .container {
      grid-template-columns: minmax(0, 1fr);
      align-items: center;
      padding: 48px 0 64px;
      gap: 16px;

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
      .artwork {
        width: min(100%, 480px);
        margin: 0 auto;
      }
    }
  }
  @media (min-width: 0px) and (max-width: 500px) {
    min-height: 0;
    .container h1 {
      font-size: clamp(36px, 10vw, 44px);
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
  font-weight: 600;
  color: var(--ink);
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
    color: var(--ink);
    .separator {
      color: var(--text-subtle);
    }
    .product:hover {
      color: var(--accent);
    }
  }
`

const CtaButton = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 20px;
  border-radius: 999px;
  background: var(--ink);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow:
      -8px 4px 24px -8px var(--prisma-cyan),
      0 8px 24px -8px var(--prisma-yellow),
      8px 4px 24px -8px var(--prisma-coral);
  }
  &:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 4px;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
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
          <div className="artwork">
            <img
              className="main-image"
              src={heroScene}
              alt=""
              width={1200}
              height={900}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </HeaderWrapper>
  )
}

export default HomePageHeader
