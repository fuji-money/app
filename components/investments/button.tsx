
const InvestButton = () => {
  const enabled = true // TODO
  const setInvest = (bool: boolean) => {} // TODO
  return (
    <div className="has-text-centered">
      <button
        className="button is-primary"
        disabled={!enabled}
        onClick={() => setInvest(true)}
      >
        Invest
      </button>
    </div>
  )
}

export default InvestButton
