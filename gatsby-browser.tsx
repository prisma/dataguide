const { init, trackPage } = require('./src/utils/stats')
const { init: initPostHog, trackPage: trackPostHogPage } = require('./src/utils/posthog')
const { goToNav } = require('./src/utils/goToNavItem')

exports.onClientEntry = () => {
  init()
  initPostHog()
}

exports.onRouteUpdate = ({ location }) => {
  trackPage(location.pathname)
  trackPostHogPage(location.pathname)
  goToNav(location.pathname)
}

// Gatsby restores the scroll position it saved for a page whenever the page is loaded again in the
// same tab, so a fresh visit could jump to wherever the reader last was (e.g. halfway down the
// homepage). On a full page load, leave scrolling to the browser, except for links to a heading.
exports.shouldUpdateScroll = ({ prevRouterProps, routerProps }) =>
  prevRouterProps !== undefined || Boolean(routerProps?.location?.hash)
