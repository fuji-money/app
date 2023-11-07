import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Balance from 'components/balance'
import Title from 'components/title'
import { operationFromTask } from 'lib/utils'
import { EnablerButton } from './button'
import { Wallet, WalletType } from 'lib/wallet'
import { useContext, useEffect, useState } from 'react'
import { WalletContext } from 'components/providers/wallet'

interface EnablersLiquidProps {
  contract: Contract
  handler: (wallet: Wallet) => void
  task: string
}

function iconPathFromWallet(wallet: Wallet) {
  switch (wallet.type) {
    case 'marina':
      return '/images/marina.svg'
    case 'alby':
      return '/images/wallets/alby.svg'
    default:
      return ''
  }
}

function nameFromWallet(wallet: Wallet) {
  switch (wallet.type) {
    case 'marina':
      return 'Marina'
    case 'alby':
      return 'Alby (Liquid)'
    default:
      return ''
  }
}

const ENABLED_WALLET = [WalletType.Marina, WalletType.Alby]

const EnablersLiquid = ({
  contract,
  handler: handleWallet,
  task,
}: EnablersLiquidProps) => {
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
                  {wallets
                    .filter((w) => ENABLED_WALLET.includes(w.type))
                    .map((wallet, index) => (
                      <EnablerButton
                        key={index}
                        name={nameFromWallet(wallet)}
                        icon={iconPathFromWallet(wallet)}
                        handler={() => handleWallet(wallet)}
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

export default EnablersLiquid
