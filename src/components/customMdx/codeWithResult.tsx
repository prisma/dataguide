import React from 'react'
import styled from 'styled-components'

type CodeWithResultProps = { children?: React.ReactNode }

export const Cmd = ({ children }: CodeWithResultProps) => <div>{children}</div>
export const CmdResult = ({ children }: CodeWithResultProps) => <div>{children}</div>

const CodeWithResult = ({ children }: CodeWithResultProps) => {
  const [showResult, setShowResult] = React.useState(false)
  const childArray = React.Children.toArray(children) as React.ReactElement[]
  const cmd = childArray.filter((child) => child.type === Cmd)
  const result = childArray.filter((child) => child.type === CmdResult)

  const toggleResult = () => setShowResult(!showResult)

  return (
    <Wrapper>
      <div className="cmd">{cmd}</div>
      <div className="result">
        <div onClick={toggleResult} className="show-btn">
          {showResult ? `Hide result` : `Show result`}
        </div>
        {showResult && <div className="result-code">{result}</div>}
      </div>
    </Wrapper>
  )
}

export default CodeWithResult

const Wrapper = styled.div`
  margin-top: 2rem;
  .cmd .pre-highlight pre {
    border-radius: 12px 12px 0px 0px;
  }

  .result {
    background: var(--code-result-bg-color);
    border: 1px solid var(--border);
    border-top: 0;
    border-radius: 0px 0px 12px 12px;
    margin-top: -16px;

    pre {
      background: var(--code-result-bg-color) !important;
      border: 0;
      border-top: 1px dashed var(--border-strong);
      border-radius: 0px 0px 12px 12px;
      margin-top: 0;
    }

    .show-btn {
      font-family: var(--font-sans);
      font-style: normal;
      font-weight: 500;
      font-size: 13px;
      line-height: 100%;
      color: var(--accent);
      height: 36px;
      display: flex;
      padding-left: 1rem;
      align-items: center;
      cursor: pointer;
      &:hover {
        color: var(--accent-strong);
      }
    }
  }

  @media (min-width: 0px) and (max-width: 767px) {
    .result {
      margin-left: -24px;
      margin-right: -24px;
      border-radius: 0;
      border-left: 0;
      border-right: 0;
    }
  }
`
