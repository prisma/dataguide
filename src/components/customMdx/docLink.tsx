import React from 'react'
import styled from 'styled-components'
import File from '../../icons/File'
import Display from '../../icons/Display'
import Code from '../../icons/Code'
import Database from '../../icons/Database'
import Link from '../link'

interface DocLinkProps {
  text: string[]
  icon: keyof typeof icons
  href: string
}

const icons = {
  file: <File />,
  database: <Database />,
  display: <Display />,
  code: <Code />,
}
const DocLinkWrapper = styled(Link)`
  color: var(--main-font-color) !important;
  cursor: pointer;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 100%;
  padding: 16px;
  font-style: normal;
  font-weight: 600;
  font-size: 18px;
  line-height: 18px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  color: #1a202c;
  text-decoration: none;
  svg {
    margin-right: 8px;
    width: 20px;
    height: 24px;

    path {
      stroke-width: 1;
      stroke: var(--list-bullet-color);
    }
  }
`

const DocLink = ({ icon, text, href, ...props }: DocLinkProps) => (
  <DocLinkWrapper to={href} {...props}>
    <span>{text}</span>
  </DocLinkWrapper>
)

export default DocLink
