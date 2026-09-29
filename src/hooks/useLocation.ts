import * as React from 'react'
import type { PageProps } from 'gatsby'

export type PageLocation = PageProps['location']

// Gatsby passes the current location to page components. The layout makes it available
// here, so components don't import Gatsby's internal router (@gatsbyjs/reach-router).
const LocationContext = React.createContext<PageLocation | null>(null)

export const LocationProvider = LocationContext.Provider

export const useLocation = (): PageLocation => {
  const location = React.useContext(LocationContext)
  if (!location) {
    // Outside the layout (e.g. in a `Head` export) there is no provider: pass the page's
    // `location` prop explicitly instead of silently using a wrong location.
    throw new Error('useLocation() must be used inside <Layout>, which provides the page location')
  }
  return location
}
