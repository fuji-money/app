const TradeButton = ({ hash }: { hash: string }) => {
  return (
    <a
      className="button"
      href={`https://trade.fuji.money/?asset_p=${hash}`}
      target="_blank"
      rel="noreferrer"
    >
      Trade
    </a>
  )
}

export default TradeButton
