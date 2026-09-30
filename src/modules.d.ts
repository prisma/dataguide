// Non-code imports that webpack handles: stylesheets, and images (as URLs)
declare module '*.css'
declare module '*.png' {
  const url: string
  export default url
}

declare module '*.webp' {
  const url: string
  export default url
}
declare module '*.jpg' {
  const url: string
  export default url
}
declare module '*.jpeg' {
  const url: string
  export default url
}
declare module '*.gif' {
  const url: string
  export default url
}
declare module '*.svg' {
  const url: string
  export default url
}
declare module 'path-browserify'
