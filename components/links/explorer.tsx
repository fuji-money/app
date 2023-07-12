interface ExplorerLinkProps {
  extraClass?: string
  txid: string
  network: string
}

const ExplorerLink = ({ extraClass, txid, network }: ExplorerLinkProps) => {
  const href =
    network === 'testnet'
      ? `https://blockstream.info/liquidtestnet/tx/${txid}`
      : `https://blockstream.info/liquid/tx/${txid}`

  return (
    <a
      href={href}
      className={`button external ${extraClass}`}
      target="_blank"
      rel="noreferrer"
    >
      🔗 Open in explorer
    </a>
  )
}

export default ExplorerLink
