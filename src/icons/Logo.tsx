import * as React from 'react'
import styled from 'styled-components'

export default (props: any) => (
  <Logo width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="64" height="64" rx="12" fill="url(#paint0_linear)" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M49.0186 46.0734L27.3284 52.4484C26.6657 52.6434 26.0306 52.0737 26.1699 51.4096L33.9186 14.5324C34.0635 13.8428 35.0227 13.7333 35.3254 14.3719L49.6725 44.648C49.9431 45.2191 49.6344 45.8926 49.0186 46.0734ZM52.7382 44.5696L36.1262 9.51376C35.7096 8.63739 34.8401 8.05838 33.8548 8.00476C32.8439 7.94626 31.9382 8.43076 31.4273 9.25539L13.4107 38.2542C12.8526 39.158 12.8635 40.2725 13.4424 41.1653L22.2492 54.7224C22.7741 55.5316 23.6835 56 24.6288 56C24.8967 56 25.1661 55.9625 25.4311 55.8845L50.9948 48.371C51.7779 48.1407 52.4182 47.5902 52.7533 46.8605C53.0873 46.1304 53.082 45.2949 52.7382 44.5696Z"
      fill="#EBF4FF"
    />
    <defs>
      <linearGradient
        id="paint0_linear"
        x1="32"
        y1="0"
        x2="32"
        y2="64"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#667EEA" />
        <stop offset="1" stopColor="#4C51BF" />
      </linearGradient>
    </defs>
  </Logo>
)

const Logo = styled.svg`
  height: 32px;
  width: 32px;
`
