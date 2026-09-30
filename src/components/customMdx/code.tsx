import React from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import CopyButton from './copy'
import { stringify } from '../../utils/stringify'
import { copyableText, DIFF_MARKERS } from '../../utils/codeBlock'
import styled from 'styled-components'
import './prism/index.css'
require('./prism/prism-prisma')

interface PreCodeProps {
  children?: React.ReactNode
  className?: string
  [flag: string]: unknown
}

function cleanTokens(tokens: any[]) {
  const tokensLength = tokens.length
  if (tokensLength === 0) {
    return tokens
  }
  const lastToken = tokens[tokensLength - 1]

  if (lastToken.length === 1 && lastToken[0].empty) {
    return tokens.slice(0, tokensLength - 1)
  }
  return tokens
}

const propList = ['copy', 'bash-symbol']

const Code = ({ children, className, ...props }: PreCodeProps) => {
  let language = className ? className.replace(/language-/, '') : ''
  let breakWords = false

  if (propList.includes(language)) {
    breakWords = true
  }

  const code = stringify(children)

  // Every block can be copied, unless marked `no-copy`. `copy` is kept for older content.
  const hasCopy = !props['no-copy']
  // Diff highlighting only when asked for: lines of query output often start with - + or |
  const hasDiff = !!props['diff']
  const hasLineNo = props['line-number'] || language === 'line-number'
  const hasTerminalSymbol = props['bash-symbol'] || language === 'bash-symbol'
  const tokenCopyClass = `${hasCopy ? 'has-copy-button' : ''} ${breakWords ? 'break-words' : ''}`

  return (
    <>
      <div className="gatsby-highlight pre-highlight">
        <Highlight code={code} language={language || 'text'} theme={themes.github}>
          {({ className: blockClassName, style, tokens, getLineProps, getTokenProps }) => (
            <Pre className={blockClassName} style={style} tabIndex={0}>
              {hasCopy && (
                <AbsoluteCopyButton className="copy-button">
                  <CopyButton text={copyableText(code, hasDiff)} />
                </AbsoluteCopyButton>
              )}
              <code>
                {cleanTokens(tokens).map((line: any, i: number) => {
                  let lineClass = {
                    backgroundColor: '',
                    symbColor: '',
                  }

                  let isDiff = false
                  // let isHidden = false
                  let diffSymbol = ''

                  const diffBgColorMap: any = {
                    '+': 'var(--code-added-bg-color)',
                    '-': 'var(--code-deleted-bg-color)',
                    '|': 'var(--code-highlight-bg-color)',
                  }

                  const symColorMap: any = {
                    '+': 'var(--code-added-color)',
                    '-': 'var(--code-deleted-color)',
                    '|': 'var(--code-highlight-color)',
                  }

                  if (
                    hasDiff &&
                    ((line[0] &&
                      line[0].content.length &&
                      DIFF_MARKERS.includes(line[0].content[0])) ||
                      (line[0] &&
                        line[0].content === '' &&
                        line[1] &&
                        DIFF_MARKERS.includes(line[1].content)))
                  ) {
                    diffSymbol =
                      line[0] && line[0].content.length ? line[0].content[0] : line[1].content
                    lineClass = {
                      backgroundColor: diffBgColorMap[diffSymbol],
                      symbColor: symColorMap[diffSymbol],
                    }
                    isDiff = true
                  }

                  // if (
                  //   (line[0] && line[0].content.length && line[0].content[0] === '!') ||
                  //   (line[0] && line[0].content === '' && line[1] && line[1].content === '!')
                  // ) {
                  //   isHidden = true
                  // }

                  const lineProps = getLineProps({ line })

                  lineProps.style = isDiff ? { backgroundColor: lineClass.backgroundColor } : {}

                  return (
                    <Line key={line + i} {...lineProps}>
                      {hasTerminalSymbol && !isDiff && <LineNo>$</LineNo>}
                      {hasLineNo && !isDiff && <LineNo>{i + 1}</LineNo>}
                      {/* {hasTerminalSymbol && !isDiff && <LineNo>$</LineNo>}
                      {!hasTerminalSymbol && !isDiff && <LineNo>{i + 1}</LineNo>} */}
                      {isDiff && (
                        <LineNo style={{ color: lineClass.symbColor }}>
                          {diffSymbol !== '|' ? diffSymbol : hasLineNo ? i + 1 : ' '}
                        </LineNo>
                      )}
                      <LineContent className={`${tokenCopyClass}`}>
                        {line.map((token: any, key: any) => {
                          if (isDiff) {
                            if (
                              ((key === 0 || key === 1) &&
                                (token.content.charAt(0) === '+' ||
                                  token.content.charAt(0) === '-')) ||
                              token.content.charAt(0) === '|'
                            ) {
                              return (
                                <span
                                  key={key}
                                  {...getTokenProps({
                                    token: { ...token, content: token.content.slice(1) },
                                  })}
                                />
                              )
                            }
                          }
                          return <span key={key} {...getTokenProps({ token })} />
                        })}
                      </LineContent>
                    </Line>
                  )
                })}
              </code>
            </Pre>
          )}
        </Highlight>
      </div>
    </>
  )
}

export default Code

const AbsoluteCopyButton = styled.div`
  transition: opacity 100ms ease;
  position: absolute;
  top: 20px;
  right: 16px;
  z-index: 2;
  > div {
    right: -8px;
    top: -6px;
  }
`

const Pre = styled.pre`
  margin-top: 2rem;
  text-align: left;
  margin: 0 0 16px 0;
  padding: 2rem 1rem 1rem 1rem;
  overflow: auto;
  webkit-overflow-scrolling: touch;
`
const Line = styled.div`
  display: block;
`

const LineNo = styled.span`
  font-weight: 500;
  line-height: 24px;
  color: var(--code-linenum-color);
  display: inline-block;
  text-align: right;
  // padding-left: 1em;
  user-select: none;
  width: 24px;
`

const LineContent = styled.span`
  padding: 0 1em;
  &.break-words {
    display: inline-table;
    white-space: break-spaces;
    width: 95%;
  }

  &.token-line {
    line-height: 1.3rem;
    height: 1.3rem;
  }
`
