import React from 'react'
import styled from 'styled-components'

interface AuthorProps {
  name?: string
  image?: string
}

type AuthorInfoProps = React.ReactNode & AuthorProps

const AuthorInfo = ({ children, ...props }: AuthorInfoProps) => {
  return (
    <AuthorInfoWrapper>
      {props.image && <img src={props.image} />}
      <div>
        <span className="about">About the Author</span>
        {props.name && <h3 className="name">{props.name}</h3>}
        {children}
      </div>
    </AuthorInfoWrapper>
  )
}

export default AuthorInfo

const AuthorInfoWrapper = styled.div`
  border-top: 1px solid var(--border-color);
  margin: 0 -40px;
  padding: 32px 40px 0;
  line-height: 24px;
  display: flex;

  img {
    height: 80px;
    width: 80px;
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
