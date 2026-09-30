import * as React from 'react'
import { useSearchBox } from 'react-instantsearch'
import styled from 'styled-components'
import SearchPic from '../../icons/Search'
import Clear from '../../icons/Clear'
import useWindowDimensions from '../hooks/useWindowDimensions'

const SearchBoxDiv = styled.div`
  display: flex;
  align-items: center;
  height: 44px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-card);
  border-radius: 999px;
  padding: 0 16px;
  max-width: 300px;
  width: 100%;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover {
    border-color: var(--border-strong);
  }

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  @media (max-width: 1024px) {
    margin: 0 auto;
  }

  form {
    width: 100%;
    position: relative;
  }

  &.header {
    height: 36px;
    padding: 0 12px;
    box-shadow: none;
    max-width: 248px;
    width: 248px;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.6);
    svg {
      width: 16px;
      height: 16px;
    }
    .clear {
      svg {
        width: 10px;
        height: 10px;
      }
    }
    &.opened {
      position: relative;
      top: unset;
      left: unset;
      transform: unset;
      .clear {
        width: 22px;
        height: 22px;
      }
    }
    &.mobile {
      @media (max-width: 1024px) {
        position: unset;
        top: 0;
        width: 180px;
        z-index: 1000000;
        left: unset;
        transform: unset;
      }
      @media (max-width: 420px) {
        width: 120px;
      }
    }
  }

  &.opened {
    background: var(--surface);
    position: relative;
    z-index: 1000000;

    form {
      input {
        color: var(--text-strong);
      }
    }

    .clear {
      background: var(--surface-muted);
      border-radius: 999px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      height: 22px;
      z-index: 1000001;
      right: 0;
      width: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      svg path {
        stroke: var(--text);
      }
    }
  }
  @media (max-width: 620px) {
    width: auto;
    flex: 1;
    form {
      width: 100%;
    }
  }

  /* On small screens the header search collapses to an icon and expands when focused */
  @media (max-width: 560px) {
    &.header.mobile:not(.opened) {
      width: 36px;
      flex: 0 0 36px;
      padding: 0 9px;
      input {
        padding: 0;
        width: 18px;
        cursor: pointer;
        &::placeholder {
          color: transparent;
        }
      }
    }
    &.header.mobile.opened {
      position: absolute !important;
      top: 14px !important;
      left: 16px !important;
      right: 16px;
      width: auto !important;
      max-width: none;
    }
  }

  .clear {
    display: none;
  }

  form {
    display: flex;
    align-items: center;

    button.ais-SearchBox-submit {
      display: none;
    }
    button.ais-SearchBox-reset {
      background: transparent;
      border: transparent;
      outline: none;
    }

    input {
      width: 100%;
      background: transparent;
      outline: none;
      padding: 0 28px;
      font-family: var(--font-sans);
      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 100%;
      color: var(--text);
      border-width: 0;
      &::placeholder {
        color: var(--text-muted);
        opacity: 1; /* Firefox */
      }
    }

    input[type='search']::-webkit-search-decoration,
    input[type='search']::-webkit-search-cancel-button,
    input[type='search']::-webkit-search-results-button,
    input[type='search']::-webkit-search-results-decoration {
      -webkit-appearance: none;
    }
  }

  .slash {
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-subtle);
    min-width: 18px;
    display: flex;
    justify-content: center;
  }

  @media (min-width: 0px) and (max-width: 768px) {
    .slash {
      display: none;
    }
  }
`

const SearchIcon = styled(SearchPic)`
  min-width: 1em;
  pointer-events: none;
  z-index: 100001;
  top: 50%;
  transform: translateY(-50%);
  position: absolute;
  stroke: var(--text-muted);
`

const ClearIcon = styled(Clear)`
  cursor: pointer;
`

const DEBOUNCE_DELAY = 500
const ESCAPE_KEY = 27
const focusShortcuts = ['s', 191]

export const SearchBox = ({
  refine,
  onFocus = () => {},
  currentRefinement,
  isOpened,
  closeSearch,
  upClicked,
  downClicked,
  selectedInd,
  header,
  mobile,
  clear,
  ...rest
}: any) => {
  const [value, setValue] = React.useState(currentRefinement)

  const timeoutId = React.useRef<any>(null)
  const inputEl = React.useRef<any>(null)
  const { width } = useWindowDimensions()
  const [placeholderText, setPlaceholderText] = React.useState('Search the Data Guide')

  const onChange = (e: any) => {
    const { value: newValue } = e.target

    // After the user manually cleared the input, call `refine` without waiting so that the search
    // closes instantly.
    if (newValue === '') {
      return clearInput()
    }

    // Otherwise, debounce the search to avoid triggering many queries at once, which could also
    // make the UI freeze.
    window.clearTimeout(timeoutId.current)
    timeoutId.current = window.setTimeout(() => refine(newValue), DEBOUNCE_DELAY)
    setValue(newValue)
  }

  const clearInput = () => {
    window.clearTimeout(timeoutId.current)
    setValue('')
    refine('')
    closeSearch()
  }

  // Focus shortcuts on keydown
  const onKeyDown = (e: any) => {
    if (document.activeElement === inputEl.current && e.keyCode == ESCAPE_KEY) {
      clearInput()
    } else if (document.activeElement === inputEl.current && e.keyCode === 40) {
      e.preventDefault()
      downClicked()
    } else if (document.activeElement === inputEl.current && e.keyCode === 38) {
      e.preventDefault()
      upClicked()
    }

    const shortcuts = focusShortcuts.map((key) =>
      typeof key === 'string' ? key.toUpperCase().charCodeAt(0) : key
    )

    const elt = e.target || e.srcElement
    const tagName = elt.tagName
    if (
      elt.isContentEditable ||
      tagName === 'INPUT' ||
      tagName === 'SELECT' ||
      tagName === 'TEXTAREA'
    ) {
      // already in an input
      return
    }

    const which = e.which || e.keyCode
    if (shortcuts.indexOf(which) === -1) {
      // not the right shortcut
      return
    }

    if (!inputEl.current?.getClientRects().length) return
    inputEl.current.focus()
    e.stopPropagation()
    e.preventDefault()
  }

  const onSubmit = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    rest.selectHit?.()

    return false
  }

  React.useEffect(() => {
    if (clear) {
      clearInput()
    }
  }, [clear])

  React.useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  React.useEffect(() => {
    if (width > 640) {
      setPlaceholderText('Search the Data Guide')
    }
    if (value) {
      onFocus()
    }
    return () => {
      window.clearTimeout(timeoutId.current)
    }
  }, [])

  return (
    <SearchBoxDiv
      className={`${isOpened ? 'opened' : ''} ${header ? 'header' : ''} ${mobile ? 'mobile' : ''}`}
    >
      <form onSubmit={onSubmit}>
        <SearchIcon />
        <input
          ref={inputEl}
          type="text"
          placeholder={placeholderText}
          aria-label="Search the Data Guide"
          onChange={onChange}
          onFocus={onFocus}
          value={value}
        />

        {value !== '' && isOpened && (
          <button type="button" className="clear" aria-label="Clear search" onClick={clearInput}>
            <ClearIcon aria-hidden="true" />
          </button>
        )}
      </form>
    </SearchBoxDiv>
  )
}

const CustomSearchBox = (props: any) => {
  const { query, refine } = useSearchBox()
  return <SearchBox {...props} currentRefinement={query} refine={refine} />
}

export default CustomSearchBox
