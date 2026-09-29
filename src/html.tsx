import React from 'react'

interface HTMLProps {
  htmlAttributes: React.HtmlHTMLAttributes<HTMLHtmlElement>
  headComponents: React.ReactNode
  bodyAttributes: React.HTMLAttributes<HTMLBodyElement>
  preBodyComponents: React.ReactNode
  body: string
  postBodyComponents: React.ReactNode
}

const HTML = (props: HTMLProps) => {
  return (
    <html {...props.htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        {props.headComponents}
      </head>
      <body {...props.bodyAttributes}>
        {props.preBodyComponents}
        <div key={`body`} id="___gatsby" dangerouslySetInnerHTML={{ __html: props.body }} />
        {props.postBodyComponents}
      </body>
    </html>
  )
}

export default HTML
