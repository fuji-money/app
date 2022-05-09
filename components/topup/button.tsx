interface TopupButtonProps {
  minRatio: number
  ratio: number
  setDeposit: any
  topup: number
}

const TopupButton = ({
  minRatio,
  ratio,
  setDeposit,
  topup,
}: TopupButtonProps) => {
  const enabled = topup > 0 && ratio >= minRatio

  return (
    <div className="has-text-centered">
      <button
        className="button is-primary is-cta"
        disabled={!enabled}
        onClick={() => setDeposit(true)}
      >
        Proceed to topup
      </button>
    </div>
  )
}

export default TopupButton
