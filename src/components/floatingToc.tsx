import React from 'react'
import styled from 'styled-components'
import { stringify } from '../utils/stringify'

// The "On this page" navigation shown next to an article on wide screens. It stays in view
// while reading, and a gradient marker follows the sections that are on screen.

interface TocItem {
  url?: string
  title?: unknown
  items?: TocItem[]
}

interface Entry {
  id: string
  title: string
  depth: number
}

// Space taken by the sticky header, plus a little air. Matches `scroll-padding-top` in layout.css.
export const HEADER_OFFSET = 80

const flatten = (items: TocItem[] = [], depth = 0): Entry[] =>
  items.flatMap((item) => [
    ...(item.url
      ? [
          {
            id: decodeURIComponent(item.url.replace(/^#/, '')),
            title: stringify(item.title),
            depth,
          },
        ]
      : []),
    // Top-level sections and their subsections
    ...(depth < 1 ? flatten(item.items, depth + 1) : []),
  ])

// The sections that are currently on screen: a section runs from its heading to the next one
const useVisibleSections = (ids: string[]) => {
  const [visible, setVisible] = React.useState<number[]>([])

  React.useEffect(() => {
    if (ids.length === 0) return
    let frame = 0
    const update = () => {
      frame = 0
      const tops = ids.map((id) => document.getElementById(id)?.getBoundingClientRect().top)
      const bottom = window.innerHeight
      const next: number[] = []
      tops.forEach((top, index) => {
        if (top === undefined) return
        const end = tops.slice(index + 1).find((t) => t !== undefined) ?? Infinity
        if (top < bottom && end > HEADER_OFFSET) next.push(index)
      })
      setVisible((previous) =>
        previous.length === next.length && previous.every((v, i) => v === next[i]) ? previous : next
      )
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [ids.join('|')])

  return visible
}

const FloatingToc = ({ items }: { items?: TocItem[] }) => {
  const entries = React.useMemo(() => flatten(items), [items])
  const ids = React.useMemo(() => entries.map((entry) => entry.id), [entries])
  const visible = useVisibleSections(ids)
  const listRef = React.useRef<HTMLDivElement>(null)
  const linkRefs = React.useRef<(HTMLAnchorElement | null)[]>([])
  const [thumb, setThumb] = React.useState<{ top: number; height: number } | null>(null)

  // Move the marker to span the visible sections, and keep them in view in a long list
  React.useLayoutEffect(() => {
    const first = linkRefs.current[visible[0]]
    const last = linkRefs.current[visible[visible.length - 1]]
    if (!first || !last) {
      setThumb(null)
      return
    }
    const top = first.offsetTop
    const height = last.offsetTop + last.offsetHeight - top
    setThumb({ top, height })
    const list = listRef.current
    if (list && list.scrollHeight > list.clientHeight) {
      if (top < list.scrollTop) list.scrollTop = top - 12
      else if (top + height > list.scrollTop + list.clientHeight)
        list.scrollTop = Math.min(top - 12, top + height - list.clientHeight + 12)
    }
  }, [visible])

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const heading = document.getElementById(id)
    if (!heading || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    heading.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    // Update the address without adding history entries for every click
    window.history.replaceState(window.history.state, '', `#${encodeURIComponent(id)}`)
  }

  if (entries.length === 0) return null

  return (
    <Wrapper aria-labelledby="floating-toc-title">
      <Title id="floating-toc-title">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 5H3M15 12H3M17 19H3" />
        </svg>
        On this page
      </Title>
      <List ref={listRef}>
        <Thumb
          aria-hidden="true"
          style={
            {
              '--thumb-top': `${thumb?.top ?? 0}px`,
              '--thumb-height': `${thumb?.height ?? 0}px`,
              opacity: thumb ? 1 : 0,
            } as React.CSSProperties
          }
        />
        <Links>
          {entries.map((entry, index) => (
            <a
              key={entry.id}
              ref={(el) => {
                linkRefs.current[index] = el
              }}
              href={`#${entry.id}`}
              data-active={visible.includes(index)}
              aria-current={visible[0] === index ? 'location' : undefined}
              className={entry.depth > 0 ? 'nested' : undefined}
              onClick={(event) => onClick(event, entry.id)}
            >
              {entry.title}
            </a>
          ))}
        </Links>
      </List>
    </Wrapper>
  )
}

export default FloatingToc

const Wrapper = styled.nav`
  position: sticky;
  top: ${HEADER_OFFSET}px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - ${HEADER_OFFSET}px - 24px);
  padding-top: 8px;
`

const Title = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }
`

const List = styled.div`
  position: relative;
  min-height: 0;
  overflow: auto;
  scrollbar-width: none;
  padding: 12px 0;
  mask-image: linear-gradient(
    to bottom,
    transparent,
    #fff 12px,
    #fff calc(100% - 12px),
    transparent
  );
`

const Thumb = styled.div`
  position: absolute;
  left: 0;
  top: var(--thumb-top);
  height: var(--thumb-height);
  width: 2px;
  border-radius: 0 2px 2px 0;
  background-image: linear-gradient(180deg, #00bbcb, #f00e5c, #f43531);
  transition:
    top 0.15s linear,
    height 0.15s linear,
    opacity 0.2s;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const Links = styled.div`
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);

  a {
    padding: 6px 0 6px 12px;
    font-size: 14px;
    line-height: 20px;
    color: var(--text-muted);
    text-decoration: none;
    overflow-wrap: anywhere;
    /* The docs' spectrum, with pink and red deepened to keep 4.5:1 contrast for 14px text */
    background-image: linear-gradient(85deg, #9333ea, #d11a4b, #d62d2d, #d11a4b, #9333ea);
    background-clip: text;
    -webkit-background-clip: text;
    transition: color 0.35s;

    &:first-child {
      padding-top: 0;
    }
    &:last-child {
      padding-bottom: 0;
    }
    &.nested {
      padding-left: 24px;
    }
    &:hover {
      color: var(--text-strong);
    }
    &[data-active='true'] {
      color: transparent;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
`
