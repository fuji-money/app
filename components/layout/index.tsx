import Footer from 'components/footer'
import Navbar from 'components/navbar'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'
import TradeModal from 'components/modals/trade'
import Breadcrumbs from 'components/breadcrumbs'
import { WalletProvider } from 'components/providers/wallet'
import Auth from 'components/auth'
import Banner from 'components/banner'
import { ContractsProvider } from 'components/providers/contracts'
import WeblnModal from 'components/modals/webln'

interface LayoutProps {
  children: ReactNode
}

const UseDesktopBanner = () => (
  <div className="container is-hidden-desktop">
    <div className="is-box has-pink-border mt-6 mx-6 has-text-centered">
      <h3>Fuji.Money is not supported on mobile devices</h3>
      <p>Use a browser on a desktop device</p>
    </div>
  </div>
)

export default function Layout({ children }: LayoutProps) {
  const { route } = useRouter()
  if (route === '/') {
    return (
      <main>
        <UseDesktopBanner />
        <div className="container is-hidden-touch">{children}</div>
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
        <ContractsProvider>
          <UseDesktopBanner />
          <div className="is-hidden-touch">
            <Banner />
            <Navbar />
            <main>
              <div className="container">
                <Breadcrumbs />
              </div>
              <div className="container">{children}</div>
            </main>
            <Footer />
            <TradeModal />
            <WeblnModal />
          </div>
        </ContractsProvider>
      </WalletProvider>
    </Auth>
  )
}
