import React from 'react'
import styled from 'styled-components'

interface SidenoteProps {
  title?: string
}

type SidenoteInfoProps = React.ReactNode & SidenoteProps

const Sidenote = ({ children, ...props }: SidenoteInfoProps) => {
  return (
    <SidenoteWrapper>
        <h3>{props.title}</h3>
        {children}
    </SidenoteWrapper>
  )
}

export default Sidenote

const SidenoteWrapper = styled.div`
  background: #f7fafc;
  padding: 0px 32px 20px;
  line-height: 22px;
  color: #4a5568;

  h3 {
    font-size: 18px;
    border: 0;
    margin-top: 0;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`
