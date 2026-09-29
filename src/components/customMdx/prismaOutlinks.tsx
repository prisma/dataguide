import React from 'react'
import styled from 'styled-components'

import PrismaMark from '../../icons/PrismaMark'

interface OutlinkProps {
  inner?: boolean
  children?: React.ReactNode
}

const PrismaOutlinks = ({ children, inner }: OutlinkProps) => {
  return (
    <PrismaOutlinksWrapper $inner={inner}>
      {!inner && (
        <Label>
          <PrismaMark size={14} />
          Related on prisma.io
        </Label>
      )}

      {children}
      <LogoWrapper>
        Prisma is an open-source database toolkit for TypeScript and Node.js that aims to make app
        developers more productive and confident when working with databases.
      </LogoWrapper>
    </PrismaOutlinksWrapper>
  )
}

export default PrismaOutlinks

const PrismaOutlinksWrapper = styled.div<{ $inner?: boolean }>`
  position: relative;
  background: var(--surface-subtle);
  color: var(--text);
  ${(p) => (!p.$inner ? 'padding: 24px 40px;' : 'padding: 24px;')}
  ${(p) =>
    !p.$inner
      ? 'margin: 8px -40px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);'
      : 'margin: 16px 0; border: 1px solid var(--border); border-radius: var(--radius-md);'}
  font-size: 15px;

  p {
    margin: 12px 0;
  }

  .list {
    margin-bottom: 1.5rem;
  }

  a {
    color: var(--text-strong);
    font-weight: 500;
  }

  @media (min-width: 0px) and (max-width: 767px) {
    ${(p) => (!p.$inner ? 'padding: 20px 24px; margin: 8px -24px;' : '')}
  }
`

const Label = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
`

const LogoWrapper = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  line-height: 20px;
  color: var(--text-muted);
`
