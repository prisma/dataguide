import React from 'react'
// import CodeBlock from './codeBlock'
import ParallelBlocks from './parallelBlocks'
import TabbedContent from './tabbedContent'
import Code from './code'
import CodeWithResult, { Cmd, CmdResult } from './codeWithResult'
import Table from './table'
import ButtonLink from './button'
import FileWithIcon from './fileWithIcon'
import DocLink from './docLink'
import Subsections from './subSections'
import AuthorInfo from './authorInfo'
import Footnote from './footnote'
import Sidenote from './sideNote'
import PrismaOutlinks from './prismaOutlinks'
import PostgresCallout from '../cta/PostgresCallout'
import AnchorItem from './anchor-item'
import StatusNotice from './statusNotice'

export default {
  h1: () => <h1 style={{ display: 'none' }} />,
  p: (props: any) => <p className="paragraph" {...props} />,
  ul: (props: any) => <ul className="list" {...props} />,
  ol: (props: any) => <ol className="o-list" {...props} />,
  AuthorInfo,
  TabbedContent,
  ParallelBlocks,
  CodeWithResult,
  Cmd,
  CmdResult,
  FileWithIcon,
  // MDX 2 renders fenced code as <pre><code>, and inline code as a bare <code>
  pre: ({ children }: any) => {
    const code = React.Children.only(children)
    return (
      <pre>
        <Code {...code.props} />
      </pre>
    )
  },
  code: (props: any) => <code className="inline-code" {...props} />,
  table: Table,
  ButtonLink,
  Subsections,
  PrismaOutlinks,
  PostgresCallout,
  DocLink,
  Footnote,
  Sidenote,
  AnchorItem,
  StatusNotice,
  img: ({ src, ...props }: any) => {
    const newSrc = src.replace(/(\..\/)/g, '')
    return (
      <a href={newSrc} target="_blank" className="mdx-image">
        <img src={newSrc} {...props} />
      </a>
    )
  },
}
