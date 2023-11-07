import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Title from 'components/title'
import Balance from 'components/balance'
import { operationFromTask } from 'lib/utils'
import { EnablerButton } from './button'
import { Wallet, WalletType } from 'lib/wallet'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'

interface EnablersLightningProps {
  contract: Contract
  handleInvoice: (wallet: Wallet) => Promise<void>
  task: string
}

const EnablersLightning = ({
  contract,
  handleInvoice,
  task,
}: EnablersLightningProps) => {
  const { wallets } = useContext(WalletContext)

  return (
    <section>
      <Title title={`Select method to ${operationFromTask(task)}`} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            <div className="is-box has-pink-border has-text-centered p-6">
              <div className="columns">
                <div className="column is-6">
                  {wallets.map((wallet, index) => (
                    <EnablerButton
                      key={index}
                      name={
                        wallet.type === WalletType.Marina
                          ? 'Lightning Invoice'
                          : 'Alby WebLN'
                      }
                      icon={
                        wallet.type === WalletType.Marina
                          ? '/images/networks/lightning.svg'
                          : '/images/companies/alby.png'
                      }
                      handler={() => handleInvoice(wallet)}
                    />
                  ))}
                </div>
                <div className="column is-6">
                  <Summary contract={contract} />
                </div>
              </div>
            </div>
          </div>
          <div className="column is-4">
            <Balance />
          </div>
        </div>
      </div>
    </section>
  )
}

export default EnablersLightning
