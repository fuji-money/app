import { NetworkContext } from 'components/providers/network'
import { useContext } from 'react'

interface ExplorerLinkProps {
  txid: string
}

const ExplorerLink = ({ txid }: ExplorerLinkProps) => {
  const { network } = useContext(NetworkContext)

  const href =
    network === 'testnet'
      ? `https://liquid.network/testnet/tx/${txid}`
      : `https://liquid.network/tx/${txid}`

  return (
    <a href={href} className="button external" target="_blank" rel="noreferrer">
      🔗 Open in explorer
    </a>
  )
}

export default ExplorerLink
