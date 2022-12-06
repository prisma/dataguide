import * as React from 'react'
import { Snippet } from 'react-instantsearch-dom'
import Link from '../link'
import styled from 'styled-components'
import ParentTitle from '../parentTitleComp'

const HitComp = styled.div`
  padding: 24px 40px !important;
  font-style: normal;
  font-weight: normal;
  font-size: 16px;
  line-height: 24px;
  border-bottom: 1px solid #E2E8F0;
  // max-height: 150px;
  &:last-item {
    border: 0;
  }
  a {
    color: #2D3748 !important;
    display: block;
  }
  h4 {
    font-weight: normal;
  }
  h3 {
    font-weight: 600;
    line-height: 28px;
    letter-spacing: -0.01em;
    margin: 10px 0;
  }
  &:hover,
  &:focus {
    background: #F7FAFC;
  }
  mark {
    color: #718096 !important;
    background: #ebf8ff;
    padding: 2px;
    font-weight: bold;
  }

  .more {
    color: #718096;
    font-size: 14px;
    width: fit-content;
    margin: 10px 0 0;
  }

  @media (min-width: 0px) and (max-width: 768px) {
    max-height: fit-content;
    padding: 24px !important;
  }
`

const DocHit = ({ hit, selected }: any) =>
  hit._distinctSeqID == 0 ? (
    <HitComp style={{ background: selected ? '#F7FAFC' : 'white' }}>
      <Link style={{ boxShadow: `none`, textDecoration: 'none' }} to={hit.path}>
        <ParentTitle slug={hit.slug} nonLink={true} />
        <h3>
          <Snippet hit={hit} attribute="title" tagName="mark" /> /{' '}
          <span style={{ color: 'var(--code-inner-color)' }}>
            <Snippet hit={hit} attribute="heading" tagName="mark" />
          </span>
        </h3>
        <Snippet hit={hit} attribute="content" tagName="mark" />
        {hit.moreCount > 1 && <p className="more">... More results on this page</p>}
      </Link>
    </HitComp>
  ) : null

export default DocHit
