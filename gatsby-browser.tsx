const {
  init: initPostHog,
  trackPage: trackPostHogPage,
  trackEvent,
} = require('./src/utils/posthog')
const { installCtaTracking } = require('./src/utils/readerEvents')
const { goToNav } = require('./src/utils/goToNavItem')

exports.onClientEntry = () => {
  initPostHog()
  installCtaTracking(document, trackEvent)
}

exports.onRouteUpdate = ({ location }) => {
  trackPostHogPage(location.pathname)
  goToNav(location.pathname)
}

// Gatsby restores the scroll position it saved for a page whenever the page is loaded again in the
// same tab, so a fresh visit could jump to wherever the reader last was (e.g. halfway down the
// homepage). On a full page load, leave scrolling to the browser, except for links to a heading.
exports.shouldUpdateScroll = ({ prevRouterProps, routerProps }) =>
  prevRouterProps !== undefined || Boolean(routerProps?.location?.hash)
