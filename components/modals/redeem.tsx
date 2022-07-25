import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal from './modal'
import { redeemContract } from 'lib/storage'
import { closeModal } from 'lib/utils'
import { useEffect, useState } from 'react'
import { getBalance } from 'lib/marina'

interface RedeemModalProps {
  contract: Contract | undefined
}

const RedeemModal = ({ contract }: RedeemModalProps) => {
  const modalId = 'redeem-modal'
  const [assetBalance, setAssetBalance] = useState(0)

  useEffect(() => {
    async function getSyntheticAssetBalance() {
      if (!contract) return
      setAssetBalance(await getBalance(contract.synthetic))
    }
    getSyntheticAssetBalance()
  })

  const ticker = contract?.synthetic.ticker
  const neededAmount = contract?.synthetic.quantity
  const hasFunds = neededAmount && assetBalance >= neededAmount
  const noFunds = neededAmount && assetBalance <  neededAmount

  return (
    <Modal id={modalId}>
      {hasFunds && (
        <>
          <Spinner />
          <h3 className="mt-4">Waiting for confirmation...</h3>
          <p>Redeem contract:</p>
          <Summary contract={contract} />
          <p className="confirm">
            Confirm this transaction in your Marina wallet
          </p>
        </>
      )}
      {noFunds && (
        <>
          <h3 className="mt-4">Insufficient funds to redeem contract</h3>
          <p>You need <strong>{neededAmount} {ticker}</strong></p>
          <p>Your balance is <strong>{assetBalance} {ticker}</strong></p>
        </>
      )}
    </Modal>
  )
}

export default RedeemModal
