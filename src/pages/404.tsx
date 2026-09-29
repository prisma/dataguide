import * as React from 'react'
import { withPrefix } from 'gatsby'
import type { PageProps } from 'gatsby'
import Layout from '../components/layout'
import styled from 'styled-components'

const NotFoundWrapper = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 56px 40px !important;

  .code {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 500;
    color: var(--accent);
  }

  h1 {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 40px;
    line-height: 48px;
    letter-spacing: -0.02em;
    margin: 8px 0 12px;
  }

  p {
    margin: 0 0 28px;
    color: var(--text-muted);
  }

  a.back-link {
    display: inline-flex;
    align-items: center;
    height: 40px;
    padding: 0 18px;
    border-radius: 999px;
    background: var(--ink);
    color: #ffffff;
    font-weight: 500;
    text-decoration: none;
    &:hover {
      background: #333436;
    }
  }
`

const NotFoundPage = ({ location }: PageProps) => (
  <Layout location={location}>
    <NotFoundWrapper>
      <span className="code">404</span>
      <h1>Page not found</h1>
      <p>You just hit a route that doesn&#39;t exist!</p>
      <a className="back-link" href={withPrefix('/').replace(/\/$/, '') || '/'}>
        Back to the Data Guide
      </a>
    </NotFoundWrapper>
  </Layout>
)

export default NotFoundPage

export const Head = () => (
  <>
    <title>Page not found | Prisma's Data Guide</title>
    <meta name="robots" content="noindex" />
  </>
)
