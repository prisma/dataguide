import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { resolveCta, buildCtaUrl, CONSOLE_URL } from '../../cta'

// Dismissible sticky bottom CTA, mobile + high-intent pages only.
// Appears after the reader scrolls ~40% of the viewport; dismissal is
// remembered for the session.

const DISMISS_KEY = 'pp-mobile-sticky-dismissed'

const Bar = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 130;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #ffffff;
  border-top: 1px solid #cbd5e0;
  box-shadow: 0px -2px 8px rgba(47, 55, 71, 0.08);

  @media (min-width: 768px) {
    display: none;
  }
`

const Text = styled.span`
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
`

const CreateButton = styled.a`
  background: #16a394;
  color: #ffffff;
  border-radius: 4px;
  padding: 8px 14px;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  white-space: nowrap;

  &:hover,
  &:link,
  &:visited,
  &:active {
    color: #ffffff;
  }
`

const Dismiss = styled.button`
  background: none;
  border: none;
  color: #718096;
  font-size: 20px;
  line-height: 1;
  padding: 0 4px;
  cursor: pointer;
`

interface MobileStickyCtaProps {
  slug?: string
}

const MobileStickyCta = ({ slug = '' }: MobileStickyCtaProps) => {
  const cta = resolveCta(slug)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    if (!cta.showMobileSticky) return
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(DISMISS_KEY) === '1') return

    setDismissed(false)
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.4) setVisible(true)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [cta.showMobileSticky])

  if (!cta.showMobileSticky || dismissed || !visible) return null

  const href = buildCtaUrl(cta, 'mobile_sticky')
  const isConsole = href.startsWith(CONSOLE_URL)

  const onDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') window.sessionStorage.setItem(DISMISS_KEY, '1')
  }

  return (
    <Bar
      data-cta-cluster={cta.cluster}
      data-cta-placement="mobile_sticky"
      data-cta-slug={cta.articleSlug}
    >
      <Text>{isConsole ? 'Create a Prisma Postgres database' : 'Explore Prisma Postgres'}</Text>
      <CreateButton href={href} target="_blank" rel="noopener noreferrer">
        {isConsole ? 'Create' : 'Explore'}
      </CreateButton>
      <Dismiss type="button" aria-label="Dismiss" onClick={onDismiss}>
        ×
      </Dismiss>
    </Bar>
  )
}

export default MobileStickyCta
