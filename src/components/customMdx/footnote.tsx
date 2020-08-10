import React from 'react'
import styled from 'styled-components'

type FootnoteProps = React.ReactNode

const Footnote = ({ children, ...props }: FootnoteProps) => (
  <FootnoteWrapper>
    {children}
    <div className="note">
      {props.noteText && <p>{props.noteText}</p>}
      {props.noteLink && <a href={props.noteLink}>{props.noteLinkText}</a>}
    </div>
  </FootnoteWrapper>
)

export default Footnote

const FootnoteWrapper = styled.span`
  position: relative;
  border-bottom: 1px dashed black;

  &:hover .note {
    display: block;
  }

  .note {
    display: none;
    width: max-content;
    background-color: var(--tooltip-bg-color);
    color: white;
    text-align: left;
    border-radius: 8px;
    left: 0;
    position: absolute;
    z-index: 1;
    bottom: 150%;
    margin-left: -60px;
    padding: 10px 15px;
    font-size: 14px;

    p {
      margin: 0;
      font-size: inherit;
      font-style: italic;
    }

    a {
      color: var(--link-light-color) !important;
    }

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 10px;
      border-style: solid;
      border-color: var(--tooltip-bg-color) transparent transparent transparent;
    }
  }
`
