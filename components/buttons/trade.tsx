const TradeButton = ({ hash }: { hash: string }) => {
  return (
    <a
      className="button"
      href={`https://trade.fuji.money/?asset=${hash}`}
      target="_blank"
      rel="noreferrer"
    >
      Trade
    </a>
  )
}

export default TradeButton
