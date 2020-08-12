import React from 'react'
import styled from 'styled-components'

type FootnoteProps = React.ReactNode

const Footnote = ({ children }: FootnoteProps) => {
  const [tooltipOpen, setTooltipOpen] = React.useState(false)
  const note =
    children && children.filter((child: any) => child.props && child.props.originalType === 'note')
  const text =
    children && children.filter((child: any) => child.props && child.props.originalType === 'text')
  const toggleTooltip = () => setTooltipOpen(!tooltipOpen)
  return (
    <FootnoteWrapper>
      <span onClick={toggleTooltip}>{text}</span>
      {note && tooltipOpen && <div className="note">
        {note}
      </div>}
    </FootnoteWrapper>
  )
}

export default Footnote

const FootnoteWrapper = styled.span`
  position: relative;
  border-bottom: 1px dashed black;

  .note {
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
