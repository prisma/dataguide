import React from 'react'
import styled from 'styled-components'

interface StatusNoticeProps {
  title?: string
}

// Tells readers up front when an article is out of date and where to find current
// instructions. Say what is known to have changed; don't guess.
const StatusNotice = ({
  title = 'This article is out of date',
  children,
}: React.PropsWithChildren<StatusNoticeProps>) => (
  <Notice role="note">
    <p className="title">{title}</p>
    {children}
  </Notice>
)

export default StatusNotice

const Notice = styled.aside`
  margin: 1.5em 0;
  padding: 14px 20px;
  border: 1px solid #f3d9a4;
  border-left: 4px solid var(--prisma-yellow);
  border-radius: var(--radius-sm);
  background: #fff9eb;
  color: var(--text-strong);
  font-size: 15px;
  line-height: 1.6;

  p {
    margin: 0;
  }

  p + p {
    margin-top: 0.5em;
  }

  .title {
    font-weight: 600;
  }
`
