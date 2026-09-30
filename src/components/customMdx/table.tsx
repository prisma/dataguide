import React from 'react'
import styled from 'styled-components'

type TableProps = React.ComponentProps<'table'>

const Table = ({ children, ...props }: TableProps) => {
  return (
    // Focusable so keyboard users can scroll wide tables
    <TableWrapper role="group" aria-label="Table" tabIndex={0}>
      <table {...props}>{children}</table>
    </TableWrapper>
  )
}

export default Table

const TableWrapper = styled.div`
  overflow-x: auto;
  margin-top: 1em;
  @media (min-width: 0px) and (max-width: 767px) {
    margin-right: -24px;
    margin-left: -24px;

    table {
      border-left: 0;
      border-right: 0;
      border-radius: 0 !important;
    }
  }
`
