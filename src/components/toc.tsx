import React from 'react'
import styled from 'styled-components'
import { stringify } from '../utils/stringify'

const ChapterTitle = styled.h2`
  font-family: var(--font-sans);
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-subtle) !important;
  margin: 0 0 10px;
`

const TocList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 1px solid var(--border);

  li {
    margin: 0;
    font-size: 15px;
    line-height: 22px;
  }

  a {
    display: block;
    margin-left: -1px;
    padding: 5px 0 5px 16px;
    border-left: 2px solid transparent;
    color: var(--text-muted);
    text-decoration: none;
    transition:
      color 0.15s,
      border-color 0.15s;

    &:hover,
    &:focus-visible {
      color: var(--text-strong);
      border-left-color: var(--accent);
    }
  }
`

const TOC = ({ headings }: any) => {
  let navItems: any[] = []
  navItems =
    headings &&
    headings.map((heading: any, index: number) => {
      return (
        <li key={index}>
          <a href={heading.url}>{stringify(heading.title)}</a>
        </li>
      )
    })
  return navItems && navItems.length ? (
    <nav aria-label="On this page">
      <ChapterTitle>On this page</ChapterTitle>
      <TocList>{navItems}</TocList>
    </nav>
  ) : null
}

export default TOC
