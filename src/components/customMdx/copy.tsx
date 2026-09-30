import React from 'react'
import styled from 'styled-components'
import Copy from '../../icons/Copy'

// Copies a code block to the clipboard
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<number>(undefined)

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Without clipboard access (e.g. an insecure context), fall back to a selection
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <CopyComponent type="button" onClick={copy} aria-label="Copy code" title="Copy code">
      <Copy aria-hidden="true" />
      <span className="indicator" role="status" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </CopyComponent>
  )
}

export default CopyButton

const CopyComponent = styled.button`
  position: relative;
  display: inline-flex;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-sans);

  svg {
    display: block;
  }

  &:hover svg rect {
    stroke: var(--border-strong);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .indicator {
    position: absolute;
    top: 50%;
    right: calc(100% + 8px);
    transform: translateY(-50%);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    white-space: nowrap;
    pointer-events: none;
  }
`
