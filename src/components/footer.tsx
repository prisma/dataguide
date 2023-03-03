import * as React from 'react'
import styled from 'styled-components'
import NewsLetter from '../components/newsletter'
import { FooterProps } from '../interfaces/Layout.interface'
import FooterLogo from '../icons/FooterLogo'

type FooterViewProps = {
  footerProps: FooterProps
  isHomePage?: boolean
}

const FooterWrapper = styled.div`
  display: flex;
  justify-content: center;
  color: var(--secondary-font-color);
  .push-right {
    margin-left: 230px;
  }

  .container-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 2rem;
    gap: 2rem;
    max-width: 944px;
    @media (max-width: 500px) {
      flex-direction: column-reverse;
      margin-top: 124px;
    }

    > img {
    }
  }

  h3 {
    font-size: 1rem;
    line-height: 3rem;
    font-weight: bold;
    letter-spacing: 0.1em;
    margin: 0;
  }

  .container {
    width: 800px;
    display: flex;
    justify-content: space-between;
    margin-bottom: 80px;
    padding: 45px 0;

    .love a {
      color: inherit !important;
      font-weight: bold;
      margin-top: 35px;
    }

    &.info {
      color: var(--secondary-font-color);
      align-items: center;
      flex: 1;
      display: block;
      width: auto;

      h4 {
        margin: 16px 0;
        font-weight: bold;
        font-size: 16px;
        line-height: 16px;

        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      p {
        margin: 0;
        color: var(--code-inner-color);
        font-weight: bold;
      }
      @media (max-width: 500px) {
        text-align: center;
        margin-bottom: 80px;
        .content {
          text-align: center;
        }
        p {
          font-weight: normal;
        }
        .love a {
          margin-top: 35px;
          font-weight: normal;
        }
      }

    }
  }

  @media (min-width: 0px) and (max-width: 1024px) {
    padding: 16px;
    .push-right {
      margin-left: 0;
    }
    .container {
      width: auto;
      flex-direction: column;
      align-items: center;

      .content {
        > * {
          width: auto;
        }
      }
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    padding: 0 120px;
  }
`

const Footer = ({ footerProps, isHomePage }: FooterViewProps) => {
  const { newsletter } = footerProps
  return (
    <FooterWrapper>
      <div className={`container-wrapper ${!isHomePage && 'push-right'}`}>
        <div className="container info">
          <div className="content">
            <h4>Prisma's Data Guide</h4>
            <p>A growing library of articles focused on making databases more approachable.</p>
          </div>
          <div className="love">Made with ❤️ by <a href="https://www.prisma.io" target="_blank">Prisma</a></div>
        </div>
        <img src="/footer-icon.svg" />
      </div>
    </FooterWrapper>
  )
}

export default Footer
