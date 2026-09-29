import React from 'react'
import styled from 'styled-components'

type FootnoteProps = React.ReactNode

const Footnote = ({ children }: FootnoteProps) => {
  const [tooltipOpen, setTooltipOpen] = React.useState(false)
  const ref = React.useRef(null)
  const openTooltip = () => setTooltipOpen(true)

  React.useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        setTooltipOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref])

  const childArray = React.Children.toArray(children)
  const note = childArray.filter((child: any) => child.type === 'note')
  const text = childArray.filter((child: any) => child.type === 'text')

  return (
    <FootnoteWrapper ref={ref}>
      <span onClick={openTooltip}>{text}</span>
      {note && tooltipOpen && <div className="note">{note}</div>}
    </FootnoteWrapper>
  )
}

export default Footnote

const FootnoteWrapper = styled.span`
  position: relative;
  border-bottom: 1px dashed var(--accent);
  cursor: help;

  .note {
    width: 250px;
    background-color: var(--tooltip-bg-color);
    color: white;
    text-align: left;
    border-radius: 10px;
    box-shadow: var(--shadow-pop);
    left: 0;
    position: absolute;
    z-index: 1;
    bottom: 150%;
    margin-left: -125px;
    padding: 10px 15px;
    font-size: 14px;

    p {
      margin: 0;
      font-size: inherit;
      line-height: 20px;
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
