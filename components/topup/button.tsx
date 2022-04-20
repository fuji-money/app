interface TopupButtonProps {
  minRatio: number
  ratio: number
  setPay: any
  topup: number
}

const TopupButton = ({ minRatio, ratio, setPay, topup }: TopupButtonProps) => {
  const enabled = topup > 0 && ratio >= minRatio

  return (
    <div className="has-text-centered">
      <button
        className="button is-primary is-cta"
        disabled={!enabled}
        onClick={() => setPay(true)}
      >
        Proceed to topup
      </button>
    </div>
  )
}

export default TopupButton
