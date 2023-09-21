import Footer from 'components/footer'
import Navbar from 'components/navbar'
import { ReactNode } from 'react'
import Breadcrumbs from 'components/breadcrumbs'
import { WalletProvider } from 'components/providers/wallet'
import Banner from 'components/banner'
import { ContractsProvider } from 'components/providers/contracts'
import WeblnModal from 'components/modals/webln'
import { WeblnProvider } from 'components/providers/webln'
import MintLimitModal from 'components/modals/mintLimit'
import { ConfigProvider } from 'components/providers/config'

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
  return (
    <WalletProvider>
      <WeblnProvider>
        <ConfigProvider>
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
              <WeblnModal />
              <MintLimitModal />
            </div>
          </ContractsProvider>
        </ConfigProvider>
      </WeblnProvider>
    </WalletProvider>
  )
}
