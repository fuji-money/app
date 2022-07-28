import Footer from 'components/footer'
import Navbar from 'components/navbar'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'
import TradeModal from 'components/modals/trade'
import Breadcrumbs from 'components/breadcrumbs'
import { WalletProvider } from 'components/providers/wallet'
import { NetworkProvider } from 'components/providers/network'
import Auth from 'components/auth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { route } = useRouter()
  if (route === '/') {
    return (
      <main>
        <div className="container">{children}</div>
        <style jsx>{`
          main {
            background-image: url('/images/homebg.svg');
            background-size: 120% auto;
            background-position: bottom -40px;
            background-repeat: no-repeat;
          }
        `}</style>
      </main>
    )
  }
  return (
    <Auth>
      <WalletProvider>
        <NetworkProvider>
          <Navbar />
          <main>
            <div className="container">
              <Breadcrumbs />
            </div>
            <div className="container">{children}</div>
          </main>
          <Footer />
          <TradeModal />
        </NetworkProvider>
      </WalletProvider>
    </Auth>
  )
}
