import React from 'react'
import { Link as GatsbyLink } from 'gatsby'
import isAbsoluteUrl from 'is-absolute-url'

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string | null
  activeClassName?: string
  partiallyActive?: boolean
  getProps?: any
}

const Link = ({ to, activeClassName, partiallyActive, getProps, ...props }: LinkProps) =>
  !to || isAbsoluteUrl(to) ? (
    <a href={to ?? undefined} {...props}>
      {props.children}
    </a>
  ) : (
    <GatsbyLink
      to={to}
      activeClassName={activeClassName}
      partiallyActive={partiallyActive}
      getProps={getProps}
      {...props}
    />
  )

export default Link
