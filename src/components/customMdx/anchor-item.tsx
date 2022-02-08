import React from 'react'

interface AnchorItemProps {
  id: string
  title: string
}

const AnchorItem = ({ children, ...props }: AnchorItemProps & React.ReactNode) => (
  <>
    <dt id={props.id}>
      <strong>{props.title}</strong>
    </dt>
    <dd>{children}</dd>
  </>
)

export default AnchorItem
