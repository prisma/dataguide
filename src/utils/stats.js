const GA_TRACKING_ID = 'UA-74131346-14'
const GA_ADDRESS = 'https://www.prisma.io/gastats.js'
const COLLECT_ADDRESS = 'https://stats.prisma.workers.dev'

// Thin replacement for the (unmaintained) react-ga package: queue commands on
// window.ga until the self-hosted analytics.js script has loaded.
const ga = (...args) => {
  if (typeof window === 'undefined' || !window.ga) return
  window.ga(...args)
}

const loadAnalytics = () => {
  if (window.ga) return
  window.GoogleAnalyticsObject = 'ga'
  window.ga = function () {
    ;(window.ga.q = window.ga.q || []).push(arguments)
  }
  window.ga.l = 1 * new Date()
  const script = document.createElement('script')
  script.async = true
  script.src = GA_ADDRESS
  const firstScript = document.getElementsByTagName('script')[0]
  firstScript.parentNode.insertBefore(script, firstScript)
}

module.exports = {
  init() {
    if (typeof window === 'undefined') return
    loadAnalytics()

    ga('create', GA_TRACKING_ID, 'auto')
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
    ga('send', { hitType: 'pageview', page: page.trim() })
  },
}
