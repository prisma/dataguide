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
