import React from 'react'
import styled from 'styled-components'
import authorsJSON from '../../authors.json'
import { withPrefix } from 'gatsby'

const SingleAuthor = ({ authInfo }: any) => {
  const author = authorsJSON[authInfo]
  return (
    <div className="author-item">
      {author.avatar && <img alt={author.name} src={withPrefix(author.avatar)} />}
      <div>
        {author.name && <h3 className="name">{author.name}</h3>}
        {author.bio}
      </div>
    </div>
  )
}

const AuthorDetails = ({ authors }: any) => (
  <AuthorInfoWrapper>
    <span className="about">About the Author(s)</span>
    {authors.map((author: any) => (
      <SingleAuthor authInfo={author} />
    ))}
  </AuthorInfoWrapper>
)

export default AuthorDetails

const AuthorInfoWrapper = styled.div`
  .author-item {
    margin: 0 -40px;
    padding: 32px 40px 0;
    line-height: 24px;
    display: flex;
  }

  img {
    height: 90px;
    width: 90px;
    border-radius: 2px;
    margin-right: 28px;
  }

  .name {
    padding: 0;
    margin: 0;
    border: 0;
    line-height: 24px;
    margin-bottom: 10px;
  }

  .about {
    color: var(--list-bullet-color);
    font-size: 14px;
    margin-bottom: 3px;
  }
`
