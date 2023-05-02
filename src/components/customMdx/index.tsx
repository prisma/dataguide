import React from 'react'
// import CodeBlock from './codeBlock'
import ParallelBlocks from './parallelBlocks'
import TabbedContent from './tabbedContent'
import Code from './code'
import CodeWithResult from './codeWithResult'
import CollapseBox from './collapsible'
import Table from './table'
import ButtonLink from './button'
import FileWithIcon from './fileWithIcon'
import DocLink from './docLink'
import Subsections from './subSections'
import AuthorInfo from './authorInfo'
import Footnote from './footnote'
import Sidenote from './sideNote'
import PrismaOutlinks from './prismaOutlinks'
import AnchorItem from './anchor-item'
import { withPrefix } from 'gatsby'

export default {
  h1: () => <h1 style={{ display: 'none' }} />,
  p: (props: any) => <p className="paragraph" {...props} />,
  ul: (props: any) => <ul className="list" {...props} />,
  ol: (props: any) => <ol className="o-list" {...props} />,
  AuthorInfo,
  TabbedContent,
  ParallelBlocks,
  CodeWithResult,
  FileWithIcon,
  inlineCode: (props: any) => <code className="inline-code" {...props} />,
  code: Code,
  details: CollapseBox,
  table: Table,
  ButtonLink,
  Subsections,
  PrismaOutlinks,
  DocLink,
  footnote: Footnote,
  Sidenote,
  AnchorItem,
  img: ({ src, ...props }: any) => {
    console.log(withPrefix('/'))
    return (
      <a href={withPrefix(src)} target="_blank">
        <img src={withPrefix(src)} {...props} />
      </a>
    )
  }
}
