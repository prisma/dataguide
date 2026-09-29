import * as React from 'react'
import styled from 'styled-components'
import { AllArticles } from '../interfaces/AllArticles.interface'
import { useAllArticlesQuery } from '../hooks/useAllArticlesQuery'
import Link from './link'
import { ArrowRight, ArrowLeft } from 'react-feather'
import { urlGenerator } from '../utils/urlGenerator'
import { getNavNeighbours, isIndexSlug } from '../utils/navigation'

const NextPreviousWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 24px 40px;
  border-top: 1px solid var(--border);
  margin-top: -114px;
  margin-bottom: 20px;
  align-items: flex-start;

  .previous,
  .next {
    display: flex;
    align-items: flex-end;
  }
  a {
    text-decoration: none;
    display: flex;
    .title {
      color: var(--text-strong);
      font-family: var(--font-display);
      font-weight: 500;
      line-height: 24px;
      transition: color 0.15s;
    }

    &:hover {
      .title {
        color: var(--accent);
      }

      .icon {
        background: var(--accent-soft);
      }
    }
  }
  .icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
  span.direction {
    color: var(--text-subtle);
    font-size: 13px;
    line-height: 24px;
  }
  .next {
    text-align: right;
    .direction {
      margin-right: 39px;
    }
    a .title {
      margin-right: 14px;
    }
  }

  .previous {
    .direction {
      margin-left: 39px;
    }
    a .title {
      margin-left: 14px;
    }
  }
`

const NextPrevious = ({ slug }: { slug: string }) => {
  const { allMdx }: AllArticles = useAllArticlesQuery()
  const nav = allMdx.edges
    .filter((edge) => !isIndexSlug(edge.node.fields.slug) && !edge.node.frontmatter.hidePage)
    .map((edge) => ({ title: edge.node.frontmatter.title, url: edge.node.fields.modSlug }))
  const { previous, next } = getNavNeighbours(nav, slug)

  if (!previous && !next) return null

  return (
    <NextPreviousWrapper>
      {previous ? (
        <div className="previous">
          <div className="text">
            <span className="direction">Previous</span>
            <Link to={urlGenerator(previous.url)}>
              <span className="icon">
                <ArrowLeft color="#5A3FD8" />
              </span>
              <div className="title">{previous.title}</div>
            </Link>
          </div>
        </div>
      ) : (
        <div />
      )}
      {next ? (
        <div className="next">
          <div className="text">
            <span className="direction">Next</span>
            <Link to={urlGenerator(next.url)}>
              <div className="title">{next.title}</div>
              <span className="icon">
                <ArrowRight color="#5A3FD8" />
              </span>
            </Link>
          </div>
        </div>
      ) : null}
    </NextPreviousWrapper>
  )
}

export default NextPrevious
