interface TopupButtonProps {
  minRatio: number
  ratio: number
  setPay: any
}

const TopupButton = ({ minRatio, ratio, setPay }: TopupButtonProps) => {
  const enabled = ratio >= minRatio

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
