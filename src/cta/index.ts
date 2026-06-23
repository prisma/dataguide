// Public API for the Prisma Postgres CTA layer.
//
// resolveCta(rawSlug) is the one entry point components use. Given any slug or
// pathname (with or without numeric prefixes / the /dataguide path prefix) it
// returns the cluster, priority, copy, and ready-to-use destination URLs.

import {
  clusters,
  ClusterId,
  ClusterDef,
  Destination,
  PRODUCT_URL,
  CONSOLE_URL,
  DOCS_URL,
} from './clusters'
import { sectionDefaults, slugOverrides, PageCta, Priority } from './pageMap'

export type Placement = 'sidebar_cta' | 'inline_cta' | 'end_cta' | 'mobile_sticky' | 'body_link'

export interface ResolvedCta {
  cluster: ClusterId
  clusterDef: ClusterDef
  priority: Priority
  isIndex: boolean
  section: string
  articleSlug: string
  cleanSlug: string
  copy: ClusterDef['copy']
  docsUrl: string
  // Strong placements (high intent) keep the cluster destination; soft
  // placements always fall back to the product page.
  strength: 'strong' | 'soft'
  showInline: boolean
  showMobileSticky: boolean
}

// Normalize a slug or pathname to `section/article` form.
export function cleanSlug(raw: string): string {
  return (raw || '')
    .replace(/^https?:\/\/[^/]+/, '') // strip origin if a full URL
    .replace(/^\/dataguide/, '') // strip Gatsby path prefix (prod only)
    .replace(/\d{2,}-/g, '') // strip NN- content ordering prefixes
    .replace(/\/index$/, '')
    .replace(/^\/+|\/+$/g, '') // trim leading/trailing slashes
    .toLowerCase()
}

function isIndexSlug(raw: string, clean: string): boolean {
  return /index/.test(raw) || clean === '' || !clean.includes('/')
}

export function lookupPageCta(clean: string): PageCta {
  if (slugOverrides[clean]) return slugOverrides[clean]
  const section = clean.split('/')[0]
  return sectionDefaults[section] || { cluster: 'database_choice', priority: 'low' }
}

// `clusterOverride` lets a caller (e.g. an explicitly-placed inline callout)
// pick the cluster while keeping the page's resolved slug, priority, and tracking.
export function resolveCta(rawSlug: string, clusterOverride?: ClusterId): ResolvedCta {
  const clean = cleanSlug(rawSlug)
  const section = clean.split('/')[0] || 'home'
  const articleSlug = clean.split('/').filter(Boolean).pop() || section
  const isIndex = isIndexSlug(rawSlug, clean)
  const looked = lookupPageCta(clean)
  const cluster = clusterOverride || looked.cluster
  const priority = looked.priority
  const clusterDef = clusters[cluster]
  const strength: 'strong' | 'soft' = priority === 'high' ? 'strong' : 'soft'

  return {
    cluster,
    clusterDef,
    priority,
    isIndex,
    section,
    articleSlug,
    cleanSlug: clean,
    copy: clusterDef.copy,
    docsUrl: DOCS_URL,
    strength,
    showInline: priority !== 'low',
    showMobileSticky: priority === 'high' && !isIndex,
  }
}

interface BuildUrlOpts {
  // Force the product page regardless of cluster destination (soft CTAs).
  forceProduct?: boolean
}

function destinationUrl(dest: Destination, opts?: BuildUrlOpts): string {
  if (opts?.forceProduct) return PRODUCT_URL
  return dest === 'console' ? CONSOLE_URL : PRODUCT_URL
}

// Build a tracked CTA URL following the report's UTM scheme.
export function buildCtaUrl(
  resolved: Pick<ResolvedCta, 'clusterDef' | 'articleSlug'>,
  placement: Placement,
  opts?: BuildUrlOpts
): string {
  const base = destinationUrl(resolved.clusterDef.destination, opts)
  const params = new URLSearchParams({
    utm_source: 'dataguide',
    utm_medium: placement,
    utm_campaign: resolved.clusterDef.campaign,
    utm_content: `${resolved.articleSlug}:${placement}`,
  })
  return `${base}?${params.toString()}`
}

// Global header CTA — page-agnostic, always points at the product page.
export function headerCtaUrl(): string {
  const params = new URLSearchParams({
    utm_source: 'dataguide',
    utm_medium: 'header_cta',
    utm_campaign: 'postgres_global',
    utm_content: 'header',
  })
  return `${PRODUCT_URL}?${params.toString()}`
}

export { PRODUCT_URL, CONSOLE_URL, DOCS_URL }
export type { ClusterId, ClusterDef, Destination, Priority }
