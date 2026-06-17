// posthog-js ships as an ES module; grab the default export when consumed via CommonJS.
const posthogPkg = require('posthog-js')
const posthog = posthogPkg.default || posthogPkg

// Public, client-side exposed config (must be prefixed with GATSBY_ to reach the browser bundle).
// Use the same project token as the Prisma docs app so dataguide views land in the
// shared PostHog project. The host defaults to the proxy used by docs to avoid ad-blockers.
const POSTHOG_KEY = process.env.GATSBY_POSTHOG_KEY
const POSTHOG_HOST = process.env.GATSBY_POSTHOG_HOST || 'https://proxyhog.prisma-data.net'

let initialized = false

module.exports = {
  init() {
    // Guard against SSR and against running without a configured key (e.g. local dev).
    if (typeof window === 'undefined' || !POSTHOG_KEY || initialized) {
      return
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Pageviews are captured manually on Gatsby route changes (see gatsby-browser.tsx).
      // With manual capture this must be false, otherwise only the initial load is counted.
      capture_pageview: false,
      defaults: '2025-11-30',
    })

    // Tag every event so dataguide is distinguishable from other Prisma properties
    // (the docs app registers site_name "mono-docs") inside the shared PostHog project.
    // Registered synchronously so the first manual $pageview already carries these props.
    posthog.register({
      site_name: 'dataguide',
      environment: 'production',
    })

    initialized = true
  },

  trackPage() {
    if (!initialized) {
      return
    }
    posthog.capture('$pageview')
  },
}
