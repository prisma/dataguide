import * as React from 'react'
import type { PageProps } from 'gatsby'
import Layout from '../components/layout'
import styled from 'styled-components'

const NotFoundWrapper = styled.div`
  font-family: 'Rubik';
  margin-top: 200px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  h1 {
    font-weight: bold;
    font-family: 'Rubik';
  }
`

const NotFoundPage = ({ location }: PageProps) => (
  <Layout location={location}>
    <NotFoundWrapper>
      <h1>404 | NOT FOUND</h1>
      You just hit a route that doesn&#39;t exist!
    </NotFoundWrapper>
  </Layout>
)

export default NotFoundPage
