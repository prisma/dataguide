import * as React from 'react'
import { connectSearchBox } from 'react-instantsearch-dom'
import styled from 'styled-components'
import SearchPic from '../../icons/Search'
import Clear from '../../icons/Clear'
import useWindowDimensions from '../hooks/useWindowDimensions'

const SearchBoxDiv = styled.div`
  display: flex;
  height: 40px;
  background: #F7FAFC;
  border: 1px solid #CBD5E0;
  box-shadow: -4px -4px 32px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 10px 26px;
  max-width: 300px;
  width: 100%;

  @media (max-width: 1024px) {
    margin: 0 auto;
  }

  form {
    width: 100%;
    position: relative;
  }

  &.header {
    height: 16px;
    padding: 20px 12px;
    border-radius: 4px;
    box-shadow: none;
    max-width: 248px;
    border: none;
    font-size: 16px;
    background: transparent;
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
      width: auto;
      .clear {
        width: 25px;
        height: 25px;
      }
    }
    &.mobile {
      @media (max-width: 1024px) {
        position: unset;
        top: 0;
        width: auto;
        z-index: 1000000;
        left: unset;
        transform: unset;
      }
    }
  }

  &.opened {
    z-index: 100001;
    background: #fff;

    position: relative;
    // top: 100px;
    width: 100%;
    z-index: 1000000;
    // left: 50%;
    // transform: translateX(-50%);

    form {
      input {
        color: #4A5568;
      }
    }

    .clear {
      background: #E2E8F0;
      border-radius: 6px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      height: 24px;
      z-index: 1000001;
      right: 0;
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      svg path {
        stroke: #4A5568;
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
      padding: 0rem 37px;
      font-style: normal;
      font-weight: normal;
      font-size: 16px;
      line-height: 100%;
      border-width: 0;
      &::placeholder {
        content: 'Search Data Guide...';
        color: #A0AEC0;
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
    border: 1px solid #CBD5E0;
    border-radius: 4px;
    color: #CBD5E0;
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
  stroke: #4A5568;
`

const ClearIcon = styled(Clear)`
  cursor: pointer;
`

const DEBOUNCE_DELAY = 500
const ESCAPE_KEY = 27
const focusShortcuts = ['s', 191]

const SearchBox = ({
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
  const [placeholderText, setPlaceholderText] = React.useState('Search Data Guide...')

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
    inputEl.current.blur()
    inputEl.current.focus()
  }

  const clearInput = () => {
    window.clearTimeout(timeoutId.current)
    setValue('')
    refine('')
    closeSearch()
  }

  // Focus shortcuts on keydown
  const onKeyDown = (e: any) => {
    if (e && e.keyCode == ESCAPE_KEY) {
      clearInput()
    } else if (e && e.keyCode === 40) {
      downClicked()
    } else if (e && e.keyCode === 38) {
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

    inputEl.current.focus()
    e.stopPropagation()
    e.preventDefault()
  }

  const onSubmit = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    inputEl.current.blur()

    return false
  }

  React.useEffect(() => {
    if (clear) {
      clearInput()
    }
  }, [clear])
  
  React.useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    if (width > 640) {
      setPlaceholderText('Search Data Guide...')
    }
    if (value) {
      onFocus()
    }
  }, [])

  return (
    <SearchBoxDiv className={`${isOpened ? 'opened' : ''} ${header ? 'header' : ''} ${mobile ? 'mobile' : ''}`} t>
      <form onSubmit={onSubmit}>
        <SearchIcon />
        <input
          ref={inputEl}
          type="text"
          placeholder={placeholderText}
          aria-label="Search Data Guide..."
          onChange={onChange}
          onFocus={onFocus}
          value={value}
          {...rest}
        />

        {value !== '' && isOpened && (
          <span className="clear">
            <ClearIcon onClick={clearInput} />
          </span>
        )}
      </form>
    </SearchBoxDiv>
  )
}

const CustomSearchBox = connectSearchBox(SearchBox)
export default CustomSearchBox
