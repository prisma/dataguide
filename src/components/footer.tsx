import * as React from 'react'
import styled from 'styled-components'
import { withPrefix } from 'gatsby'
import { FooterProps } from '../interfaces/Layout.interface'
import FooterLogo from '../icons/FooterLogo'
import Logo from '../icons/Logo'
import { Wordmark } from './header'

type FooterViewProps = {
  footerProps: FooterProps
  isHomePage?: boolean
}

const FooterWrapper = styled.footer`
  display: flex;
  justify-content: center;
  margin-top: 48px;
  padding: 0 16px;
  color: var(--text-muted);

  .container-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 880px;
    gap: 2rem;
    padding: 40px 0 72px;
    border-top: 1px solid var(--border);
  }

  &.push-right .container-wrapper {
    margin-left: 255px;
  }

  .info {
    max-width: 440px;
  }

  p {
    margin: 16px 0 0;
    font-size: 15px;
    line-height: 24px;
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    margin-top: 20px;
    a {
      font-size: 14px;
      font-weight: 500;
      color: var(--text) !important;
      text-decoration: none;
      &:hover {
        color: var(--accent) !important;
      }
    }
  }

  .love {
    margin-top: 20px;
    font-size: 13px;
    color: var(--text-subtle);
    a {
      color: var(--text-muted) !important;
    }
  }

  svg.illustration {
    flex-shrink: 0;
  }

  @media (min-width: 0px) and (max-width: 1024px) {
    &.push-right .container-wrapper {
      margin-left: 0;
    }
  }

  @media (max-width: 640px) {
    .container-wrapper {
      flex-direction: column-reverse;
      align-items: flex-start;
      padding-bottom: 96px;
    }
    svg.illustration {
      width: 160px;
      height: auto;
    }
  }
`

const Footer = ({ isHomePage }: FooterViewProps) => (
  <FooterWrapper className={isHomePage ? '' : 'push-right'}>
    <div className="container-wrapper">
      <div className="info">
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
        <p>A growing library of articles focused on making databases more approachable.</p>
        <nav aria-label="Prisma">
          <a href="https://www.prisma.io/orm">Prisma ORM</a>
          <a href="https://www.prisma.io/postgres">Prisma Postgres</a>
          <a href="https://www.prisma.io/docs">Docs</a>
          <a href="https://www.prisma.io/blog">Blog</a>
          <a href="https://github.com/prisma/dataguide">GitHub</a>
        </nav>
        <div className="love">
          Made with ❤️ by <a href="https://www.prisma.io">Prisma</a>
        </div>
      </div>
      <FooterLogo className="illustration" />
    </div>
  </FooterWrapper>
)

export default Footer
