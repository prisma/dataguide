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
    padding: 45px 0;

    .content {
      width: 65%;
    }

    .love a {
      color: inherit !important;
    }

    &.info {
      color: var(--list-bullet-color);
      align-items: center;

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
        width: auto;
        margin: 0 0 45px;
        text-align: center;

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
      <div className={`${!isHomePage && 'push-right'}`}>
        <div className="container">
          <div className="content">
            <NewsLetter newsletter={newsletter} />
          </div>
          <FooterLogo />
        </div>
        <div className="container info">
          <div className="content">
            <h4>Prisma's Data Guide</h4>
            <p>A growing library of articles focused on making databases more approachable.</p>
          </div>
          <div className="love">Made with ❤️ by <a href="https://prisma.io" target="_blank">Prisma</a></div>
        </div>
      </div>
    </FooterWrapper>
  )
}

export default Footer
