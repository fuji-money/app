import 'styles/globals.scss'
import Layout from 'components/layout'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Script
        data-domain="app.fuji.money"
        src="https://analytics.fuji.money/js/plausible.js"
        strategy="lazyOnload"
      />
      <Head>
        <title>App - Fuji Money</title>
        <meta
          content="Borrow bitcoin-backed stablecoins &amp; synthetic assets without intermediaries."
          name="description"
        />
        <meta content="App - Fuji Money" property="og:title" />
        <meta
          content="Borrow bitcoin-backed stablecoins &amp; synthetic assets without intermediaries."
          property="og:description"
        />
        <meta
          content="https://raw.githubusercontent.com/fuji-money/website/main/images/og_image.png"
          property="og:image"
        />
        <meta content="App - Fuji Money" property="twitter:title" />
        <meta
          content="Borrow bitcoin-backed stablecoins &amp; synthetic assets without intermediaries."
          property="twitter:description"
        />
        <meta
          content="https://raw.githubusercontent.com/fuji-money/website/main/images/og_image.png"
          property="twitter:image"
        />
        <meta property="og:type" content="website" />
        <meta content="summary_large_image" name="twitter:card" />
        <link rel="shortcut icon" href="/favicon.png" />
      </Head>
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp
