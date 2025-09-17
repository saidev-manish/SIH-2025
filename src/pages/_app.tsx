import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          integrity="sha256-BPfK9M5v34c2XP6p0cxVz1mUQLst0gTLk0mlc7kuodA="
          crossOrigin=""
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}