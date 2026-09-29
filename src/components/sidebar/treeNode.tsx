import React from 'react'
import styled from 'styled-components'
import ArrowRight from '../../icons/ArrowRight'
import ArrowDown from '../../icons/ArrowDown'
import Link from '../link'
import { urlGenerator } from '../../utils/urlGenerator'
import { useLocation } from '../../hooks/useLocation'
import { withPrefix } from 'gatsby'

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 4px 0;
  &.has-border {
    border-left: 1px solid var(--border);
    margin: 2px 0 6px 12px;
    padding-left: 4px;
  }
`

const ListItem = styled.li`
  font-size: 14px;
  line-height: 20px;
  margin: 1px 0;
  position: relative;
  a {
    display: block;
    padding: 6px 10px;
    border-radius: 8px;
    transition:
      color 150ms ease,
      background 150ms ease;
    color: var(--text-muted) !important;
    text-decoration: none;
    &:hover {
      color: var(--text-strong) !important;
      background: rgba(21, 21, 21, 0.04);
    }
    .tag {
      position: absolute;
      right: 8px;
      color: var(--text-muted);
      font-size: 12px;
      font-style: normal;
      font-weight: 500;
      background: var(--surface-muted);
      border-radius: 999px;
      padding: 1px 8px;
      &.small {
        font-size: 11px;
      }
    }
    .item-collapser {
      background: transparent;
      position: absolute;
      left: -12px;
      top: 12px;
      padding: 0;
      border: 0;
      cursor: pointer;
      .right,
      .down {
        transition: opacity 0.5s linear;
      }
      .right.open,
      .down.close {
        display: none;
        opacity: 0;
      }
      .right.close,
      .down.open {
        display: block;
        opacity: 1;
      }
      .down.open {
        margin-top: 2px;
      }
      &:hover,
      &:focus,
      &:active {
        outline: none;
      }
    }
  }
  .active-item {
    color: var(--accent-strong) !important;
    background: var(--accent-soft);
    font-weight: 500;
    &:hover {
      color: var(--accent-strong) !important;
      background: var(--accent-soft);
    }
  }
  &.top-level {
    margin-top: 22px;
    > a {
      font-family: var(--font-display);
      font-size: 15px;
      color: var(--text-strong) !important;
      font-weight: 500;
      line-height: 20px;
      letter-spacing: -0.01em;
      &:hover {
        color: var(--accent) !important;
        background: transparent;
      }
      &.active-item {
        color: var(--accent-strong) !important;
        background: var(--accent-soft);
      }
    }
  }
  &.bottom-level {
    margin-left: 20px;
  }
  &.static-link {
    margin-top: 24px;
  }
  &.static-link > a {
    color: var(--text-subtle) !important;
    text-transform: uppercase;
    font-weight: 600;
    font-size: 12px;
    line-height: 14px;
    letter-spacing: 0.04em;
    &:hover {
      color: var(--text-subtle) !important;
      background: transparent;
    }
  }
  &.last-level {
    padding-left: 0;
  }
  .collapse-title {
    cursor: pointer;
    svg {
      transition: transform 0.2s ease;
    }
  }
`

const TreeNode = ({
  className = '',
  setCollapsed,
  collapsed,
  url,
  slug,
  title,
  items,
  label,
  topLevel,
  staticLink,
  duration,
  experimental,
  lastLevel,
  hidePage,
}: any) => {
  const isCollapsed = collapsed[label]
  const collapse = () => {
    Object.keys(collapsed).map((lbl) => {
      if (lbl !== label) {
        collapsed[lbl] = collapsed[lbl] == false ? (collapsed[lbl] = true) : collapsed[lbl]
      }
    })
    setCollapsed(label, false)
  }
  const location = useLocation()

  const justExpand = (e: any) => {
    setCollapsed(label, true)
    e.preventDefault()
    e.stopPropagation()
  }

  const hasChildren = items.length !== 0

  const calculatedClassName = `${className || ''} ${topLevel ? 'top-level' : ''} ${
    staticLink ? 'static-link' : ''
  } ${lastLevel ? 'last-level' : ''}`

  items.sort((a: any, b: any) => {
    if (a.label < b.label) {
      return -1
    }
    if (a.label > b.label) {
      return 1
    }
    return 0
  })

  const hasExpandButton = title && hasChildren && !staticLink && !topLevel
  let hasBorder: boolean = false
  if (hasExpandButton) {
    items.map((item: any) => (item.lastLevel = true))
    hasBorder = true
  }

  // Fix for issue https://github.com/prisma/prisma2-docs/issues/161
  const [isOpen, setIsOpen] = React.useState('close')
  React.useEffect(() => {
    setIsOpen(isCollapsed ? 'close' : 'open')
  }, [isCollapsed])

  const isCurrent = location && slug && location.pathname.includes(urlGenerator(slug))

  return url === '/' ? null : (
    <ListItem className={calculatedClassName}>
      {title && label !== 'index' && !hidePage && (
        <Link
          to={staticLink ? null : url}
          activeClassName="active-item"
          className={isCurrent ? 'active-item' : 'hh'}
          id={withPrefix(url)}
        >
          {hasExpandButton ? (
            <span className="collapse-title" onClick={collapse}>
              <button aria-label="collapse" className="item-collapser" onClick={justExpand}>
                {/* Fix for issue https://github.com/prisma/prisma2-docs/issues/161 */}
                <ArrowRight className={`right ${isOpen}`} />
                <ArrowDown className={`down ${isOpen}`} />
              </button>
              {title}
            </span>
          ) : (
            <span>{title}</span>
          )}
          {duration && <span className="tag">{duration}</span>}
          {experimental && <span className="tag small">Experimental</span>}
        </Link>
      )}

      {!isCollapsed && hasChildren ? (
        <List className={`${hasBorder ? 'has-border' : ''}`}>
          {items.map((item: any, index: number) => (
            <TreeNode
              key={item.url + index.toString()}
              setCollapsed={setCollapsed}
              collapsed={collapsed}
              {...item}
            />
          ))}
        </List>
      ) : null}
    </ListItem>
  )
}
export default TreeNode
