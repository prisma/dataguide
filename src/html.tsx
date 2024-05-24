import React from 'react'
import PropTypes from 'prop-types'

const HTML = (props: any) => {
  return (
    <html {...props.htmlAttributes}>
      <head>
        <meta charSet="utf-8" />

        <script>
        async
        id="cookies"
        src="https://app.enzuzo.com/apps/enzuzo/static/js/__enzuzo-cookiebar.js?uuid=5606ab18-eb9a-11ee-98cc-b303d4429aa8"
        type="text/javascript"
        </script>
        
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

HTML.propTypes = {
  htmlAttributes: PropTypes.object,
  headComponents: PropTypes.array,
  bodyAttributes: PropTypes.object,
  preBodyComponents: PropTypes.array,
  body: PropTypes.string,
  postBodyComponents: PropTypes.array,
}

export default HTML
