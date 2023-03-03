import * as React from 'react'
import styled from 'styled-components'
import ArrowEmail from '../../icons/ArrowEmail'
import * as valid from './valid'
import sendToMailchimp from './mailChimp'

const NewsLetterWrapper = styled.div`
  h2 {
    font-style: normal;
    font-weight: 600;
    line-height: 24px;
    color: var(--secondary-font-color);
  }

  p {
    margin: 16px 0;
    color: var(--code-inner-color);
  }
  .email {
    margin-top: 24px;
    display: flex;
    align-items: center;
    input {
      background: var(--code-bgd-color);
      border-radius: 4px;
      width: 100%;
      border: 0;
      height: 40px;
      font-size: 16px;
      font-weight: normal;
      padding: 0 15px;
      margin-right: 16px;
      font-family: Open Sans;

      &::placeholder {
        color: var(--code-inner-color);
      }
    }

    button {
      border: 0;
      height: 40px;
      color: #ffffff;
      font-family: Rubik;
      font-style: normal;
      font-weight: 500;
      font-size: 16px;
      line-height: 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 0 18px;
      svg {
        margin-left: 10px;
      }
      &[disabled] {
        cursor: default;
        opacity: 0.6;
      }

      background: #5a67d8;
      border-radius: 4px;
    }
  }
`

const Newsletter = ({ newsletter }: any) => {
  const [submitted, setSubmitted] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [validEmail, setValidEmail] = React.useState(false)

  const validate = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target
    if (!(target instanceof HTMLInputElement)) {
      return
    }
    const email = valid.email(target.value)
    if (email instanceof Error) {
      setEmail(target.value.toLowerCase())
      setValidEmail(false)
      return
    }
    setEmail(email)
    setValidEmail(true)
  }

  const submitEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await sendToMailchimp(email)
    setEmail('')
    setValidEmail(false)
    setSubmitted(true)
  }

  return (
    <NewsLetterWrapper>
      <h2>Get notified of new articles</h2>
      <p>{newsletter.text}</p>
    </NewsLetterWrapper>
  )
}

export default Newsletter
