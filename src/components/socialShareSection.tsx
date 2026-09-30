import * as React from 'react'
import styled from 'styled-components'
import HNIcon from '../icons/HNIcon'
import Twitter from '../icons/Twitter'
import TwitterShareIcon from '../icons/TwitterShareIcon'
import { urlGenerator } from '../utils/urlGenerator'

const SocialWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-subtle);
  .homepage-link {
    color: var(--text-muted);
    text-decoration: none;
    display: flex;
    align-items: center;
    svg {
      margin: 0 8px !important;
      height: 16px;
      width: 16px;
    }
  }
  .updated {
    margin-left: auto;
    text-transform: none;
    letter-spacing: 0;
    font-size: 13px;
    font-weight: 400;
    color: var(--text-muted);
  }
  .buttons {
    display: flex;
    gap: 8px;
    a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--text-muted);
      transition:
        color 0.15s,
        border-color 0.15s;
      svg {
        width: 14px !important;
        height: 14px !important;
      }
      &:hover {
        color: var(--text-strong);
        border-color: var(--border-strong);
      }
    }
  }
`

const twitterShareUrl = `https://twitter.com/intent/tweet?text=I%27ve%20found%20this%20page%20on%20%40prisma%27s%20%23DataGuide%20useful%21%20`

const SocialShareSection = ({ homePage, hnPostId, slug, lastUpdated, lastUpdatedLabel }: any) => {
  const currentDocsPageURL =
    slug && slug !== '/'
      ? `https://www.prisma.io/dataguide${urlGenerator(slug)}`
      : 'https://www.prisma.io/dataguide'
  return (
    <SocialWrapper className="social-share">
      {homePage && (
        <a
          className="homepage-link"
          href={`${twitterShareUrl}${currentDocsPageURL}`}
          target="_blank"
        >
          Share on TWITTER <Twitter />
        </a>
      )}
      {!homePage && (
        <>
          <span>Share on</span>
          <div className="buttons">
            {hnPostId && (
              <a
                href={`https://news.ycombinator.com/item?id=${hnPostId}`}
                target="_blank"
                aria-label="Discuss on Hacker News"
              >
                <HNIcon />
              </a>
            )}
            <a
              href={`${twitterShareUrl}${currentDocsPageURL}`}
              target="_blank"
              aria-label="Share on X"
            >
              <TwitterShareIcon />
            </a>
          </div>
          {lastUpdated && (
            <span className="updated">
              Updated <time dateTime={lastUpdated}>{lastUpdatedLabel}</time>
            </span>
          )}
        </>
      )}
    </SocialWrapper>
  )
}

export default SocialShareSection
