import 'styles/globals.scss'
import Layout from 'components/layout'
import type { AppProps } from 'next/app'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Head>
        <title>App - Fuji Money</title>
        <meta
          content="Borrow bitcoin-backed stable coins, synthetic stocks &amp; bonds without intermediaries."
          name="description"
        />
        <meta content="App - Fuji Money" property="og:title" />
        <meta
          content="Borrow bitcoin-backed stable coins, synthetic stocks &amp; bonds without intermediaries."
          property="og:description"
        />
        <meta
          content="https://raw.githubusercontent.com/fuji-money/website/main/src/images/og_image.png"
          property="og:image"
        />
        <meta content="App - Fuji Money" property="twitter:title" />
        <meta
          content="Borrow bitcoin-backed stable coins, synthetic stocks &amp; bonds without intermediaries."
          property="twitter:description"
        />
        <meta
          content="https://raw.githubusercontent.com/fuji-money/website/main/src/images/og_image.png"
          property="twitter:image"
        />
        <meta property="og:type" content="website" />
        <meta content="summary_large_image" name="twitter:card" />
        <link rel="shortcut icon" href="/images/favicon.png" />
      </Head>
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp
