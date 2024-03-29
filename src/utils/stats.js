const ReactGA = require('react-ga')

const GA_TRACKING_ID = 'UA-74131346-14'
const GA_ADDRESS = 'https://www.prisma.io/gastats.js'
const COLLECT_ADDRESS = 'https://stats.prisma.workers.dev'

module.exports = {
  init() {
    ReactGA.initialize(GA_TRACKING_ID, {
      gaAddress: GA_ADDRESS,
    })

    const ga = ReactGA.ga()
    ga('set', 'anonymizeIp', true)
    ga((u) => {
      // Override sendHitTask to proxy tracking requests
      u.set('sendHitTask', (model) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', COLLECT_ADDRESS, true)
        xhr.send(model.get('hitPayload'))
      })
    })
  },

  trackPage(page) {
    const { host } = window.location

    if (host.includes('localhost') || host.includes('vercel')) {
      return
    }
    ReactGA.pageview(page)
  },
}
