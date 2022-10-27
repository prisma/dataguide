import * as React from 'react'
import styled from 'styled-components'
import HeaderDiagram from '../icons/HeaderDiagram'
import PrismaLogo from '../icons/PrismaLogo'
import SocialShareSection from './socialShareSection'
import Search from '../components/search'
import { useLocation } from '@reach/router'

const HeaderWrapper = styled.div`
  background: linear-gradient(137.05deg, #3c366b 23.76%, #4c51bf 79.42%),
    linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
  min-height: 510px;
  display: flex;
  justify-content: center;

  .sub-wrapper {
    max-width: 880px;
    width: 880px;
    margin-top: 32px;

    @media (min-width: 0px) and (max-width: 880px) {
      padding: 0 16px;
    }
  }

  .container {
    display: flex;
    justify-content: space-between;
    color: white;
    padding: 60px 0 20px;
    > * {
      flex: 1;
    }

    h1 {
      font-style: normal;
      font-weight: bold;
      font-size: 68px;
      line-height: 1;
      font-family: Rubik;
      letter-spacing: -0.03em;
      margin: 0 0px 24px;
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      line-height: 28px;
      width: 410px;
      color: #c3dafe;
    }

    p {
      margin: 16px 0;
      width: 370px;
    }
  }
  
  @media (min-width: 0) and (max-width: 1024px) {
    .sub-wrapper {
      width: 100%;
    }
    .container {
      flex-direction: column;
      align-items: center;

      .content {
        margin: 0;
        text-align: center;
        padding: 0 10%;

        > * {
          width: auto;
        }
      }
      svg{
        margin-top:0;
      }
    }
  }
  @media (min-width: 0px) and (max-width: 500px) {
    .container h1 {
      font-size:48px;
    }
    .container .content {
      padding: 0 20px;
    }
    .container .main-image {
      width: 400px;
      height:300px
    }
  }
`

const Highlight = styled.span`
  padding: 0 4px;
  background: #4c51bf;
`

const SearchComponent = styled(Search)`
  position: absolute;
  top: 12px;
  width: auto;
  left: 12px;
`

const SearchWrapper = styled.div`
> * {
  width: 100%;
  &.show {
    width: calc(100% - 32px);
  }
}
`

const HeaderNavWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (min-width: 0) and (max-width: 1024px) {
    padding: 0 16px;
  }
`

const HomePageHeader = () => {
  const [showDataguideBtn, setShowDataguideBtn] = React.useState(true)
  const changeHitsStatus = (status: boolean) => setShowDataguideBtn(!status)
  const location = useLocation()
  return (
    <HeaderWrapper>
      <div className="sub-wrapper">
        <HeaderNavWrapper>
          <a href="https://www.prisma.io" target="_blank"><PrismaLogo /></a>
          <SearchWrapper>
            <SearchComponent hitsStatus={changeHitsStatus} location={location} />
          </SearchWrapper>
        </HeaderNavWrapper>
        <div className="container">
          <div className="content">
            <h1>Prisma's Data Guide</h1>
            <h3>
              Learn how databases work, how to choose the right one, and{' '}
              <Highlight>how to use databases</Highlight> with your applications to their full
              potential.
            </h3>
            {/* <SocialShareSection homePage={true}/> */}
            {/* <p>
            The articles here will walk you through database fundamentals, help you choose the right
            technologies, and teach you how to unlock the potential of your databases. New material
            is added regularly, so be sure to check back often!
          </p> */}
          </div>
          <div>
            <HeaderDiagram className="main-image"/>
          </div>
        </div>
      </div>
    </HeaderWrapper>
  )
}

export default HomePageHeader
