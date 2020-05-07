import * as React from 'react'
import styled from 'styled-components'

const HeaderWrapper = styled.div`
  background: url('./home-header-lines.svg') center -400px no-repeat,
    linear-gradient(180deg, var(--main-font-color) 0%, var(--tag-media-color) 100%);
  height: 510px;

  .container {
    width: 1110px;
    display: flex;
    justify-content: space-between;
  }
`

const HomePageHeader = () => {
  return <HeaderWrapper>{/* <div className={'container'}></div> */}</HeaderWrapper>
}

export default HomePageHeader
