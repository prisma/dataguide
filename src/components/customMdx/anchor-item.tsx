import React from 'react'
import styled from 'styled-components'

interface AnchorItemProps {
  id: string
  title: string
}

const AnchorItemWrapper = styled.div`
    margin-bottom: 3rem;
    p {
        margin: 0;
    }
`

const AnchorItem = ({ children, ...props }: AnchorItemProps & React.ReactNode) => (
  <AnchorItemWrapper>
    <dt id={props.id}>
      <strong>{props.title}</strong>
    </dt>
    <dd>{children}</dd>
  </AnchorItemWrapper>
)

export default AnchorItem
