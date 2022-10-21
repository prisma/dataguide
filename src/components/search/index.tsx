import * as React from 'react'
import { useState, useRef } from 'react'
import { InstantSearch, Index, connectStateResults, connectHits } from 'react-instantsearch-dom'
import algoliasearch from 'algoliasearch/lite'
import config from '../../../config'
import DocHit from './hitComps'
import styled from 'styled-components'
import Overlay from './overlay'
import CustomSearchBox from './input'
import * as qs from 'qs'
import { navigate } from 'gatsby'

const HitsWrapper = styled.div`
  display: none;
  text-align: left;
  &.show {
    display: grid;
  }
  width: calc(100% - 32px);
  max-height: 80vh;
  overflow-y: scroll;
  color: black;
  overflow-x: hidden;
  z-index: 100002;
  -webkit-overflow-scrolling: touch;
  position: absolute;
  left: 50%;
  top: 97px;

  transform: translateX(-50%);
  max-width: 1200px;
  background: #fff;
  box-shadow: 0px 4px 8px rgba(47, 55, 71, 0.05), 0px 1px 3px rgba(47, 55, 71, 0.1);
  border-radius: 5px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  * {
    margin-top: 0;
    padding: 0;
  }
  ul {
    list-style: none;
    margin: 0;
  }
  .no-results {
    padding: 2rem;
  }
  .loader,
  .loader:after {
    border-radius: 50%;
    width: 5em;
    height: 5em;
  }
  .loader {
    margin: 60px auto;
    font-size: 10px;
    position: relative;
    text-indent: -9999em;
    border-top: 0.5em solid rgba(215, 215, 215, 0.2);
    border-right: 0.5em solid rgba(215, 215, 215, 0.2);
    border-bottom: 0.5em solid rgba(215, 215, 215, 0.2);
    border-left: 0.5em solid #d7d7d7;
    -webkit-transform: translateZ(0);
    -ms-transform: translateZ(0);
    transform: translateZ(0);
    -webkit-animation: load8 1.1s infinite linear;
    animation: load8 1.1s infinite linear;
  }
  @-webkit-keyframes load8 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes load8 {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
    // left: 0;
    top: 160px;
    // max-width: 100%;
    border-top: 1px solid #E2E8F0;
    border-top-right-radius: 0;
    border-top-left-radius: 0;
  &.header {
    top: 125px;
  }
`

const indexName = config.header.search.indexName
const DEBOUNCE_TIME = 400
const searchClient = algoliasearch(
  config.header.search.algoliaAppId,
  config.header.search.algoliaSearchKey
)

const getHits = (children: any, res: any) => {
  const allHits = res.hits
  const newHits = allHits
    .filter((h: any) => h._distinctSeqID == 0)
    .map((x: any) => ({
      ...x,
      moreCount: 0,
    }))
  allHits.map((h: any) => {
    const first = newHits.find((firstG: any) => firstG.slug == h.slug)
    if (first) {
      first.moreCount++
    }
  })
  res.hits = newHits
  return children
}
const Results = connectStateResults(
  ({ isSearchStalled, searchState: state, searchResults: res, children }: any) =>
    (isSearchStalled || res?.query === '' ? <div className="loader">Searching...</div> : null) ||
    (res && res.nbHits > 0 ? (
      getHits(children, res)
    ) : (
      <div className="no-results">
        No results for '<i>{state.query}</i>'
      </div>
    ))
)

const createURL = (state: any) => `?${qs.stringify(state)}`

const searchStateToUrl = (location: any, searchState: any) =>
  searchState ? `${location.pathname.replace('/dataguide', '')}${createURL(searchState)}` : ``

const urlToSearchState = (location: any) => qs.parse(location.search.slice(1))

export default function Search({ hitsStatus, location, header, mobile = false }: any) {
  const [searchState, setSearchState] = useState(urlToSearchState(location))
  const [query, setQuery] = useState(``)
  const [showHits, setShowHits] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const debouncedSetStateRef = useRef<any>(null)
  const [cleared, clearInput] = useState<boolean>(false);


  const hideSearch = () => {
    setShowHits(false)
    setQuery(``)
    if (searchState.query === '' && debouncedSetStateRef.current) {
      clearTimeout(debouncedSetStateRef.current)
      debouncedSetStateRef.current = setTimeout(() => {
        navigate(location.href.split('?')[0])
      }, DEBOUNCE_TIME)
    }
    clearInput(true)
  }

  const showSearch = () => setShowHits(true)


  const onSearchStateChange = (updatedSearchState: any) => {
    setQuery(updatedSearchState.query)
    clearTimeout(debouncedSetStateRef.current)
    clearInput(false);

    debouncedSetStateRef.current = setTimeout(() => {
      navigate(searchStateToUrl(location, updatedSearchState))
    }, DEBOUNCE_TIME)

    setSearchState(updatedSearchState)
  }

  React.useEffect(() => {
    hitsStatus(showHits)
  }, [showHits, query])

  React.useEffect(() => {
    setSearchState(urlToSearchState(location))
    setQuery(searchState.query)
  }, [location])

  const incrementIndex = () => {
    setSelectedIndex((prevCount: number) => {
      const nbHits = document.querySelectorAll('.ais-Hits-list .ais-Hits-item')?.length
      if (prevCount < nbHits - 1) {
        return prevCount + 1
      } else {
        return 0
      }
    })
  }
  const decrementIndex = () => {
    const nbHits = document.querySelectorAll('.ais-Hits-list .ais-Hits-item')?.length
    setSelectedIndex((prevCount: number) => {
      if (prevCount > 0) {
        return prevCount - 1
      } else {
        return nbHits - 1
      }
    })
  }
  React.useEffect(() => {
    const index = searchClient.initIndex('indexName');
    console.log(indexName, searchClient)
  }, [])
  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={indexName}
      onSearchStateChange={onSearchStateChange}
      searchState={searchState}
      createURL={createURL}
    >
      <Overlay visible={showHits} hideSearch={hideSearch} />
      <CustomSearchBox
        onFocus={showSearch}
        isOpened={showHits}
        header={header}
        mobile={mobile}
        clear={cleared}
        closeSearch={hideSearch}
        upClicked={decrementIndex}
        downClicked={incrementIndex}
      />
      {query && query !== '' && showHits && (
        <HitsWrapper className={`${showHits ? 'show' : ''} ${header ? 'header' : ''}`} onClick={hideSearch}>
          <Index key={indexName} indexName={indexName}>
            <Results>
              <Hits hitComponent={DocHit} selectedIndex={selectedIndex} />
            </Results>
          </Index>
        </HitsWrapper>
      )}
    </InstantSearch>
  )
}

const Hits = connectHits(
  ({ hits, hitComponent, onMouseHoverHit, selectedIndex, onMouseLeaverHits }: any) => (
    <ul className="ais-Hits-list" onMouseLeave={onMouseLeaverHits}>
      {hits.map((hit: any, index: number) => (
        <li key={hit.objectID} className="ais-Hits-item">
          {React.createElement(hitComponent, {
            hit,
            selected: index === selectedIndex,
            onMouseHover: () => onMouseHoverHit(index),
          })}
        </li>
      ))}
    </ul>
  )
)
