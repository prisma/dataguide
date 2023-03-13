import * as React from 'react'
import styled from 'styled-components'
// import Up from '../icons/Up'
// import Down from '../icons/Down'
import Link from './link'
// import config from '../../config'
// import { ButtonWrapper } from './customMdx/button'
// import Twitter from '../icons/Twitter'
// import { useLocation } from '@reach/router'

// const sentiments: any = {
//   unhappy: 'Unhappy',
//   happy: 'Happy',
// }

// const gitIssueUrl = `https://github.com/prisma/dataguide/issues/new?labels=kind/docs,content`
// const twitterShareUrl = `https://twitter.com/intent/tweet?text=I%27ve%20found%20this%20%40dataguide%20page%20helpful%21%20`

const PageBottomWrapper = styled.div`
  display: flex;
  font-size: 14px;
  flex-direction: row;
  justify-content: space-between;
  padding: 1rem 40px;
  align-items: center;
  button svg {
    cursor: pointer;
    transition: width 2s linear 1s;
  }
  .edit-git,
  .message {
    color: var(--code-inner-color) !important;
  }

  button {
    color: var(--white-color) !important;
  }
  @media (min-width: 0px) and (max-width: 500px) {
    padding: 1rem;
    .edit-git {
      order: 1;
    }
  }
  .edit-git {
    font-style: normal;
    font-weight: 800;
    font-size: 14px;
    line-height: 17px;
    color: #5D6571;
    text-decoration: underline;
  }
  .return-home {
    font-style: normal;
    font-weight: 800;
    font-size: 14px;
    line-height: 17px;
    color: #5D6571;
    position: relative;
    &:after {
      content: "";
      position: absolute;
      width: 8px;
      background: #5D6571;
      height: 2px;
      left: -12px;
      top: 8.5px;
    }
    &:before {
      border-top: 2px solid #5D6571;
      width: 5px;
      height: 5px;
      border-right: 2px solid #5D6571;
      content: "";
      position: absolute;
      left: -13px;
      transform: rotate(-135deg);
      top: 6px;
    }
  }
`

const PageBottom = ({ editDocsPath, pageUrl }: any) => {

  return (
    <PageBottomWrapper>
      {pageUrl === '/' && (<a href="https://www.prisma.io" className="return-home">
       Return to Prisma
      </a>)}
      {editDocsPath && (
        <Link className="edit-git" to={`${editDocsPath}`}>
          Edit this page on GitHub
        </Link>
      )}
    </PageBottomWrapper>
  )
}

export default PageBottom
