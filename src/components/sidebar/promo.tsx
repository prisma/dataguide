import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const PromoLink = styled.a`
  margin: 1.5rem 15px 15px 15px;
  border-width: 1px;
  border-style: solid;
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 0.8rem;
  text-decoration: none;
  display: block;

  /* Default color */
  &,
  &:link,
  &:visited,
  &:active {
    border-color: #16a394;
    color: #16a394;
  }

  &:hover {
    border-color: #187367;
    color: #187367;
  }

  /* teal color */
  &.sidebar-promo-teal,
  &.sidebar-promo-teal:link,
  &.sidebar-promo-teal:visited,
  &.sidebar-promo-teal:active {
    border-color: #16a394;
    color: #16a394;
  }

  &.sidebar-promo-teal:hover {
    border-color: #187367;
    color: #187367;
  }

  /* indigo color */
  &.sidebar-promo-indigo,
  &.sidebar-promo-indigo:link,
  &.sidebar-promo-indigo:visited,
  &.sidebar-promo-indigo:active {
    border-color: #5a67d8;
    color: #5a67d8;
  }

  &.sidebar-promo-indigo:hover {
    border-color: #4c51bf;
    color: #4c51bf;
  }
`
type PromoOption = {
  text: string
  link: string
  color: 'teal' | 'indigo'
}

const promoOptions: PromoOption[] = [
  {
    text: `Want real-time updates from your database without manual polling?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/real-time-updates-without-polling',
    color: 'teal',
  },
  {
    text: `Need to sync data instantly to your applications?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/sync-data-to-apps',
    color: 'indigo',
  },
  {
    text: `Want to react to database changes in your app, as they happen?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/react-to-database-changes',
    color: 'teal',
  },
  {
    text: `Working on real-time interactions in your distributed systems?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/real-time-interactions-distributed-systems',
    color: 'indigo',
  },
  {
    text: `Working on critical workflows triggered by changes in your db?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/critical-workflows-triggered-by-db',
    color: 'indigo',
  },
  {
    text: `Need your database queries to be 1000x faster?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/queries-1000x-faster',
    color: 'teal',
  },
  {
    text: `Working on highly scaleable serverless or edge applications?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/scaleable-serverless-edge-apps',
    color: 'indigo',
  },
  {
    text: `Want to to enhance response times while reducing database load?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/enhance-response-times-reduce-load',
    color: 'teal',
  },
  {
    text: `Interested in query caching in just a few lines of code?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/caching-few-lines-of-code',
    color: 'teal',
  },
  {
    text: `Does your serverless architecture handle global scaling effectively?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/serverless-architecture-global-scaling',
    color: 'indigo',
  },
  {
    text: `Easily identify and fix slow SQL queries in your app.`,
    link: 'https://pris.ly/dataguide-sidebar-promo/identify-fix-sql-queries',
    color: 'teal',
  },
  {
    text: `Looking to uncover inefficient database operations?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/inefficient-db-operations',
    color: 'indigo',
  },
  {
    text: `Curious about the SQL queries Prisma ORM generates?`,
    link: 'https://pris.ly/dataguide-sidebar-promo/sql-queries-in-orm',
    color: 'teal',
  },
]

export const Promo = () => {
  const [promo, setPromo] = useState(promoOptions[0])
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) {
      const newState = promoOptions[Math.floor(Math.random() * promoOptions.length)]
      setPromo(newState)
      hasMounted.current = true
    }
  }, [])

  return (
    <PromoLink
      className={`sidebar-promo sidebar-promo-${promo.color}`}
      href={promo.link}
      target="_blank"
    >
      {promo.text}
    </PromoLink>
  )
}
