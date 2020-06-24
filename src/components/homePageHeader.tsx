import * as React from 'react'
import styled from 'styled-components'
import HeaderDiagram from '../icons/HeaderDiagram'

const HeaderWrapper = styled.div`
  background: linear-gradient(140.44deg, #3c366b 23.76%, #434190 79.42%),
    linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
  min-height: 510px;
  display: flex;
  justify-content: center;

  .container {
    // width: 800px;
    display: flex;
    justify-content: space-between;
    color: white;
    padding: 100px 0;
    > * {
      flex: 1;
    }
    .content {
      margin-right: 50px;
    }
    h1 {
      font-style: normal;
      font-weight: bold;
      font-size: 48px;
      line-height: 48px;
      font-family: Rubik;
      // letter-spacing: -0.03em;
      margin: 0 0px 24px;
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      line-height: 28px;
      width: 410px;
    }

    p {
      margin: 16px 0;
      width: 370px;
    }
  }

  @media (min-width: 0px) and (max-width: 1024px) {
    .container {
      flex-direction: column;
      align-items: center;

      .content {
        margin: 0;
        text-align: center;
        padding: 0 25%;

        > * {
          width: auto;
        }
      }
    }
  }
`

const Highlight = styled.span`
  background: #4c51bf;
`

const HomePageHeader = () => {
  return (
    <HeaderWrapper>
      <div className="container">
        <div className="content">
          <h1>Prisma's Data Guide</h1>
          <h3>
            Learn how databases work, how to choose the right one, and{' '}
            <Highlight>how to use databases</Highlight> with your applications. Made with ❤️ by Prisma.
          </h3>
          <p>
            The articles here will walk you through database fundamentals, help you choose the right
            technologies, and teach you how to unlock the potential of your databases. New material
            is added regularly, so be sure to check back often!
          </p>
        </div>
        <HeaderDiagram />
      </div>
    </HeaderWrapper>
  )
}

export default HomePageHeader
