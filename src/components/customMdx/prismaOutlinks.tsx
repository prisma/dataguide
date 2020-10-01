import React from 'react'
import styled from 'styled-components'
import withProps from 'styled-components-ts'

import ListDot from '../../images/blue-list-dot.png'
import PrismaLogo from '../../icons/PrismaLogo'

interface OutlinkProps {
  inner?: boolean
}

type PrismaOutlinkProps = React.ReactNode & OutlinkProps

const PrismaOutlinks = ({ children, inner }: PrismaOutlinkProps) => {
  return (
    <PrismaOutlinksWrapper inner={inner}>
      {!inner && 'RELATED ON PRISMA.IO'}

      {children}
      <LogoWrapper>
        <span className="icon">
          <PrismaLogo color="#63B3ED" />
        </span>
        Prisma is an open-source database toolkit for Typescript and Node.js that aims to make app
        developers more productive and confident when working with databases.
      </LogoWrapper>
    </PrismaOutlinksWrapper>
  )
}

export default PrismaOutlinks

const PrismaOutlinksWrapper = withProps<any>(styled.div)`
  background: #ebf8ff;
  color: #63b3ed;
  ${p => (!p.inner ? 'padding: 20px 40px;' : 'padding: 24px;')}
  ${p => (!p.inner ? 'margin: 0 -40px;' : 'margin: 16px 0;')}
  ${p => (p.inner ? 'border-radius: 4px;' : '')}
  font-size: 14px;

  .list {
    margin-bottom: 2rem;
    li {
      list-style-image: url(${ListDot});
      margin-left: -32px;
    }
  }

  a {
    color: #3182ce;
    font-weight: 600;
    font-size: 16px;
    &:hover {
      color: #2b6cb0;
    }
  }
`

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;

  .icon {
    background: #ffffff;
    border-radius: 4px;
    width: 2rem;
    height: 2rem;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
  }
`
