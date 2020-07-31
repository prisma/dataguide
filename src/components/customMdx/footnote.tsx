import React from 'react'
import styled from 'styled-components'

type FootnoteProps = React.ReactNode

const Footnote = ({ children, ...props }: FootnoteProps) => {
  return (
    <FootnoteWrapper>
      {children}
    </FootnoteWrapper>
  )
}

export default Footnote

const FootnoteWrapper = styled.span`
  text-decoration: underline;
`
