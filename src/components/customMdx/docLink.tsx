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
  position: relative;
  color: var(--text-strong) !important;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  width: 100%;
  padding: 14px 44px 14px 18px;
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  text-decoration: none;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;

  &::after {
    content: '→';
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-subtle);
    transition:
      color 0.15s,
      right 0.15s;
  }

  &:hover,
  &:focus-visible {
    border-color: var(--accent-border);
    background: var(--accent-soft);
    color: var(--accent-strong) !important;
    &::after {
      color: var(--accent);
      right: 14px;
    }
  }
`

const DocLink = ({ icon, text, href, ...props }: DocLinkProps) => (
  <DocLinkWrapper to={href} {...props}>
    <span>{text}</span>
  </DocLinkWrapper>
)

export default DocLink
