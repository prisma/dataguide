import * as React from 'react'
import styled from 'styled-components'
import { AllArticles } from '../interfaces/AllArticles.interface'
import { useAllArticlesQuery } from '../hooks/useAllArticlesQuery'
import Link from './link'
import { ArrowRight, ArrowLeft } from 'react-feather'
import { urlGenerator } from '../utils/urlGenerator'

const NextPreviousWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 24px 40px;
  border-top: 1px solid #e2e8f0;
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
      color: #3182ce;
      font-weight: 600;
      line-height: 24px;
    }

    &:hover {
      .title {
        color: #4299e1;
      }

      .icon {
        background: #ebf8ff;
      }
    }
  }
  .icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
  span.direction {
    color: #a0aec0;
    font-size: 14px;
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

  @media (max-width: 768px) {
    padding: 24px;
    margin-top: -140px;
  }

  @media (max-width: 640px) {
    //padding: 12px;
    margin-top: -225px;
  }
`

const NextPrevious = ({ slug }: any) => {
  const { allMdx }: AllArticles = useAllArticlesQuery()
  const navWithoutIndex =
    allMdx &&
    allMdx.edges &&
    allMdx.edges
      .filter(edge => !edge.node.fields.slug.includes('index'))
      .filter(edge => !edge.node.frontmatter.hidePage)

  const nav =
    navWithoutIndex &&
    navWithoutIndex.map(e => ({ title: e.node.frontmatter.title, url: e.node.fields.modSlug }))
  let currentIndex

  let nextInfo: any = {}

  let previousInfo: any = {}
  let currentPaginationInfo: any = []

  if (nav) {
    currentPaginationInfo =
      nav &&
      nav.map((el, index) => {
        if (el && el.url === slug) {
          currentIndex = index
        }
      })

    if (currentIndex === undefined) {
      // index
      if (nav[0]) {
        nextInfo.url = nav[0].url
        nextInfo.title = nav[0].title
      }
      previousInfo.url = null
      previousInfo.title = null
      currentIndex = -1
    } else if (currentIndex === 0) {
      // first page
      nextInfo.url = nav[currentIndex + 1] ? nav[currentIndex + 1].url : null
      nextInfo.title = nav[currentIndex + 1] ? nav[currentIndex + 1].title : null
      previousInfo.url = null
      previousInfo.title = null
    } else if (currentIndex === nav.length - 1) {
      // last page
      nextInfo.url = null
      nextInfo.title = null
      previousInfo.url = nav[currentIndex - 1] ? nav[currentIndex - 1].url : null
      previousInfo.title = nav[currentIndex - 1] ? nav[currentIndex - 1].title : null
    } else if (currentIndex) {
      // any other page
      nextInfo.url = nav[currentIndex + 1].url
      nextInfo.title = nav[currentIndex + 1].title
      if (nav[currentIndex - 1]) {
        previousInfo.url = nav[currentIndex - 1].url
        previousInfo.title = nav[currentIndex - 1].title
      }
    }
  }
  if (currentIndex === 0) return null

  return (
    nav &&
    currentIndex && (
      <NextPreviousWrapper>
        {previousInfo.url && currentIndex >= 0 ? (
          <div className="previous">
            <div className="text">
              <span className="direction">Previous</span>
              <Link to={urlGenerator(nav[currentIndex - 1].url).replace(/\/$/, '')}>
                <span className="icon">
                  <ArrowLeft color="#3182CE" />
                </span>
                <div className="title">{nav[currentIndex - 1].title}</div>
              </Link>
            </div>
          </div>
        ) : null}
        {nextInfo.url && currentIndex >= 0 ? (
          <div className="next">
            <div className="text">
              <span className="direction">Next</span>
              <Link to={urlGenerator(nav[currentIndex + 1].url)}>
                <div className="title">{nav[currentIndex + 1] && nav[currentIndex + 1].title}</div>
                <span className="icon">
                  <ArrowRight color="#3182CE" />
                </span>
              </Link>
            </div>
          </div>
        ) : null}
      </NextPreviousWrapper>
    )
  )
}

export default NextPrevious
