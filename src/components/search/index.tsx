import * as React from 'react'
import { useState, useRef } from 'react'
import {
  Configure,
  InstantSearch,
  InstantSearchSSRProvider,
  useHits,
  useInstantSearch,
} from 'react-instantsearch'
import { liteClient as algoliasearch } from 'algoliasearch/lite'
import config from '../../../config'
import DocHit from './hitComps'
import styled from 'styled-components'
import Overlay from './overlay'
import CustomSearchBox, { SearchBox } from './input'
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
  color: var(--text);
  overflow-x: hidden;
  z-index: 100002;
  -webkit-overflow-scrolling: touch;
  position: absolute;
  left: 50%;
  top: 97px;

  transform: translateX(-50%);
  max-width: 1200px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-pop);
  border-radius: 16px;
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
    border-left: 0.5em solid var(--accent);
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
  border-top: 1px solid var(--border);
  border-top-right-radius: 0;
  border-top-left-radius: 0;
  &.header {
    top: 125px;
  }
`

const indexName = config.header.search.indexName as string
const DEBOUNCE_TIME = 400

const emptyResults = (requests: any[]) =>
  Promise.resolve({
    results: requests.map(() => ({
      hits: [],
      nbHits: 0,
      nbPages: 0,
      page: 0,
      processingTimeMS: 0,
      hitsPerPage: 0,
      exhaustiveNbHits: false,
      query: '',
      params: '',
    })),
  })

// algoliasearch v5 throws when the credentials are missing (e.g. in local
// development without a .env file), so only create the client when configured.
const { algoliaAppId, algoliaSearchKey } = config.header.search
const algoliaClient =
  algoliaAppId && algoliaSearchKey && indexName
    ? algoliasearch(algoliaAppId, algoliaSearchKey)
    : null

const searchClient: any = {
  ...algoliaClient,
  search(requests: any[]) {
    if (!algoliaClient || requests.every(({ params }: any) => !params.query)) {
      return emptyResults(requests)
    }

    return algoliaClient.search(requests)
  },
}

const Results = ({ children }: { children: React.ReactNode }) => {
  const { results, status, indexUiState } = useInstantSearch()

  if (!algoliaClient)
    return (
      <div className="no-results" role="status">
        Search is unavailable. Browse the Data Guide sections using the menu.
      </div>
    )
  if (status === 'error')
    return (
      <div className="no-results" role="alert">
        Search could not load. Try again or browse the Data Guide sections.
      </div>
    )

  if (status === 'stalled' || results?.query === '') {
    return <div className="loader">Searching...</div>
  }

  if (results && results.nbHits > 0) {
    return <>{children}</>
  }

  return (
    <div className="no-results" role="status">
      No results for '<i>{indexUiState.query}</i>'
    </div>
  )
}

const createURL = (state: any) => `?${qs.stringify(state)}`

const searchStateToUrl = (location: any, searchState: any) =>
  searchState ? `${location.pathname.replace('/dataguide', '')}${createURL(searchState)}` : ``

const urlToSearchState = (location: any) => qs.parse(location.search.slice(1))

const urlQuery = (location: any) => {
  const { query } = urlToSearchState(location)
  return typeof query === 'string' ? query : ''
}

// Keep the search query in sync when the URL changes (e.g. browser navigation)
const SyncQueryWithUrl = ({ location }: any) => {
  const { indexUiState, setIndexUiState, refresh } = useInstantSearch()

  // The instance starts with empty initial results (see below), so search for a
  // query that is already in the URL on page load
  React.useEffect(() => {
    if (indexUiState.query) refresh()
  }, [])

  React.useEffect(() => {
    const query = urlQuery(location)
    if ((indexUiState.query || '') !== query) {
      setIndexUiState((state) => ({ ...state, query }))
    }
  }, [location])

  return null
}

const UnavailableSearch = ({ hitsStatus, header, mobile }: any) => {
  const [open, setOpen] = useState(false)
  React.useEffect(() => {
    hitsStatus(open)
  }, [open])
  return (
    <>
      <SearchBox
        header={header}
        mobile={mobile}
        currentRefinement=""
        refine={() => {}}
        onFocus={() => setOpen(true)}
        isOpened={open}
        closeSearch={() => setOpen(false)}
        upClicked={() => {}}
        downClicked={() => {}}
        clear={false}
      />
      <Overlay visible={open} hideSearch={() => setOpen(false)} clearInput={() => {}} />
      {open && (
        <HitsWrapper className={`show ${header ? 'header' : ''}`}>
          <div className="no-results" role="status">
            Search is unavailable. Browse the Data Guide sections using the menu.
          </div>
        </HitsWrapper>
      )}
    </>
  )
}

export default function Search(props: any) {
  return algoliaClient ? <ConfiguredSearch {...props} /> : <UnavailableSearch {...props} />
}

function ConfiguredSearch({ hitsStatus, location, header, mobile = false }: any) {
  const [query, setQuery] = useState(urlQuery(location))
  const [showHits, setShowHits] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const debouncedSetStateRef = useRef<any>(null)
  const currentQueryRef = useRef(urlQuery(location))
  const [cleared, clearInput] = useState<boolean>(false)

  const hideSearch = () => {
    setShowHits(false)
    setQuery(``)
    if (currentQueryRef.current === '' && debouncedSetStateRef.current) {
      clearTimeout(debouncedSetStateRef.current)
      debouncedSetStateRef.current = setTimeout(() => {
        navigate(location.href.split('?')[0])
      }, DEBOUNCE_TIME)
    }
  }

  const showSearch = () => setShowHits(true)

  const onStateChange = ({ uiState, setUiState }: any) => {
    const indexState = uiState[indexName] || {}
    const newQuery = indexState.query || ''
    currentQueryRef.current = newQuery
    setQuery(newQuery)

    if (newQuery !== urlQuery(location)) {
      clearTimeout(debouncedSetStateRef.current)
      debouncedSetStateRef.current = setTimeout(() => {
        navigate(searchStateToUrl(location, { query: newQuery }))
      }, DEBOUNCE_TIME)
    }

    setUiState(uiState)
  }

  React.useEffect(() => {
    hitsStatus(showHits)
  }, [showHits, query])

  React.useEffect(() => {
    setSelectedIndex(-1)
  }, [query])
  React.useEffect(() => () => clearTimeout(debouncedSetStateRef.current), [])

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

  const selectHit = () => {
    const links = document.querySelectorAll<HTMLAnchorElement>('.ais-Hits-list .ais-Hits-item a')
    if (selectedIndex >= 0) links[selectedIndex]?.click()
  }

  return (
    // <InstantSearch> renders nothing until it has started, which would leave the
    // search box out of the static HTML. Starting it with empty initial results
    // renders it right away, on the server and on the client.
    <InstantSearchSSRProvider initialResults={{}}>
      <InstantSearch
        searchClient={searchClient}
        indexName={indexName}
        initialUiState={{ [indexName]: { query: urlQuery(location) } }}
        onStateChange={onStateChange}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        {/* The highlight tags the hits widget uses, so that mounting it doesn't send another request */}
        <Configure highlightPreTag="__ais-highlight__" highlightPostTag="__/ais-highlight__" />
        <SyncQueryWithUrl location={location} />
        <Overlay visible={showHits} hideSearch={hideSearch} clearInput={clearInput} />
        <CustomSearchBox
          onFocus={showSearch}
          isOpened={showHits}
          header={header}
          mobile={mobile}
          clear={cleared}
          closeSearch={hideSearch}
          upClicked={decrementIndex}
          downClicked={incrementIndex}
          selectHit={selectHit}
        />
        {query && query !== '' && showHits && (
          <HitsWrapper
            className={`${showHits ? 'show' : ''} ${header ? 'header' : ''}`}
            onClick={hideSearch}
          >
            <Results>
              <Hits hitComponent={DocHit} selectedIndex={selectedIndex} />
            </Results>
          </HitsWrapper>
        )}
      </InstantSearch>
    </InstantSearchSSRProvider>
  )
}

// Only show the first hit per page (the index uses `distinct`), and count how
// many more hits the same page has.
const Hits = ({ hitComponent: HitComponent, selectedIndex }: any) => {
  const { items } = useHits<any>()
  const hits = items
    // Only article records have a path (the index also holds a revision record without text)
    .filter((hit) => hit.dataguidePath && hit._distinctSeqID == 0)
    .map((hit) => ({
      ...hit,
      moreCount: items.filter((other) => other.slug == hit.slug).length,
    }))

  return (
    <ul className="ais-Hits-list">
      {hits.map((hit, index) => (
        <li key={hit.objectID} className="ais-Hits-item">
          <HitComponent hit={hit} selected={index === selectedIndex} />
        </li>
      ))}
    </ul>
  )
}
