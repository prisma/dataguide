import * as React from 'react'
import type { PageProps } from 'gatsby'

export type PageLocation = PageProps['location']

// Gatsby passes the current location to page components. The layout makes it available
// here, so components don't import Gatsby's internal router (@gatsbyjs/reach-router).
const LocationContext = React.createContext<PageLocation>({
  pathname: '/',
  search: '',
  hash: '',
} as PageLocation)

export const LocationProvider = LocationContext.Provider

export const useLocation = () => React.useContext(LocationContext)
