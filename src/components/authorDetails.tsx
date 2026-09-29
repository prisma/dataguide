import React from 'react'
import styled from 'styled-components'
import authorsJSON from '../../authors.json'
import { withPrefix } from 'gatsby'

const SingleAuthor = ({ authInfo }: any) => {
  const author = authorsJSON[authInfo as keyof typeof authorsJSON]
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
    <span className="about">About the author{authors.length > 1 ? 's' : ''}</span>
    {authors.map((author: any) => (
      <SingleAuthor key={author} authInfo={author} />
    ))}
  </AuthorInfoWrapper>
)

export default AuthorDetails

const AuthorInfoWrapper = styled.div`
  .author-item {
    margin: 0 -40px;
    padding: 24px 40px 0;
    line-height: 24px;
    display: flex;
    align-items: flex-start;
    color: var(--text-muted);
    font-size: 15px;
    @media (min-width: 0px) and (max-width: 767px) {
      margin: 0 -24px;
      padding: 24px 24px 0;
    }
  }

  img {
    flex-shrink: 0;
    height: 64px;
    width: 64px;
    border-radius: 999px;
    margin: 0 20px 0 0;
    object-fit: cover;
    border: 1px solid var(--border);
  }

  .name {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 500;
    padding: 0;
    margin: 0;
    border: 0;
    line-height: 24px;
    margin-bottom: 6px;
  }

  .about {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-subtle);
  }
`
