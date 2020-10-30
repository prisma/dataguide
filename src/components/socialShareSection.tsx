import * as React from 'react'
import styled from 'styled-components'
import HNIcon from '../icons/HNIcon'
import Twitter from '../icons/Twitter'
import TwitterShareIcon from '../icons/TwitterShareIcon'
import { useLocation } from '@reach/router'

const SocialWrapper = styled.div`
  display: flex;
  text-transform: uppercase;
  font-size: 14px;
  font-weight: 700;
  color: var(--list-bullet-color);
  line-height: 14px;
  letter-spacing: 0.06em;
  .homepage-link {
    color: var(--list-bullet-color);
    text-decoration: none;
    display: flex;
    align-items: center;
    svg {
      margin: 0 8px !important;
      height: 16px;
      width: 16px;
    }
  }
  .buttons {
    a {
      margin-left: 10px;
      cursor: pointer;
    }
  }
  padding: 1rem 0;
  align-items: center;
`

const twitterShareUrl = `https://twitter.com/intent/tweet?text=I%27ve%20found%20this%20%40dataguide%20page%20helpful%21%20`

const SocialShareSection = ({ homePage, hnPostId }: any) => {
  let location = useLocation()
  const currentDocsPageURL = encodeURIComponent(location ? location.href : '/')

  return (
    <SocialWrapper>
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
              <a href={`https://news.ycombinator.com/item?id=${hnPostId}`} target="_blank">
                <HNIcon />
              </a>
            )}
            <a href={`${twitterShareUrl}${currentDocsPageURL}`} target="_blank">
              <TwitterShareIcon />
            </a>
          </div>
        </>
      )}
    </SocialWrapper>
  )
}

export default SocialShareSection
